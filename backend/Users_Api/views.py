from django.shortcuts import render
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, AllowAny
from .serializers import (
    RegisterSerializer,
    UserSerializer,
    ChangePasswordSerializer,
    CustomTokenObtainPairSerializer,
    UserSettingsSerializer,
    SetEmailSerializer,
    VerifyEmailCodeSerializer,
    AutoSaveSettingsSerializer
)
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth.tokens import default_token_generator
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from .throttling import (
    RegisterRateThrottle,
    ProfileRateThrottle,
    ChangePasswordRateThrottle,
    TokenRateThrottle,
    TokenRefreshRateThrottle,
    PasswordResetRateThrottle,
    PasswordResetConfirmRateThrottle,
)
from .loging import log_event
from .tasks import (
    send_confirmation_email,
    send_change_password_email,
    send_password_reset_email,
)
from .models import UserSettings


# Create your views here.
User = get_user_model()


class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    throttle_classes = [RegisterRateThrottle]
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        user = serializer.save()
        send_confirmation_email.delay(user.id)
        log_event(self.request, user, "register")


class ProfileUserView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        serializer = UserSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class PasswordValidateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        password = request.data.get("password")

        if not password:
            return Response({"detail": "Password required"}, status=400)

        if request.user.check_password(password):
            return Response({"valid": True})
        return Response({"valid": False}, status=400)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh_token")
            token = RefreshToken(refresh_token)
            token.blacklist()
            log_event(request, request.user, "logout")
            return Response(
                {"detail": "Successfully logged out."},
                status=status.HTTP_205_RESET_CONTENT,
            )
        except Exception as e:
            return Response(
                {"detail": "Error logging out."}, status=status.HTTP_400_BAD_REQUEST
            )


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [ChangePasswordRateThrottle]

    def post(self, request):
        user = request.user
        serializer = ChangePasswordSerializer(data=request.data)

        if serializer.is_valid():
            
            if not user.check_password(serializer.validated_data["current_password"]):
                
                return Response(
                    {"current_password": ["Wrong password."]},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            
            user.set_password(serializer.validated_data["new_password"])
            user.save()

            send_change_password_email.delay(user.id)

            log_event(request, user, "password_change")
            return Response(
                {"detail": "Password successfully changed."}, status=status.HTTP_200_OK
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [PasswordResetRateThrottle]

    def post(self, request):
        email = request.data.get("email")
        print(email)
        try:
            user = User.objects.get(email=email)
            send_password_reset_email.delay(user.id)
        except User.DoesNotExist:
            pass

        return Response(
            {"detail": "If an account with that email exists, a reset link was sent."},
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [PasswordResetConfirmRateThrottle]

    def post(self, request):
        uidb64 = request.data.get("uid")
        token = request.data.get("token")
        new_password = request.data.get("password")

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(id=uid)

            if not default_token_generator.check_token(user, token):
                return Response(
                    {"detail": "Invalid or expired token."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user.set_password(new_password)
            user.save()
            log_event(request, user, "password_reset")
            return Response(
                {"detail": "Password has been reset successfully."},
                status=status.HTTP_200_OK,
            )

        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            return Response(
                {"detail": "Invalid request."}, status=status.HTTP_400_BAD_REQUEST
            )


class CustomTokenObtainPairView(TokenObtainPairView):
    throttle_classes = [TokenRateThrottle]
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code != 200:
            email = request.data.get("email") or request.data.get("username")
            from django.contrib.auth import get_user_model

            User = get_user_model()
            try:
                user = User.objects.get(email=email)
                log_event(request, user, "login_failed")
            except User.DoesNotExist:
                pass
        return response


class CustomTokenRefreshView(TokenRefreshView):
    throttle_classes = [TokenRefreshRateThrottle]
    permission_classes = [AllowAny]


class EmailVerificationView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [RegisterRateThrottle]

    def post(self, request):
        uid = request.data.get("uid")
        token = request.data.get("token")
        try:
            uid = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=uid)

            if not default_token_generator.check_token(user, token):
                return Response(
                    {"detail": "Invalid or expired token."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user.is_active = True
            user.save()

            return Response(
                {"detail": "Email verified successfully."}, status=status.HTTP_200_OK
            )

        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            return Response(
                {"detail": "Invalid request."}, status=status.HTTP_400_BAD_REQUEST
            )


class UserSettingsView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSettingsSerializer

    def get_object(self):
        return self.request.user.settings

    def perform_update(self, serializer):
        return serializer.save()


class SetEmailView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SetEmailSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            serializer.save()
            return Response({"detail": "Verification code sent."})
        return Response(serializer.errors, status=400)


class VerifyEmailCodeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = VerifyEmailCodeSerializer(
            data=request.data, context={"request": request}
        )
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            return Response({"detail": "Email updated successfully."})
        return Response(serializer.errors, status=400)



class ChangeUsernameView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user 

    def update(self, request, *args, **kwargs):
        if "username" not in request.data:
            return Response(
                {"detail": "Поле 'username' є обов'язковим."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(self.get_object(), data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class AutoSaveSettingsView(APIView):
    permission_classes=[IsAuthenticated]
    
    def get(self,request):
        try:
            settings=request.user.usersettings
        except UserSettings.DoesNotExist:
            return Response({"detail": "User settings not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer=AutoSaveSettingsSerializer(settings)
        return Response(serializer.data,status=status.HTTP_200_OK)

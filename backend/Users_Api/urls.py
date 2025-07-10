from django.urls import path, include
from .views import (CreateUserView ,ProfileUserView,LogoutView, ChangePasswordView,
                    PasswordResetView,PasswordResetConfirmView, CustomTokenObtainPairView,
                    CustomTokenRefreshView,EmailVerificationView,UserSettingsView,
                    PasswordValidateView,SetEmailView,VerifyEmailCodeView,ChangeUsernameView,AutoSaveSettingsView,SupportRequestView)

urlpatterns = [
    path('user/register/', CreateUserView.as_view(), name='register'),
    path('user/me/', ProfileUserView.as_view(), name='profile'),
    path('user/logout/',LogoutView.as_view(), name='logout'),
    path('user/change_password/', ChangePasswordView.as_view(), name='change_password'),
    path('user/token/', CustomTokenObtainPairView.as_view(), name='get_token'),
    path('user/token/refresh/', CustomTokenRefreshView.as_view(), name='refresh_token'),
    path('user/password_reset/', PasswordResetView.as_view(), name='password_reset'),
    path('user/password_reset_confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('user/activation/',EmailVerificationView.as_view(), name='email_verification'),
    path('settings/', UserSettingsView.as_view(), name='user_settings'),
    path('user/password/validate/',PasswordValidateView.as_view(), name='password_validate'),
    path('users/email_confirmation_code/',SetEmailView.as_view(),name='send_email_confirmation_code'),
    path('users/verify_email_code/',VerifyEmailCodeView.as_view(),name='verify_email_code'),
    path('user/change_username/',ChangeUsernameView.as_view(),name='change_username'),
    path('settings/autosave/',AutoSaveSettingsView.as_view(),name='autosave_settings'),
    path("support/", SupportRequestView.as_view(), name="support_request"),
    path('api-auth',include('rest_framework.urls', namespace='rest_framework'))
]

from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import CustomUser
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.utils.crypto import get_random_string
from .loging import log_event
from django.core.cache import cache
from .tasks import send_email_confirmation_code
from .models import UserSettings

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    def validate_password(self, value):
        validate_password(value)
        return value

    class Meta:
        model = CustomUser
        fields = ["id", "email", "password"]

    def create(self, validated_data):
        user = CustomUser(
            email=validated_data["email"],
            username=validated_data["email"],
            is_active=False,
        )
        user.set_password(validated_data["password"])
        user.save()

        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ["id", "email", "username"]


class UserSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = "__all__"
        read_only_fields = ["user"]
        
class AutoSaveSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSettings
        fields = ['autosave_enabled', 'autosave_interval_minutes']




class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True)

    def validate_new_password(self, value):
        validate_password(value)
        return value


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        if not self.user.is_active:
            raise serializers.ValidationError("Account is not activated.")
        request = self.context["request"]
        log_event(request, self.user, "login_success")
        return data


class SetEmailSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        user_model = self.context["request"].user.__class__
        if user_model.objects.filter(email=value).exists():
            raise serializers.ValidationError("Цей email вже зайнятий.")
        return value

    def save(self, **kwargs):
        email = self.validated_data["email"]
        user = self.context["request"].user
        code = get_random_string(6, allowed_chars="0123456789")
        key = f"email_change:{user.id}"
        cache.set(key, {"code": code, "email": email}, timeout=600)
        send_email_confirmation_code.delay(email, code)


class VerifyEmailCodeSerializer(serializers.Serializer):
    code=serializers.CharField(max_length=6)
    
    def validate_code(self,value):
        if not value.isdigit():
            raise serializers.ValidationError("Invalid code format.")
        return value
    
    def save(self, **kwargs):
        user=self.context['request'].user
        key= f"email_change:{user.id}"
        data=cache.get(key)
        
        if not data:
            raise serializers.ValidationError("Verification code expired or not found.")
        
        stored_code = data.get("code", "")
        new_email = data.get("email", "")
        
        if self.validated_data['code'] !=stored_code:
            raise serializers.ValidationError("Invalid verification code.")
        
        user.email=new_email
        user.save()
        cache.delete(key)
        
        
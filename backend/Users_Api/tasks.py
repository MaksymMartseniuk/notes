from celery import shared_task
from django.core.cache import cache
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.template.loader import render_to_string
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import EmailMultiAlternatives, send_mail
from django.contrib.auth import get_user_model
from django.utils.html import strip_tags
User = get_user_model()
@shared_task
def send_confirmation_email(user_id):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return

    uid = urlsafe_base64_encode(force_bytes(user.id))
    token = default_token_generator.make_token(user)
    confirmation_url = f"http://localhost:5173/activate/{uid}/{token}/"

    html_content = render_to_string(
        "email/confirmation_email.html",
        {"user": user, "confirmation_link": confirmation_url},
    )
    subject = "Activate your account"
    from_email = None 
    to = [user.email]

    msg = EmailMultiAlternatives(subject, "", from_email, to)
    msg.attach_alternative(html_content, "text/html")
    msg.send()


@shared_task
def send_change_password_email(user_id):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return

    html_content = render_to_string("email/change_password_email.html", {"user": user})
    subject = "Password Changed"
    from_email = None
    to = [user.email]

    msg = EmailMultiAlternatives(subject, "", from_email, to)
    msg.attach_alternative(html_content, "text/html")
    msg.send()



@shared_task
def send_password_reset_email(user_id):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return

    uid = urlsafe_base64_encode(force_bytes(user.id))
    token = default_token_generator.make_token(user)
    reset_url = f"http://localhost:5173/reset-password/{uid}/{token}/"
    
    html_content = render_to_string(
        "email/password_reset_email.html",
        {"user": user, "reset_link": reset_url}
    )

    subject = "Password Reset Request"
    from_email = None  
    to = [user.email]

    msg = EmailMultiAlternatives(subject, "", from_email, to)
    msg.attach_alternative(html_content, "text/html")
    msg.send()


@shared_task
def send_email_confirmation_code(email, code):
    
    html_content = render_to_string(
        "email/send_email_confirmation_code.html", {"email": email, "code": code}
    )
    subject = "Email Confirmation Code"
    from_email = None
    to = [email]

    msg = EmailMultiAlternatives(subject, "", from_email, to)
    msg.attach_alternative(html_content, "text/html")
    msg.send()
    
    
@shared_task
def send_support_request_email(email, subject, message):
    # Підготовка HTML-контенту листа
    html_content = render_to_string(
        "email/support_request_email.html",
        {
            "email": email,
            "subject": subject,
            "message": message
        }
    )
    text_content = strip_tags(html_content)
    full_subject = f"Support Request: {subject}"
    from_email = None
    reply_to = [email] 

    # Адреса отримувача
    to = ["support@gmail.com"]

    # Створюємо і відправляємо листа
    msg = EmailMultiAlternatives(
        subject=full_subject,
        body=text_content,
        from_email=from_email,
        to=to,
        reply_to=reply_to
    )
    msg.attach_alternative(html_content, "text/html")
    msg.send()
    

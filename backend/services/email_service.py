from config import settings


def send_password_reset_email(recipient: str, token: str) -> None:
    if not settings.ses_from_email and not settings.smtp_from_email:
        if settings.is_production:
            raise RuntimeError("Remetente de e-mail não configurado")
        return

    reset_url = f"{settings.frontend_url.rstrip('/')}/reset-password?token={token}"
    subject = "Redefinição de senha IncluseON"
    body = (
        "Recebemos uma solicitação para redefinir sua senha. "
        f"Use este link em até 30 minutos: {reset_url}\n\n"
        "Se você não solicitou a alteração, ignore esta mensagem."
    )

    if settings.smtp_host:
        import smtplib
        from email.message import EmailMessage

        message = EmailMessage()
        message["From"] = settings.smtp_from_email
        message["To"] = recipient
        message["Subject"] = subject
        message.set_content(body)

        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as client:
            client.starttls()
            client.login(
                settings.smtp_username,
                settings.smtp_password.get_secret_value(),
            )
            client.send_message(message)
        return

    import boto3

    client = boto3.client("sesv2", region_name=settings.s3_region)
    client.send_email(
        FromEmailAddress=settings.ses_from_email,
        Destination={"ToAddresses": [recipient]},
        Content={
            "Simple": {
                "Subject": {"Data": subject, "Charset": "UTF-8"},
                "Body": {
                    "Text": {
                        "Data": body,
                        "Charset": "UTF-8",
                    }
                },
            }
        },
    )

from config import settings


def send_password_reset_email(recipient: str, token: str) -> None:
    if not settings.ses_from_email:
        if settings.is_production:
            raise RuntimeError("SES_FROM_EMAIL não configurado")
        return

    reset_url = f"{settings.frontend_url.rstrip('/')}/reset-password?token={token}"
    import boto3

    client = boto3.client("sesv2", region_name=settings.s3_region)
    client.send_email(
        FromEmailAddress=settings.ses_from_email,
        Destination={"ToAddresses": [recipient]},
        Content={
            "Simple": {
                "Subject": {"Data": "Redefinição de senha IncluseON", "Charset": "UTF-8"},
                "Body": {
                    "Text": {
                        "Data": (
                            "Recebemos uma solicitação para redefinir sua senha. "
                            f"Use este link em até 30 minutos: {reset_url}\n\n"
                            "Se você não solicitou a alteração, ignore esta mensagem."
                        ),
                        "Charset": "UTF-8",
                    }
                },
            }
        },
    )

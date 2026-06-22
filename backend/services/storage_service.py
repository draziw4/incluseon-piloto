from pathlib import Path, PurePosixPath
from urllib.parse import urlparse

from config import settings


def store_report(local_path: Path) -> str:
    if settings.storage_backend == "local":
        return str(local_path)

    key = f"reports/{local_path.name}"
    _s3_client().upload_file(
        str(local_path),
        settings.s3_bucket,
        key,
        ExtraArgs={
            "ContentType": "application/pdf",
            "ServerSideEncryption": "AES256",
        },
    )
    return f"s3://{settings.s3_bucket}/{key}"


def read_report(reference: str) -> bytes | None:
    if reference.startswith("s3://"):
        bucket, key = _parse_s3_reference(reference)
        try:
            response = _s3_client().get_object(Bucket=bucket, Key=key)
            return response["Body"].read()
        except _s3_client().exceptions.NoSuchKey:
            return None

    candidate = _resolve_local_reference(reference)
    if not candidate or not candidate.is_file():
        return None
    return candidate.read_bytes()


def delete_report(reference: str) -> bool:
    if reference.startswith("s3://"):
        bucket, key = _parse_s3_reference(reference)
        _s3_client().delete_object(Bucket=bucket, Key=key)
        return True

    candidate = _resolve_local_reference(reference)
    if candidate is None:
        return False
    try:
        candidate.unlink(missing_ok=True)
    except OSError:
        return False
    return True


def _resolve_local_reference(reference: str, root: Path | None = None) -> Path | None:
    reports_root = (root or Path(settings.reports_directory)).resolve()
    candidate = Path(reference)
    if not candidate.is_absolute():
        candidate = Path.cwd() / candidate
    candidate = candidate.resolve()
    if not candidate.is_relative_to(reports_root) or candidate.suffix.lower() != ".pdf":
        return None
    return candidate


def _parse_s3_reference(reference: str) -> tuple[str, str]:
    parsed = urlparse(reference)
    key = str(PurePosixPath(parsed.path.lstrip("/")))
    if parsed.scheme != "s3" or parsed.netloc != settings.s3_bucket or not key.startswith("reports/"):
        raise ValueError("Referência de relatório inválida")
    return parsed.netloc, key


def _s3_client():
    try:
        import boto3
    except ImportError as error:
        raise RuntimeError("boto3 é obrigatório para STORAGE_BACKEND=s3") from error

    return boto3.client(
        "s3",
        region_name=settings.s3_region,
        endpoint_url=settings.s3_endpoint_url,
    )

from config import settings


def ensure_storage() -> None:
    if settings.storage_backend != "s3":
        return

    import boto3
    from botocore.exceptions import ClientError

    client = boto3.client(
        "s3",
        region_name=settings.s3_region,
        endpoint_url=settings.s3_endpoint_url,
    )
    try:
        client.head_bucket(Bucket=settings.s3_bucket)
        return
    except ClientError:
        pass

    options = {"Bucket": settings.s3_bucket}
    if not settings.s3_endpoint_url and settings.s3_region != "us-east-1":
        options["CreateBucketConfiguration"] = {
            "LocationConstraint": settings.s3_region
        }
    client.create_bucket(**options)


if __name__ == "__main__":
    ensure_storage()

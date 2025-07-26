import boto3
import logging
from typing import Optional
from botocore.exceptions import ClientError, NoCredentialsError
from core.config import settings

logger = logging.getLogger(__name__)


class S3Client:
    """AWS S3 client wrapper with credential management."""
    
    def __init__(self):
        self._client = None
        self._session = None
    
    @property
    def client(self):
        """Lazy initialization of S3 client with credential detection."""
        if self._client is None:
            self._client = self._create_client()
        return self._client
    
    def _create_client(self):
        """Create S3 client with automatic credential detection."""
        try:
            # Create session for credential management
            session_kwargs = {}
            
            # Use explicit credentials if provided
            if settings.aws_access_key_id and settings.aws_secret_access_key:
                session_kwargs.update({
                    'aws_access_key_id': settings.aws_access_key_id,
                    'aws_secret_access_key': settings.aws_secret_access_key,
                })
                logger.info("Using explicit AWS credentials from environment")
            else:
                logger.info("Using default AWS credential chain")
            
            # Create session and client
            session = boto3.Session(**session_kwargs)
            client = session.client('s3', region_name=settings.aws_default_region)
            
            # Test credentials by listing buckets
            try:
                client.list_buckets()
                logger.info("AWS S3 client initialized successfully")
            except ClientError as e:
                logger.warning(f"S3 client created but credentials may be invalid: {e}")
            
            return client
            
        except NoCredentialsError:
            logger.error("No AWS credentials found. Please configure credentials.")
            raise
        except Exception as e:
            logger.error(f"Failed to create S3 client: {e}")
            raise
    
    def upload_file(self, file_obj, bucket: str, key: str, content_type: str = None) -> bool:
        """Upload file to S3 bucket."""
        try:
            extra_args = {}
            if content_type:
                extra_args['ContentType'] = content_type
            
            self.client.upload_fileobj(file_obj, bucket, key, ExtraArgs=extra_args)
            logger.info(f"Successfully uploaded {key} to {bucket}")
            return True
            
        except ClientError as e:
            logger.error(f"Failed to upload {key} to {bucket}: {e}")
            return False
    
    def delete_object(self, bucket: str, key: str) -> bool:
        """Delete object from S3 bucket."""
        try:
            self.client.delete_object(Bucket=bucket, Key=key)
            logger.info(f"Successfully deleted {key} from {bucket}")
            return True
            
        except ClientError as e:
            logger.error(f"Failed to delete {key} from {bucket}: {e}")
            return False
    
    def object_exists(self, bucket: str, key: str) -> bool:
        """Check if object exists in S3 bucket."""
        try:
            self.client.head_object(Bucket=bucket, Key=key)
            return True
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                return False
            logger.error(f"Error checking if {key} exists in {bucket}: {e}")
            return False
    
    def get_object_url(self, bucket: str, key: str) -> str:
        """Get public URL for S3 object."""
        if settings.cloudfront_domain:
            return f"https://{settings.cloudfront_domain}/{key}"
        else:
            return f"https://{bucket}.s3.{settings.aws_default_region}.amazonaws.com/{key}"


# Global S3 client instance
s3_client = S3Client()

import uuid
import logging
from datetime import datetime
from typing import Optional, Dict, Any
from botocore.exceptions import ClientError
from core.config import settings
from .s3_client import s3_client

logger = logging.getLogger(__name__)


class PresignService:
    """Service for generating presigned URLs for S3 uploads."""
    
    @staticmethod
    def generate_presigned_url(
        filename: str,
        content_type: Optional[str] = None,
        max_size_bytes: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Generate a presigned URL for uploading a file to S3.
        
        Args:
            filename: Original filename
            content_type: MIME type of the file
            max_size_bytes: Maximum file size in bytes
            
        Returns:
            Dictionary containing presigned URL and metadata
        """
        try:
            # Generate unique key for the file
            file_extension = filename.split('.')[-1] if '.' in filename else ''
            unique_key = f"images/{uuid.uuid4()}.{file_extension}" if file_extension else f"images/{uuid.uuid4()}"
            
            # Set default max size if not provided
            if max_size_bytes is None:
                max_size_bytes = settings.max_image_size_mb * 1024 * 1024
            
            # Prepare conditions for presigned POST
            conditions = [
                {"bucket": settings.s3_images_bucket},
                {"key": unique_key},
                ["content-length-range", 1, max_size_bytes]
            ]
            
            # Add content type condition if provided
            if content_type:
                conditions.append({"Content-Type": content_type})
            
            # Generate presigned POST URL
            presigned_post = s3_client.client.generate_presigned_post(
                Bucket=settings.s3_images_bucket,
                Key=unique_key,
                Fields={"Content-Type": content_type} if content_type else None,
                Conditions=conditions,
                ExpiresIn=settings.presigned_url_expiration
            )
            
            # Get the public URL for the uploaded file
            public_url = s3_client.get_object_url(settings.s3_images_bucket, unique_key)
            
            logger.info(f"Generated presigned URL for {filename} -> {unique_key}")
            
            return {
                "upload_url": presigned_post["url"],
                "fields": presigned_post["fields"],
                "key": unique_key,
                "public_url": public_url,
                "expires_in": settings.presigned_url_expiration,
                "max_size_bytes": max_size_bytes,
                "created_at": datetime.utcnow().isoformat()
            }
            
        except ClientError as e:
            logger.error(f"Failed to generate presigned URL for {filename}: {e}")
            raise Exception(f"Failed to generate upload URL: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error generating presigned URL: {e}")
            raise Exception(f"Failed to generate upload URL: {str(e)}")
    
    @staticmethod
    def generate_presigned_get_url(key: str, expires_in: int = 3600) -> str:
        """
        Generate a presigned URL for downloading/viewing a file from S3.
        
        Args:
            key: S3 object key
            expires_in: URL expiration time in seconds (default: 1 hour)
            
        Returns:
            Presigned GET URL
        """
        try:
            url = s3_client.client.generate_presigned_url(
                'get_object',
                Params={'Bucket': settings.s3_images_bucket, 'Key': key},
                ExpiresIn=expires_in
            )
            
            logger.info(f"Generated presigned GET URL for {key}")
            return url
            
        except ClientError as e:
            logger.error(f"Failed to generate presigned GET URL for {key}: {e}")
            raise Exception(f"Failed to generate download URL: {str(e)}")
    
    @staticmethod
    def validate_file_type(content_type: str) -> bool:
        """
        Validate if the content type is allowed for upload.
        
        Args:
            content_type: MIME type to validate
            
        Returns:
            True if allowed, False otherwise
        """
        return content_type.lower() in [ct.lower() for ct in settings.allowed_image_types]
    
    @staticmethod
    def validate_file_size(size_bytes: int) -> bool:
        """
        Validate if the file size is within allowed limits.
        
        Args:
            size_bytes: File size in bytes
            
        Returns:
            True if within limits, False otherwise
        """
        max_size = settings.max_image_size_mb * 1024 * 1024
        return 0 < size_bytes <= max_size

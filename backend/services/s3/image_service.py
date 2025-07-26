import logging
from typing import List, Optional, Dict, Any
from core.config import settings
from .s3_client import s3_client
from .presign_service import PresignService

logger = logging.getLogger(__name__)


class ImageService:
    """Service for handling image operations in S3."""
    
    @staticmethod
    def get_upload_url(
        filename: str,
        content_type: Optional[str] = None,
        file_size: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Get a presigned URL for image upload with validation.
        
        Args:
            filename: Original filename
            content_type: MIME type of the image
            file_size: Size of the file in bytes
            
        Returns:
            Dictionary with upload URL and metadata
            
        Raises:
            ValueError: If validation fails
        """
        # Validate content type if provided
        if content_type and not PresignService.validate_file_type(content_type):
            allowed_types = ", ".join(settings.allowed_image_types)
            raise ValueError(f"Invalid file type. Allowed types: {allowed_types}")
        
        # Validate file size if provided
        if file_size and not PresignService.validate_file_size(file_size):
            max_size_mb = settings.max_image_size_mb
            raise ValueError(f"File size exceeds maximum allowed size of {max_size_mb}MB")
        
        # Generate presigned URL
        return PresignService.generate_presigned_url(
            filename=filename,
            content_type=content_type,
            max_size_bytes=file_size
        )
    
    @staticmethod
    def delete_image(key: str) -> bool:
        """
        Delete an image from S3.
        
        Args:
            key: S3 object key
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Validate that the key is in the images directory
            if not key.startswith("images/"):
                logger.warning(f"Attempted to delete non-image key: {key}")
                return False
            
            success = s3_client.delete_object(settings.s3_images_bucket, key)
            if success:
                logger.info(f"Successfully deleted image: {key}")
            else:
                logger.error(f"Failed to delete image: {key}")
            
            return success
            
        except Exception as e:
            logger.error(f"Error deleting image {key}: {e}")
            return False
    
    @staticmethod
    def delete_images(keys: List[str]) -> Dict[str, bool]:
        """
        Delete multiple images from S3.
        
        Args:
            keys: List of S3 object keys
            
        Returns:
            Dictionary mapping keys to success status
        """
        results = {}
        for key in keys:
            results[key] = ImageService.delete_image(key)
        return results
    
    @staticmethod
    def get_image_url(key: str, use_cloudfront: bool = True) -> str:
        """
        Get the public URL for an image.
        
        Args:
            key: S3 object key
            use_cloudfront: Whether to use CloudFront URL if available
            
        Returns:
            Public URL for the image
        """
        if use_cloudfront and settings.cloudfront_domain:
            return f"https://{settings.cloudfront_domain}/{key}"
        else:
            return f"https://{settings.s3_images_bucket}.s3.{settings.aws_default_region}.amazonaws.com/{key}"
    
    @staticmethod
    def image_exists(key: str) -> bool:
        """
        Check if an image exists in S3.
        
        Args:
            key: S3 object key
            
        Returns:
            True if image exists, False otherwise
        """
        return s3_client.object_exists(settings.s3_images_bucket, key)
    
    @staticmethod
    def get_image_metadata(key: str) -> Optional[Dict[str, Any]]:
        """
        Get metadata for an image from S3.
        
        Args:
            key: S3 object key
            
        Returns:
            Dictionary with image metadata or None if not found
        """
        try:
            response = s3_client.client.head_object(
                Bucket=settings.s3_images_bucket,
                Key=key
            )
            
            return {
                "key": key,
                "size": response.get("ContentLength"),
                "content_type": response.get("ContentType"),
                "last_modified": response.get("LastModified"),
                "etag": response.get("ETag"),
                "public_url": ImageService.get_image_url(key)
            }
            
        except Exception as e:
            logger.error(f"Error getting metadata for image {key}: {e}")
            return None
    
    @staticmethod
    def validate_image_key(key: str) -> bool:
        """
        Validate that a key represents a valid image path.
        
        Args:
            key: S3 object key to validate
            
        Returns:
            True if valid image key, False otherwise
        """
        # Must start with images/ prefix
        if not key.startswith("images/"):
            return False
        
        # Must have a valid image extension
        valid_extensions = [".jpg", ".jpeg", ".png", ".webp"]
        return any(key.lower().endswith(ext) for ext in valid_extensions)

# backend/app/api/routers/uploads_router.py
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from services.s3.image_service import ImageService
from services.s3.presign_service import PresignService

router = APIRouter()

@router.get("/images")
async def get_upload_url(
    filename: str = Query(..., description="Original filename"),
    content_type: Optional[str] = Query(None, description="MIME type of the file"),
    file_size: Optional[int] = Query(None, description="File size in bytes")
):
    """
    Generate a presigned URL for uploading an image to S3.
    
    Args:
        filename: Original filename with extension
        content_type: MIME type (e.g., 'image/jpeg')
        file_size: File size in bytes for validation
        
    Returns:
        Dictionary containing upload URL, fields, and metadata
    """
    try:
        upload_data = ImageService.get_upload_url(
            filename=filename,
            content_type=content_type,
            file_size=file_size
        )
        
        return {
            "success": True,
            "data": upload_data
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate upload URL: {str(e)}")

@router.delete("/images/{key:path}")
async def delete_image(key: str):
    """
    Delete an image from S3.
    
    Args:
        key: S3 object key (e.g., 'images/uuid.jpg')
        
    Returns:
        Success status
    """
    try:
        # Validate image key format
        if not ImageService.validate_image_key(key):
            raise HTTPException(status_code=400, detail="Invalid image key format")
        
        # Check if image exists
        if not ImageService.image_exists(key):
            raise HTTPException(status_code=404, detail="Image not found")
        
        # Delete the image
        success = ImageService.delete_image(key)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete image")
        
        return {
            "success": True,
            "message": f"Image {key} deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete image: {str(e)}")

@router.get("/images/{key:path}/metadata")
async def get_image_metadata(key: str):
    """
    Get metadata for an image.
    
    Args:
        key: S3 object key
        
    Returns:
        Image metadata including size, content type, etc.
    """
    try:
        # Validate image key format
        if not ImageService.validate_image_key(key):
            raise HTTPException(status_code=400, detail="Invalid image key format")
        
        # Get metadata
        metadata = ImageService.get_image_metadata(key)
        
        if not metadata:
            raise HTTPException(status_code=404, detail="Image not found")
        
        return {
            "success": True,
            "data": metadata
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get image metadata: {str(e)}")

@router.get("/images/{key:path}/url")
async def get_image_url(key: str, use_cloudfront: bool = Query(True, description="Use CloudFront URL if available")):
    """
    Get the public URL for an image.
    
    Args:
        key: S3 object key
        use_cloudfront: Whether to use CloudFront URL
        
    Returns:
        Public URL for the image
    """
    try:
        # Validate image key format
        if not ImageService.validate_image_key(key):
            raise HTTPException(status_code=400, detail="Invalid image key format")
        
        # Check if image exists
        if not ImageService.image_exists(key):
            raise HTTPException(status_code=404, detail="Image not found")
        
        # Get public URL
        url = ImageService.get_image_url(key, use_cloudfront=use_cloudfront)
        
        return {
            "success": True,
            "data": {
                "key": key,
                "url": url,
                "cloudfront_enabled": use_cloudfront
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get image URL: {str(e)}")

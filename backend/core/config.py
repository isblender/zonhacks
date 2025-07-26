import os
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings with AWS configuration."""
    
    # AWS Configuration
    aws_access_key_id: Optional[str] = Field(default=None, env="AWS_ACCESS_KEY_ID")
    aws_secret_access_key: Optional[str] = Field(default=None, env="AWS_SECRET_ACCESS_KEY")
    aws_default_region: str = Field(default="us-east-1", env="AWS_DEFAULT_REGION")
    
    # S3 Configuration
    s3_images_bucket: str = Field(default="swap-platform-images", env="S3_IMAGES_BUCKET")
    s3_web_bucket: str = Field(default="swap-platform-web", env="S3_WEB_BUCKET")
    
    # CloudFront Configuration
    cloudfront_domain: Optional[str] = Field(default=None, env="CLOUDFRONT_DOMAIN")
    
    # Image Upload Settings
    max_image_size_mb: int = Field(default=5, env="MAX_IMAGE_SIZE_MB")
    allowed_image_types: list[str] = Field(
        default=["image/jpeg", "image/png", "image/webp"],
        env="ALLOWED_IMAGE_TYPES"
    )
    presigned_url_expiration: int = Field(default=900, env="PRESIGNED_URL_EXPIRATION")  # 15 minutes
    
    # Application Settings
    app_name: str = "Swaps"
    debug: bool = Field(default=False, env="DEBUG")
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()

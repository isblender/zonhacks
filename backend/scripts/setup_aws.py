#!/usr/bin/env python3
"""
AWS Setup Script for Clothing Swap Platform

This script helps set up the required AWS resources:
- S3 buckets for images and web hosting
- Bucket policies and CORS configuration
- CloudFront distribution (optional)

Usage:
    python scripts/setup_aws.py
"""

import boto3
import json
import sys
from botocore.exceptions import ClientError
from core.config import settings


def create_s3_bucket(s3_client, bucket_name: str, region: str) -> bool:
    """Create an S3 bucket."""
    try:
        if region == 'us-east-1':
            # us-east-1 doesn't need LocationConstraint
            s3_client.create_bucket(Bucket=bucket_name)
        else:
            s3_client.create_bucket(
                Bucket=bucket_name,
                CreateBucketConfiguration={'LocationConstraint': region}
            )
        print(f"✅ Created bucket: {bucket_name}")
        return True
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == 'BucketAlreadyOwnedByYou':
            print(f"ℹ️  Bucket {bucket_name} already exists and is owned by you")
            return True
        elif error_code == 'BucketAlreadyExists':
            print(f"❌ Bucket {bucket_name} already exists and is owned by someone else")
            return False
        else:
            print(f"❌ Error creating bucket {bucket_name}: {e}")
            return False


def configure_bucket_cors(s3_client, bucket_name: str) -> bool:
    """Configure CORS for S3 bucket."""
    cors_configuration = {
        'CORSRules': [
            {
                'AllowedHeaders': ['*'],
                'AllowedMethods': ['GET', 'POST', 'PUT', 'DELETE'],
                'AllowedOrigins': ['*'],  # Restrict this in production
                'ExposeHeaders': ['ETag'],
                'MaxAgeSeconds': 3000
            }
        ]
    }
    
    try:
        s3_client.put_bucket_cors(
            Bucket=bucket_name,
            CORSConfiguration=cors_configuration
        )
        print(f"✅ Configured CORS for bucket: {bucket_name}")
        return True
    except ClientError as e:
        print(f"❌ Error configuring CORS for {bucket_name}: {e}")
        return False


def configure_images_bucket_policy(s3_client, bucket_name: str) -> bool:
    """Configure bucket policy for images bucket (private with presigned URL access)."""
    # Images bucket should be private - no public read policy needed
    # Access will be through presigned URLs only
    print(f"ℹ️  Images bucket {bucket_name} configured as private (presigned URLs only)")
    return True


def configure_web_bucket_policy(s3_client, bucket_name: str) -> bool:
    """Configure bucket policy for web hosting bucket (public read)."""
    bucket_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "PublicReadGetObject",
                "Effect": "Allow",
                "Principal": "*",
                "Action": "s3:GetObject",
                "Resource": f"arn:aws:s3:::{bucket_name}/*"
            }
        ]
    }
    
    try:
        s3_client.put_bucket_policy(
            Bucket=bucket_name,
            Policy=json.dumps(bucket_policy)
        )
        print(f"✅ Configured public read policy for bucket: {bucket_name}")
        return True
    except ClientError as e:
        print(f"❌ Error configuring bucket policy for {bucket_name}: {e}")
        return False


def configure_web_bucket_hosting(s3_client, bucket_name: str) -> bool:
    """Configure S3 bucket for static website hosting."""
    website_configuration = {
        'IndexDocument': {'Suffix': 'index.html'},
        'ErrorDocument': {'Key': 'error.html'}
    }
    
    try:
        s3_client.put_bucket_website(
            Bucket=bucket_name,
            WebsiteConfiguration=website_configuration
        )
        print(f"✅ Configured static website hosting for bucket: {bucket_name}")
        return True
    except ClientError as e:
        print(f"❌ Error configuring website hosting for {bucket_name}: {e}")
        return False


def setup_s3_buckets():
    """Set up S3 buckets for the clothing swap platform."""
    print("🚀 Setting up S3 buckets for Clothing Swap Platform...")
    
    try:
        # Initialize S3 client
        session_kwargs = {}
        if settings.aws_access_key_id and settings.aws_secret_access_key:
            session_kwargs.update({
                'aws_access_key_id': settings.aws_access_key_id,
                'aws_secret_access_key': settings.aws_secret_access_key,
            })
        
        session = boto3.Session(**session_kwargs)
        s3_client = session.client('s3', region_name=settings.aws_default_region)
        
        # Test credentials
        s3_client.list_buckets()
        print("✅ AWS credentials validated")
        
    except Exception as e:
        print(f"❌ Failed to initialize AWS client: {e}")
        print("Please check your AWS credentials and try again.")
        return False
    
    success = True
    
    # Create and configure images bucket
    print(f"\n📁 Setting up images bucket: {settings.s3_images_bucket}")
    if create_s3_bucket(s3_client, settings.s3_images_bucket, settings.aws_default_region):
        configure_bucket_cors(s3_client, settings.s3_images_bucket)
        configure_images_bucket_policy(s3_client, settings.s3_images_bucket)
    else:
        success = False
    
    # Create and configure web hosting bucket
    print(f"\n🌐 Setting up web hosting bucket: {settings.s3_web_bucket}")
    if create_s3_bucket(s3_client, settings.s3_web_bucket, settings.aws_default_region):
        configure_bucket_cors(s3_client, settings.s3_web_bucket)
        configure_web_bucket_policy(s3_client, settings.s3_web_bucket)
        configure_web_bucket_hosting(s3_client, settings.s3_web_bucket)
    else:
        success = False
    
    if success:
        print("\n🎉 AWS S3 setup completed successfully!")
        print(f"\nNext steps:")
        print(f"1. Images will be uploaded to: {settings.s3_images_bucket}")
        print(f"2. Web app can be deployed to: {settings.s3_web_bucket}")
        print(f"3. Consider setting up CloudFront for better performance")
        print(f"4. Update your .env file with the bucket names if different")
    else:
        print("\n❌ Some errors occurred during setup. Please check the output above.")
    
    return success


def main():
    """Main function."""
    print("Clothing Swap Platform - AWS Setup")
    print("=" * 50)
    
    # Check if required settings are available
    if not settings.aws_default_region:
        print("❌ AWS_DEFAULT_REGION not configured")
        sys.exit(1)
    
    # Run setup
    success = setup_s3_buckets()
    
    if not success:
        sys.exit(1)


if __name__ == "__main__":
    main()

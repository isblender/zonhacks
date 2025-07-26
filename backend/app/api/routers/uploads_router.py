# backend/app/api/routers/uploads_router.py
from fastapi import APIRouter, HTTPException
from services.s3.presign_service import PresignService

router = APIRouter()

@router.get("/images")
async def get_upload_url(filename: str):
    # Generate presigned URL for client
    url = PresignService.generate_presigned_url(filename)
    return {"url": url}
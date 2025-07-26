# backend/app/api/routers/users_router.py
from fastapi import APIRouter, HTTPException, Depends

router = APIRouter()

@router.get("/{user_id}")
async def get_user(user_id: str):
    # TODO: fetch user profile
    return {"user_id": user_id, "message": "Get user stub"}

@router.put("/{user_id}")
async def update_user(user_id: str, user_data: dict):
    # TODO: update user profile
    return {"user_id": user_id, "message": "Update user stub"}
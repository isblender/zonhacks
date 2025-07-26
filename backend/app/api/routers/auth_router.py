# backend/app/api/routers/auth_router.py
from fastapi import APIRouter, HTTPException

router = APIRouter()

@router.post("/signup")
async def signup(user: dict):
    # TODO: implement signup logic
    return {"message": "Signup stub"}

@router.post("/login")
async def login(credentials: dict):
    # TODO: implement login logic
    return {"message": "Login stub"}

@router.post("/refresh")
async def refresh_token(token: dict):
    # TODO: implement token refresh logic
    return {"message": "Refresh token stub"}
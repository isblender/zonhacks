# backend/app/api/routers/auth_router.py
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import Optional
from services.auth.cognito_service import cognito_service
from services.auth.auth_dependencies import get_cognito_user_info

router = APIRouter()

# Pydantic models for request/response
class TokenValidationRequest(BaseModel):
    access_token: str

@router.get("/me")
async def get_current_user_info(user_info: dict = Depends(get_cognito_user_info)):
    """
    Get current authenticated user information from Cognito token.
    
    Args:
        user_info: Current user info from Cognito token
        
    Returns:
        User information
    """
    return {
        "success": True,
        "user": user_info
    }

@router.get("/oauth/login")
async def get_oauth_login_url(redirect_uri: str = "http://localhost:3000/auth/callback"):
    """
    Get OAuth login URL for Cognito hosted UI.
    
    Args:
        redirect_uri: URL to redirect after authentication
        
    Returns:
        OAuth login URL
    """
    try:
        login_url = cognito_service.get_oauth_login_url(redirect_uri)
        return {
            "success": True,
            "login_url": login_url
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate login URL"
        )

@router.post("/oauth/callback")
async def oauth_callback(code: str, state: Optional[str] = None):
    """
    Handle OAuth callback from Cognito hosted UI.
    
    Args:
        code: Authorization code from Cognito
        state: Optional state parameter
        
    Returns:
        JWT tokens for the authenticated user
    """
    try:
        # Exchange authorization code for tokens
        # This would typically involve calling Cognito's token endpoint
        # For now, return a placeholder response
        return {
            "success": True,
            "message": "OAuth callback received",
            "code": code,
            "state": state
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OAuth callback failed"
        )

@router.post("/token/validate")
async def validate_token(request: TokenValidationRequest):
    """
    Validate a Cognito access token and return user info.
    
    Args:
        request: Token validation request with Cognito access token
        
    Returns:
        User information from Cognito
    """
    try:
        # Get user info from Cognito token
        user_info = cognito_service.get_user_info(request.access_token)
        
        if not user_info:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token"
            )
        
        return {
            "success": True,
            "user": user_info
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token validation failed"
        )

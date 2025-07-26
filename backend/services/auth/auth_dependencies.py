from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any, Optional
from .cognito_service import cognito_service

# Security scheme for Bearer token
security = HTTPBearer()


async def get_cognito_user_info(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """
    Dependency to get user info directly from Cognito using access token.
    
    Args:
        credentials: HTTP Authorization credentials
        
    Returns:
        User information from Cognito
        
    Raises:
        HTTPException: If token is invalid
    """
    token = credentials.credentials
    
    # Get user info from Cognito
    user_info = cognito_service.get_user_info(token)
    
    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user_info


class AuthUser:
    """Helper class to represent authenticated user."""
    
    def __init__(self, user_data: Dict[str, Any]):
        self.data = user_data
        self.user_id = user_data.get('sub') or user_data.get('username')
        self.email = user_data.get('email')
        self.name = user_data.get('name')
        self.phone = user_data.get('phone_number')
        self.groups = user_data.get('cognito:groups', [])
    
    @property
    def is_admin(self) -> bool:
        """Check if user has admin privileges."""
        return 'admin' in self.groups or self.data.get('role') == 'admin'
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'user_id': self.user_id,
            'email': self.email,
            'name': self.name,
            'phone': self.phone,
            'groups': self.groups,
            'is_admin': self.is_admin
        }


async def get_auth_user(user_data: Dict[str, Any] = Depends(get_cognito_user_info)) -> AuthUser:
    """
    Dependency to get AuthUser object.
    
    Args:
        user_data: User data from get_cognito_user_info
        
    Returns:
        AuthUser object
    """
    return AuthUser(user_data)

def require_auth(user_info: Dict[str, Any] = Depends(get_cognito_user_info)) -> Dict[str, Any]:
    """
    Dependency that requires Cognito authentication.
    
    Args:
        user_info: Current user info from Cognito token
        
    Returns:
        User information dictionary
    """
    return user_info

def require_admin(user_info: Dict[str, Any] = Depends(get_cognito_user_info)) -> Dict[str, Any]:
    """
    Dependency that requires admin privileges.
    
    Args:
        user_info: Current user info from Cognito token
        
    Returns:
        User information dictionary
        
    Raises:
        HTTPException: If user is not admin
    """
    # Check if user has admin role
    user_groups = user_info.get('cognito:groups', [])
    if 'admin' not in user_groups:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    
    return user_info

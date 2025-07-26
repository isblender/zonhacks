import boto3
import json
import logging
from typing import Dict, Any, Optional
from botocore.exceptions import ClientError
from core.config import settings

logger = logging.getLogger(__name__)


class CognitoService:
    """AWS Cognito service for user authentication and management."""
    
    def __init__(self):
        self._client = None
        self._idp_client = None
    
    @property
    def client(self):
        """Lazy initialization of Cognito Identity Provider client."""
        if self._idp_client is None:
            session_kwargs = {}
            if settings.aws_access_key_id and settings.aws_secret_access_key:
                session_kwargs.update({
                    'aws_access_key_id': settings.aws_access_key_id,
                    'aws_secret_access_key': settings.aws_secret_access_key,
                })
            
            session = boto3.Session(**session_kwargs)
            self._idp_client = session.client(
                'cognito-idp', 
                region_name=settings.cognito_region
            )
        return self._idp_client
    
    def sign_up(self, email: str, password: str, **user_attributes) -> Dict[str, Any]:
        """
        Register a new user with Cognito.
        
        Args:
            email: User's email address
            password: User's password
            **user_attributes: Additional user attributes (name, phone, etc.)
            
        Returns:
            Dictionary with signup result
        """
        try:
            # Prepare user attributes
            attributes = [
                {'Name': 'email', 'Value': email}
            ]
            
            # Add additional attributes
            for key, value in user_attributes.items():
                if value:  # Only add non-empty values
                    attributes.append({'Name': key, 'Value': str(value)})
            
            response = self.client.admin_create_user(
                UserPoolId=settings.cognito_user_pool_id,
                Username=email,
                UserAttributes=attributes,
                TemporaryPassword=password,
                MessageAction='SUPPRESS'  # Don't send welcome email
            )
            
            # Set permanent password
            self.client.admin_set_user_password(
                UserPoolId=settings.cognito_user_pool_id,
                Username=email,
                Password=password,
                Permanent=True
            )
            
            logger.info(f"User {email} created successfully")
            
            return {
                'success': True,
                'user_sub': response['User']['Username'],
                'email': email,
                'message': 'User created successfully'
            }
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            
            logger.error(f"Cognito signup error for {email}: {error_code} - {error_message}")
            
            # Handle specific error cases
            if error_code == 'UsernameExistsException':
                return {
                    'success': False,
                    'error': 'USER_EXISTS',
                    'message': 'User with this email already exists'
                }
            elif error_code == 'InvalidPasswordException':
                return {
                    'success': False,
                    'error': 'INVALID_PASSWORD',
                    'message': 'Password does not meet requirements'
                }
            else:
                return {
                    'success': False,
                    'error': error_code,
                    'message': error_message
                }
        except Exception as e:
            logger.error(f"Unexpected error during signup: {e}")
            return {
                'success': False,
                'error': 'INTERNAL_ERROR',
                'message': 'An unexpected error occurred'
            }
    
    def authenticate(self, email: str, password: str) -> Dict[str, Any]:
        """
        Authenticate user with email and password.
        
        Args:
            email: User's email address
            password: User's password
            
        Returns:
            Dictionary with authentication result and tokens
        """
        try:
            response = self.client.admin_initiate_auth(
                UserPoolId=settings.cognito_user_pool_id,
                ClientId=settings.cognito_client_id,
                AuthFlow='ADMIN_NO_SRP_AUTH',
                AuthParameters={
                    'USERNAME': email,
                    'PASSWORD': password
                }
            )
            
            # Extract tokens
            auth_result = response['AuthenticationResult']
            
            # Get user info
            user_info = self.get_user_info(auth_result['AccessToken'])
            
            logger.info(f"User {email} authenticated successfully")
            
            return {
                'success': True,
                'access_token': auth_result['AccessToken'],
                'id_token': auth_result['IdToken'],
                'refresh_token': auth_result['RefreshToken'],
                'expires_in': auth_result['ExpiresIn'],
                'token_type': auth_result['TokenType'],
                'user': user_info
            }
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            
            logger.error(f"Cognito auth error for {email}: {error_code} - {error_message}")
            
            if error_code == 'NotAuthorizedException':
                return {
                    'success': False,
                    'error': 'INVALID_CREDENTIALS',
                    'message': 'Invalid email or password'
                }
            elif error_code == 'UserNotConfirmedException':
                return {
                    'success': False,
                    'error': 'USER_NOT_CONFIRMED',
                    'message': 'User account is not confirmed'
                }
            else:
                return {
                    'success': False,
                    'error': error_code,
                    'message': error_message
                }
        except Exception as e:
            logger.error(f"Unexpected error during authentication: {e}")
            return {
                'success': False,
                'error': 'INTERNAL_ERROR',
                'message': 'An unexpected error occurred'
            }
    
    def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        """
        Refresh access token using refresh token.
        
        Args:
            refresh_token: Valid refresh token
            
        Returns:
            Dictionary with new tokens
        """
        try:
            response = self.client.admin_initiate_auth(
                UserPoolId=settings.cognito_user_pool_id,
                ClientId=settings.cognito_client_id,
                AuthFlow='REFRESH_TOKEN_AUTH',
                AuthParameters={
                    'REFRESH_TOKEN': refresh_token
                }
            )
            
            auth_result = response['AuthenticationResult']
            
            return {
                'success': True,
                'access_token': auth_result['AccessToken'],
                'id_token': auth_result['IdToken'],
                'expires_in': auth_result['ExpiresIn'],
                'token_type': auth_result['TokenType']
            }
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            logger.error(f"Token refresh error: {error_code}")
            
            return {
                'success': False,
                'error': error_code,
                'message': 'Failed to refresh token'
            }
    
    def get_user_info(self, access_token: str) -> Dict[str, Any]:
        """
        Get user information from access token.
        
        Args:
            access_token: Valid access token
            
        Returns:
            Dictionary with user information
        """
        try:
            response = self.client.get_user(AccessToken=access_token)
            
            # Parse user attributes
            user_data = {'username': response['Username']}
            for attr in response['UserAttributes']:
                user_data[attr['Name']] = attr['Value']
            
            return user_data
            
        except ClientError as e:
            logger.error(f"Error getting user info: {e}")
            return {}
    
    def logout(self, access_token: str) -> Dict[str, Any]:
        """
        Logout user by invalidating tokens.
        
        Args:
            access_token: Valid access token
            
        Returns:
            Dictionary with logout result
        """
        try:
            self.client.global_sign_out(AccessToken=access_token)
            
            return {
                'success': True,
                'message': 'User logged out successfully'
            }
            
        except ClientError as e:
            logger.error(f"Logout error: {e}")
            return {
                'success': False,
                'error': 'LOGOUT_FAILED',
                'message': 'Failed to logout user'
            }
    
    def get_oauth_login_url(self, redirect_uri: str, state: Optional[str] = None) -> str:
        """
        Generate OAuth login URL for Cognito hosted UI.
        
        Args:
            redirect_uri: URL to redirect after authentication
            state: Optional state parameter
            
        Returns:
            OAuth login URL
        """
        if not settings.cognito_domain:
            raise ValueError("Cognito domain not configured")
        
        params = {
            'client_id': settings.cognito_client_id,
            'response_type': 'code',
            'scope': 'email openid phone profile',
            'redirect_uri': redirect_uri
        }
        
        if state:
            params['state'] = state
        
        query_string = '&'.join([f"{k}={v}" for k, v in params.items()])
        
        return f"https://{settings.cognito_domain}/oauth2/authorize?{query_string}"


# Global Cognito service instance
cognito_service = CognitoService()

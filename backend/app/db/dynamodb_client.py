# backend/app/db/dynamodb_client.py
import boto3
import logging
from botocore.config import Config
from botocore.exceptions import ClientError, NoCredentialsError
from core.config import settings

# Set up logging
logger = logging.getLogger(__name__)

class DynamoDBClient:
    """
    DynamoDB client wrapper with proper credential handling and error management.
    """
    
    def __init__(self):
        self._dynamodb = None
        self._session = None
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize the DynamoDB client with proper credentials."""
        try:
            # Configure boto3 with retry settings and timeouts
            config = Config(
                retries={'max_attempts': 10, 'mode': 'adaptive'},
                connect_timeout=60,
                read_timeout=60,
                max_pool_connections=50
            )
            
            # Create session with credentials from settings
            session_kwargs = {
                'region_name': settings.aws_default_region
            }
            
            # Add explicit credentials if provided (for development/testing)
            if settings.aws_access_key_id and settings.aws_secret_access_key:
                session_kwargs.update({
                    'aws_access_key_id': settings.aws_access_key_id,
                    'aws_secret_access_key': settings.aws_secret_access_key,
                })
                logger.info("Using explicit AWS credentials from environment variables")
            else:
                logger.info("Using default AWS credential chain (IAM roles, AWS CLI, etc.)")
            
            # Create session and DynamoDB resource
            self._session = boto3.Session(**session_kwargs)
            self._dynamodb = self._session.resource('dynamodb', config=config)
            
            # Test the connection by listing tables (this will raise an exception if credentials are invalid)
            list(self._dynamodb.tables.limit(1))
            logger.info(f"Successfully initialized DynamoDB client for region: {settings.aws_default_region}")
            
        except NoCredentialsError:
            logger.error("AWS credentials not found. Please configure your credentials.")
            raise Exception(
                "AWS credentials not found. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY "
                "in your .env file or configure AWS CLI credentials."
            )
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'UnrecognizedClientException':
                logger.error("Invalid AWS credentials provided")
                raise Exception("Invalid AWS credentials. Please check your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.")
            elif error_code == 'AccessDenied':
                logger.error("Access denied to DynamoDB")
                raise Exception("Access denied to DynamoDB. Please check your IAM permissions.")
            else:
                logger.error(f"AWS ClientError: {e}")
                raise Exception(f"AWS error: {e}")
        except Exception as e:
            logger.error(f"Failed to initialize DynamoDB client: {e}")
            raise Exception(f"Failed to initialize DynamoDB client: {e}")
    
    @property
    def resource(self):
        """Get the DynamoDB resource, reinitializing if necessary."""
        if self._dynamodb is None:
            self._initialize_client()
        return self._dynamodb
    
    def get_table(self, table_name: str):
        """Get a DynamoDB table with error handling."""
        try:
            table = self.resource.Table(table_name)
            # Test table access
            table.load()
            return table
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'ResourceNotFoundException':
                logger.error(f"DynamoDB table '{table_name}' not found")
                raise Exception(f"DynamoDB table '{table_name}' does not exist. Please create it first.")
            else:
                logger.error(f"Error accessing table '{table_name}': {e}")
                raise Exception(f"Error accessing DynamoDB table '{table_name}': {e}")
        except Exception as e:
            logger.error(f"Unexpected error accessing table '{table_name}': {e}")
            raise Exception(f"Unexpected error accessing table '{table_name}': {e}")
    
    def Table(self, table_name: str):
        """Compatibility method to match boto3 resource interface."""
        return self.get_table(table_name)
    
    def list_tables(self):
        """List all DynamoDB tables."""
        try:
            return [table.name for table in self.resource.tables.all()]
        except Exception as e:
            logger.error(f"Error listing tables: {e}")
            raise Exception(f"Error listing DynamoDB tables: {e}")
    
    def health_check(self):
        """Perform a health check on the DynamoDB connection."""
        try:
            tables = self.list_tables()
            return {
                "status": "healthy",
                "region": settings.aws_default_region,
                "table_count": len(tables),
                "tables": tables
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "region": settings.aws_default_region
            }

# Create a global instance
_client = DynamoDBClient()

# Export the resource for backward compatibility
dynamodb = _client.resource

# Export the client instance for advanced usage
dynamodb_client = _client

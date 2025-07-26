# backend/app/db/dynamodb_utils.py
"""
DynamoDB utility functions for better error handling and operations.
"""

import logging
from typing import Dict, List, Optional, Any
from botocore.exceptions import ClientError
from app.db.dynamodb_client import dynamodb

logger = logging.getLogger(__name__)

class DynamoDBError(Exception):
    """Custom exception for DynamoDB operations."""
    pass

class TableNotFoundError(DynamoDBError):
    """Exception raised when a DynamoDB table is not found."""
    pass

class ItemNotFoundError(DynamoDBError):
    """Exception raised when an item is not found in DynamoDB."""
    pass

class DynamoDBUtils:
    """Utility class for DynamoDB operations with proper error handling."""
    
    @staticmethod
    def get_table(table_name: str):
        """
        Get a DynamoDB table with error handling.
        
        Args:
            table_name: Name of the DynamoDB table
            
        Returns:
            DynamoDB table resource
            
        Raises:
            TableNotFoundError: If the table doesn't exist
            DynamoDBError: For other DynamoDB errors
        """
        try:
            table = dynamodb.Table(table_name)
            # Test table access by loading table metadata
            table.load()
            return table
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'ResourceNotFoundException':
                logger.error(f"DynamoDB table '{table_name}' not found")
                raise TableNotFoundError(f"Table '{table_name}' does not exist. Please create it first.")
            else:
                logger.error(f"Error accessing table '{table_name}': {e}")
                raise DynamoDBError(f"Error accessing table '{table_name}': {e}")
        except Exception as e:
            logger.error(f"Unexpected error accessing table '{table_name}': {e}")
            raise DynamoDBError(f"Unexpected error accessing table '{table_name}': {e}")
    
    @staticmethod
    def put_item(table_name: str, item: Dict[str, Any], condition_expression: str = None) -> Dict[str, Any]:
        """
        Put an item into DynamoDB with error handling.
        
        Args:
            table_name: Name of the DynamoDB table
            item: Item to put into the table
            condition_expression: Optional condition expression
            
        Returns:
            The item that was put
            
        Raises:
            DynamoDBError: For DynamoDB errors
        """
        try:
            table = DynamoDBUtils.get_table(table_name)
            
            put_params = {'Item': item}
            if condition_expression:
                put_params['ConditionExpression'] = condition_expression
            
            table.put_item(**put_params)
            logger.info(f"Successfully put item in table '{table_name}'")
            return item
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'ConditionalCheckFailedException':
                logger.error(f"Condition check failed for item in table '{table_name}'")
                raise DynamoDBError("Item already exists or condition not met")
            else:
                logger.error(f"Error putting item in table '{table_name}': {e}")
                raise DynamoDBError(f"Failed to put item: {e}")
        except Exception as e:
            logger.error(f"Unexpected error putting item in table '{table_name}': {e}")
            raise DynamoDBError(f"Failed to put item: {e}")
    
    @staticmethod
    def get_item(table_name: str, key: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Get an item from DynamoDB with error handling.
        
        Args:
            table_name: Name of the DynamoDB table
            key: Primary key of the item to get
            
        Returns:
            The item if found, None otherwise
            
        Raises:
            DynamoDBError: For DynamoDB errors
        """
        try:
            table = DynamoDBUtils.get_table(table_name)
            response = table.get_item(Key=key)
            return response.get('Item')
            
        except ClientError as e:
            logger.error(f"Error getting item from table '{table_name}': {e}")
            raise DynamoDBError(f"Failed to get item: {e}")
        except Exception as e:
            logger.error(f"Unexpected error getting item from table '{table_name}': {e}")
            raise DynamoDBError(f"Failed to get item: {e}")
    
    @staticmethod
    def update_item(table_name: str, key: Dict[str, Any], update_expression: str, 
                   expression_attribute_values: Dict[str, Any], 
                   expression_attribute_names: Dict[str, str] = None,
                   return_values: str = "ALL_NEW") -> Optional[Dict[str, Any]]:
        """
        Update an item in DynamoDB with error handling.
        
        Args:
            table_name: Name of the DynamoDB table
            key: Primary key of the item to update
            update_expression: Update expression
            expression_attribute_values: Values for the update expression
            expression_attribute_names: Names for the update expression
            return_values: What to return after update
            
        Returns:
            The updated item attributes
            
        Raises:
            DynamoDBError: For DynamoDB errors
        """
        try:
            table = DynamoDBUtils.get_table(table_name)
            
            update_params = {
                'Key': key,
                'UpdateExpression': update_expression,
                'ExpressionAttributeValues': expression_attribute_values,
                'ReturnValues': return_values
            }
            
            if expression_attribute_names:
                update_params['ExpressionAttributeNames'] = expression_attribute_names
            
            response = table.update_item(**update_params)
            logger.info(f"Successfully updated item in table '{table_name}'")
            return response.get('Attributes')
            
        except ClientError as e:
            logger.error(f"Error updating item in table '{table_name}': {e}")
            raise DynamoDBError(f"Failed to update item: {e}")
        except Exception as e:
            logger.error(f"Unexpected error updating item in table '{table_name}': {e}")
            raise DynamoDBError(f"Failed to update item: {e}")
    
    @staticmethod
    def delete_item(table_name: str, key: Dict[str, Any]) -> bool:
        """
        Delete an item from DynamoDB with error handling.
        
        Args:
            table_name: Name of the DynamoDB table
            key: Primary key of the item to delete
            
        Returns:
            True if successful
            
        Raises:
            DynamoDBError: For DynamoDB errors
        """
        try:
            table = DynamoDBUtils.get_table(table_name)
            table.delete_item(Key=key)
            logger.info(f"Successfully deleted item from table '{table_name}'")
            return True
            
        except ClientError as e:
            logger.error(f"Error deleting item from table '{table_name}': {e}")
            raise DynamoDBError(f"Failed to delete item: {e}")
        except Exception as e:
            logger.error(f"Unexpected error deleting item from table '{table_name}': {e}")
            raise DynamoDBError(f"Failed to delete item: {e}")
    
    @staticmethod
    def query_items(table_name: str, key_condition_expression: str, 
                   expression_attribute_values: Dict[str, Any],
                   index_name: str = None, filter_expression: str = None,
                   expression_attribute_names: Dict[str, str] = None,
                   scan_index_forward: bool = True) -> List[Dict[str, Any]]:
        """
        Query items from DynamoDB with error handling.
        
        Args:
            table_name: Name of the DynamoDB table
            key_condition_expression: Key condition for the query
            expression_attribute_values: Values for the query
            index_name: Name of the index to query
            filter_expression: Optional filter expression
            expression_attribute_names: Names for the query
            scan_index_forward: Sort order
            
        Returns:
            List of items matching the query
            
        Raises:
            DynamoDBError: For DynamoDB errors
        """
        try:
            table = DynamoDBUtils.get_table(table_name)
            
            query_params = {
                'KeyConditionExpression': key_condition_expression,
                'ExpressionAttributeValues': expression_attribute_values,
                'ScanIndexForward': scan_index_forward
            }
            
            if index_name:
                query_params['IndexName'] = index_name
            if filter_expression:
                query_params['FilterExpression'] = filter_expression
            if expression_attribute_names:
                query_params['ExpressionAttributeNames'] = expression_attribute_names
            
            response = table.query(**query_params)
            logger.info(f"Successfully queried table '{table_name}', found {len(response.get('Items', []))} items")
            return response.get('Items', [])
            
        except ClientError as e:
            logger.error(f"Error querying table '{table_name}': {e}")
            raise DynamoDBError(f"Failed to query items: {e}")
        except Exception as e:
            logger.error(f"Unexpected error querying table '{table_name}': {e}")
            raise DynamoDBError(f"Failed to query items: {e}")
    
    @staticmethod
    def scan_items(table_name: str, filter_expression: str = None,
                  expression_attribute_values: Dict[str, Any] = None,
                  expression_attribute_names: Dict[str, str] = None) -> List[Dict[str, Any]]:
        """
        Scan items from DynamoDB with error handling.
        
        Args:
            table_name: Name of the DynamoDB table
            filter_expression: Optional filter expression
            expression_attribute_values: Values for the scan
            expression_attribute_names: Names for the scan
            
        Returns:
            List of items from the scan
            
        Raises:
            DynamoDBError: For DynamoDB errors
        """
        try:
            table = DynamoDBUtils.get_table(table_name)
            
            scan_params = {}
            if filter_expression:
                scan_params['FilterExpression'] = filter_expression
            if expression_attribute_values:
                scan_params['ExpressionAttributeValues'] = expression_attribute_values
            if expression_attribute_names:
                scan_params['ExpressionAttributeNames'] = expression_attribute_names
            
            response = table.scan(**scan_params)
            logger.info(f"Successfully scanned table '{table_name}', found {len(response.get('Items', []))} items")
            return response.get('Items', [])
            
        except ClientError as e:
            logger.error(f"Error scanning table '{table_name}': {e}")
            raise DynamoDBError(f"Failed to scan items: {e}")
        except Exception as e:
            logger.error(f"Unexpected error scanning table '{table_name}': {e}")
            raise DynamoDBError(f"Failed to scan items: {e}")
    
    @staticmethod
    def health_check() -> Dict[str, Any]:
        """
        Perform a health check on the DynamoDB connection.
        
        Returns:
            Health check results
        """
        try:
            # Try to list tables to test connection
            tables = list(dynamodb.tables.all())
            table_names = [table.name for table in tables]
            
            return {
                "status": "healthy",
                "message": "DynamoDB connection is working",
                "table_count": len(table_names),
                "tables": table_names
            }
        except Exception as e:
            logger.error(f"DynamoDB health check failed: {e}")
            return {
                "status": "unhealthy",
                "message": f"DynamoDB connection failed: {e}",
                "error": str(e)
            }

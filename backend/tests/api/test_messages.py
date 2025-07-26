# backend/tests/api/test_messages.py
import pytest
from fastapi.testclient import TestClient
from fastapi import status
from unittest.mock import patch, MagicMock
import uuid
from datetime import datetime

from app.main import app
from app.schemas.messages import MessageType, SystemMessageEvent
from app.db.repos.message_repo import MessageRepository

client = TestClient(app)

# Test data
TEST_SWAP_ID = "test-swap-123"
TEST_USER_ID = "test-user-456"
TEST_OTHER_USER_ID = "test-user-789"
TEST_MESSAGE_ID = "test-message-123"
TEST_CONTENT = "Hello! Is this item still available for swap?"

@pytest.fixture
def mock_verify_user_in_swap():
    """Mock the verify_user_in_swap dependency"""
    with patch("app.api.dependencies.messages.verify_user_in_swap") as mock:
        mock.return_value = {
            "swapId": TEST_SWAP_ID,
            "requesterId": TEST_USER_ID,
            "ownerId": TEST_OTHER_USER_ID,
            "status": "pending"
        }
        yield mock

@pytest.fixture
def mock_get_message_recipient():
    """Mock the get_message_recipient dependency"""
    with patch("app.api.dependencies.messages.get_message_recipient") as mock:
        mock.return_value = TEST_OTHER_USER_ID
        yield mock

@pytest.fixture
def mock_message_repo():
    """Mock the MessageRepository class"""
    with patch("app.api.routers.messages_router.MessageRepository") as mock:
        yield mock

class TestGetMessagesForSwap:
    """Tests for the get_messages_for_swap endpoint"""
    
    def test_get_messages_success(self, mock_verify_user_in_swap, mock_message_repo):
        """Test successful retrieval of messages for a swap"""
        # Setup mock response
        mock_messages = [
            {
                "message_id": str(uuid.uuid4()),
                "swap_id": TEST_SWAP_ID,
                "sender_id": TEST_USER_ID,
                "recipient_id": TEST_OTHER_USER_ID,
                "content": "Hello! Is this item still available?",
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "is_read": False,
                "message_type": "user"
            },
            {
                "message_id": str(uuid.uuid4()),
                "swap_id": TEST_SWAP_ID,
                "sender_id": TEST_OTHER_USER_ID,
                "recipient_id": TEST_USER_ID,
                "content": "Yes, it is still available!",
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "is_read": True,
                "message_type": "user"
            }
        ]
        mock_message_repo.get_messages_for_swap.return_value = mock_messages
        
        # Make request
        response = client.get(f"/swap/{TEST_SWAP_ID}", params={"user_id": TEST_USER_ID})
        
        # Assert response
        assert response.status_code == status.HTTP_200_OK
        assert len(response.json()) == 2
        
        # Assert that verify_user_in_swap was called
        mock_verify_user_in_swap.assert_called_once_with(TEST_SWAP_ID, TEST_USER_ID)
        
        # Assert that MessageRepository.get_messages_for_swap was called
        mock_message_repo.get_messages_for_swap.assert_called_once_with(TEST_SWAP_ID)

    def test_get_messages_unauthorized(self, mock_verify_user_in_swap):
        """Test retrieval of messages when user is not authorized"""
        # Setup mock to raise an exception
        mock_verify_user_in_swap.side_effect = Exception("User is not a participant in this swap")
        
        # Make request
        response = client.get(f"/swap/{TEST_SWAP_ID}", params={"user_id": "unauthorized-user"})
        
        # Assert response
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        
class TestSendMessage:
    """Tests for the send_message endpoint"""
    
    def test_send_message_success(self, mock_verify_user_in_swap, mock_get_message_recipient, mock_message_repo):
        """Test successful message sending"""
        # Setup mock response
        new_message = {
            "message_id": TEST_MESSAGE_ID,
            "swap_id": TEST_SWAP_ID,
            "sender_id": TEST_USER_ID,
            "recipient_id": TEST_OTHER_USER_ID,
            "content": TEST_CONTENT,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "is_read": False,
            "message_type": "user"
        }
        mock_message_repo.create_message.return_value = new_message
        
        # Make request
        response = client.post(
            f"/swap/{TEST_SWAP_ID}",
            json={"content": TEST_CONTENT},
            params={"user_id": TEST_USER_ID}
        )
        
        # Assert response
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["message_id"] == TEST_MESSAGE_ID
        assert response.json()["content"] == TEST_CONTENT
        
        # Assert dependencies were called
        mock_verify_user_in_swap.assert_called_once_with(TEST_SWAP_ID, TEST_USER_ID)
        mock_get_message_recipient.assert_called_once_with(TEST_SWAP_ID, TEST_USER_ID)
        
        # Assert message was created
        mock_message_repo.create_message.assert_called_once_with(
            swap_id=TEST_SWAP_ID,
            sender_id=TEST_USER_ID,
            recipient_id=TEST_OTHER_USER_ID,
            content=TEST_CONTENT
        )
    
    def test_send_message_unauthorized(self, mock_verify_user_in_swap):
        """Test message sending when user is not authorized"""
        # Setup mock to raise an exception
        mock_verify_user_in_swap.side_effect = Exception("User is not a participant in this swap")
        
        # Make request
        response = client.post(
            f"/swap/{TEST_SWAP_ID}",
            json={"content": TEST_CONTENT},
            params={"user_id": "unauthorized-user"}
        )
        
        # Assert response
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR

class TestMarkMessageAsRead:
    """Tests for the mark_message_as_read endpoint"""
    
    def test_mark_message_as_read_success(self, mock_verify_user_in_swap, mock_message_repo):
        """Test successfully marking a message as read"""
        # Setup mock response
        updated_message = {
            "message_id": TEST_MESSAGE_ID,
            "swap_id": TEST_SWAP_ID,
            "sender_id": TEST_OTHER_USER_ID,
            "recipient_id": TEST_USER_ID,
            "content": TEST_CONTENT,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "is_read": True,
            "message_type": "user"
        }
        mock_message_repo.mark_message_as_read.return_value = updated_message
        
        # Make request
        response = client.put(
            f"/{TEST_MESSAGE_ID}/read",
            json={"message_id": TEST_MESSAGE_ID},
            params={"swap_id": TEST_SWAP_ID, "user_id": TEST_USER_ID}
        )
        
        # Assert response
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["is_read"] == True
        
        # Assert dependencies were called
        mock_verify_user_in_swap.assert_called_once_with(TEST_SWAP_ID, TEST_USER_ID)
        
        # Assert message was updated
        mock_message_repo.mark_message_as_read.assert_called_once_with(
            swap_id=TEST_SWAP_ID,
            message_id=TEST_MESSAGE_ID,
            recipient_id=TEST_USER_ID
        )
    
    def test_mark_message_as_read_not_recipient(self, mock_verify_user_in_swap, mock_message_repo):
        """Test marking a message as read when user is not the recipient"""
        # Setup mock response (None means not found or not allowed)
        mock_message_repo.mark_message_as_read.return_value = None
        
        # Make request
        response = client.put(
            f"/{TEST_MESSAGE_ID}/read",
            json={"message_id": TEST_MESSAGE_ID},
            params={"swap_id": TEST_SWAP_ID, "user_id": TEST_USER_ID}
        )
        
        # Assert response
        assert response.status_code == status.HTTP_404_NOT_FOUND

class TestGetUnreadMessageCount:
    """Tests for the get_unread_message_count endpoint"""
    
    def test_get_unread_count_success(self, mock_message_repo):
        """Test successful retrieval of unread message count"""
        # Setup mock response
        unread_data = {
            "count": 3,
            "swaps": [
                {"swap_id": TEST_SWAP_ID, "count": 2},
                {"swap_id": "other-swap-id", "count": 1}
            ]
        }
        mock_message_repo.count_unread_messages.return_value = unread_data
        
        # Make request
        response = client.get(f"/unread", params={"user_id": TEST_USER_ID})
        
        # Assert response
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["count"] == 3
        assert len(response.json()["swaps"]) == 2
        
        # Assert that MessageRepository.count_unread_messages was called
        mock_message_repo.count_unread_messages.assert_called_once_with(TEST_USER_ID)

class TestDeleteMessage:
    """Tests for the delete_message endpoint"""
    
    def test_delete_message_success(self, mock_verify_user_in_swap, mock_message_repo):
        """Test successfully deleting a message"""
        # Setup mock response
        mock_message_repo.delete_message.return_value = True
        
        # Make request
        response = client.delete(
            f"/{TEST_MESSAGE_ID}",
            params={"swap_id": TEST_SWAP_ID, "user_id": TEST_USER_ID}
        )
        
        # Assert response
        assert response.status_code == status.HTTP_204_NO_CONTENT
        
        # Assert dependencies were called
        mock_verify_user_in_swap.assert_called_once_with(TEST_SWAP_ID, TEST_USER_ID)
        
        # Assert message was deleted
        mock_message_repo.delete_message.assert_called_once_with(
            swap_id=TEST_SWAP_ID,
            message_id=TEST_MESSAGE_ID,
            user_id=TEST_USER_ID
        )
    
    def test_delete_message_not_sender(self, mock_verify_user_in_swap, mock_message_repo):
        """Test deleting a message when user is not the sender"""
        # Setup mock response
        mock_message_repo.delete_message.return_value = False
        
        # Make request
        response = client.delete(
            f"/{TEST_MESSAGE_ID}",
            params={"swap_id": TEST_SWAP_ID, "user_id": TEST_OTHER_USER_ID}
        )
        
        # Assert response
        assert response.status_code == status.HTTP_404_NOT_FOUND

class TestSystemMessages:
    """Tests for system message generation"""
    
    def test_create_system_message(self, mock_message_repo):
        """Test creating system messages when swap status changes"""
        # Setup mock response
        system_messages = [
            {
                "message_id": str(uuid.uuid4()),
                "swap_id": TEST_SWAP_ID,
                "sender_id": "SYSTEM",
                "recipient_id": TEST_USER_ID,
                "content": "The swap request has been accepted.",
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "is_read": False,
                "message_type": "system",
                "event_type": "swap_accepted",
                "metadata": {
                    "previous_status": "pending",
                    "new_status": "accepted"
                }
            }
        ]
        mock_message_repo.create_system_message.return_value = system_messages
        
        # Now we'll simulate a system message creation by directly calling the repository method
        # (In a real app, this would happen when a swap status changes)
        result = MessageRepository.create_system_message(
            swap_id=TEST_SWAP_ID,
            event_type=SystemMessageEvent.SWAP_ACCEPTED,
            content="The swap request has been accepted.",
            recipient_ids=[TEST_USER_ID, TEST_OTHER_USER_ID],
            metadata={
                "previous_status": "pending",
                "new_status": "accepted"
            }
        )
        
        # Since we've mocked the repository, we need to assert the mock was called
        mock_message_repo.create_system_message.assert_called_once_with(
            swap_id=TEST_SWAP_ID,
            event_type=SystemMessageEvent.SWAP_ACCEPTED,
            content="The swap request has been accepted.",
            recipient_ids=[TEST_USER_ID, TEST_OTHER_USER_ID],
            metadata={
                "previous_status": "pending",
                "new_status": "accepted"
            }
        )
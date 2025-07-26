# Testing Documentation for Messaging Functionality

This document outlines the comprehensive testing strategy for the messaging functionality in the clothing swap application.

## 1. Testing Overview

The testing strategy for the messaging functionality includes:

- **Backend API Tests**: Testing the API endpoints for message operations
- **Authorization Tests**: Verifying access control rules for messages
- **System Message Tests**: Testing automatic system message generation on swap status changes
- **Frontend Component Tests**: Testing UI components for message display and interaction
- **Integration Tests**: End-to-end testing of the messaging workflow

### Testing Frameworks

- **Backend**: pytest
- **Frontend**: Jest + React Testing Library
- **Integration**: Cypress

## 2. Backend Tests

### 2.1 API Tests (`backend/tests/api/test_messages.py`)

The backend API tests cover all message endpoints:

| Endpoint | Tests | Description |
|----------|-------|-------------|
| `GET /swap/{swap_id}` | `TestGetMessagesForSwap` | Tests retrieving all messages for a specific swap |
| `POST /swap/{swap_id}` | `TestSendMessage` | Tests creating new messages |
| `PUT /{message_id}/read` | `TestMarkMessageAsRead` | Tests marking messages as read |
| `GET /unread` | `TestGetUnreadMessageCount` | Tests retrieving unread message counts |
| `DELETE /{message_id}` | `TestDeleteMessage` | Tests message deletion |

### 2.2 Authorization Tests

The tests verify that:
- Only swap participants (owner or requester) can access messages
- Only the sender can delete their own messages
- Only the recipient can mark messages as read
- System messages cannot be deleted

### 2.3 System Message Tests

Tests for system messages verify:
- System messages are created when swap status changes
- System messages have the correct format and metadata
- System messages are delivered to all swap participants

### 2.4 Running Backend Tests

```bash
cd backend
pytest tests/api/test_messages.py -v
```

## 3. Frontend Tests

### 3.1 Component Tests

#### MessageItem (`frontend/src/components/messaging/__tests__/MessageItem.test.tsx`)

Tests verify:
- Rendering user messages correctly
- Rendering system messages correctly
- Proper positioning based on sender
- Highlight styling
- Timestamp formatting

#### MessageList (`frontend/src/components/messaging/__tests__/MessageList.test.tsx`)

Tests verify:
- Rendering multiple messages
- Loading state
- Empty state
- Proper message ordering
- Identifying current user messages

#### MessageComposer (`frontend/src/components/messaging/__tests__/MessageComposer.test.tsx`)

Tests verify:
- Text input handling
- Sending messages with button click
- Sending messages with Enter key
- Disabled state during loading
- Empty message validation
- Whitespace-only message validation

#### UnreadBadge (`frontend/src/components/messaging/__tests__/UnreadBadge.test.tsx`)

Tests verify:
- Badge display with count
- Badge styling
- Hidden state when count is zero
- Display capping for large numbers
- Size customization
- Placement customization

#### MessagePanel (`frontend/src/components/messaging/__tests__/MessagePanel.test.tsx`)

Tests verify:
- Loading state
- Fetching and displaying messages
- Automatic marking of unread messages as read
- Sending new messages
- Error handling
- Message polling
- Recipient name display

### 3.2 Running Frontend Tests

```bash
cd frontend
npm test -- --testPathPattern=messaging
```

## 4. Integration Tests

### 4.1 End-to-End Tests (`frontend/cypress/e2e/messaging.cy.ts`)

Integration tests verify:
- Complete messaging workflow
- Message viewing and sending
- System message display on swap status changes
- Unread message indicators
- Error handling

The tests use mock API responses via Cypress fixtures:
- `messages.json`: Regular messages
- `messages_with_status_change.json`: Messages including system status updates

### 4.2 Running Integration Tests

```bash
cd frontend
npm run cypress:run -- --spec "cypress/e2e/messaging.cy.ts"
```

## 5. Test Coverage

### 5.1 Coverage Summary

- **Backend API**: 100% coverage of all message endpoints
- **Authorization Rules**: 100% coverage of access control rules
- **System Messages**: All system message types are tested
- **Frontend Components**: All components and their key behaviors are tested
- **User Interactions**: Key user flows for sending and reading messages are tested

### 5.2 Edge Cases Tested

- Empty message handling
- Whitespace-only messages
- Large unread message counts
- Error states (API failures)
- Message polling and real-time updates
- Authorization edge cases

### 5.3 Known Limitations

- Tests assume DynamoDB is available and configured correctly
- Integration tests use mocked API responses rather than a real backend
- Socket-based real-time messaging is not tested (if implemented in the future)
- Performance testing for large message histories is not included

## 6. Future Recommendations

### 6.1 Test Coverage Improvements

- Add load tests for scenarios with many messages (1000+)
- Add chaos testing for intermittent API failures
- Test message ordering and threading in more detail
- Test messaging in different network conditions (slow/flaky)

### 6.2 Additional Test Scenarios

- Test multi-device synchronization of message read status
- Test message attachments (if implemented)
- Test message search functionality (if implemented)
- Test message pagination (if implemented)
- Test message deletion impact on conversation flow
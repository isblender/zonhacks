import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ChakraProvider } from '@chakra-ui/react';
import MessagePanel from '../MessagePanel';
import messageService from '../../../services/messageService';

// Mock messageService
jest.mock('../../../services/messageService', () => ({
  getMessagesForSwap: jest.fn(),
  sendMessage: jest.fn(),
  markMessageAsRead: jest.fn(),
}));

// Mock message data
const mockMessages = [
  {
    message_id: 'msg-123',
    swap_id: 'swap-456',
    sender_id: 'other-user',
    recipient_id: 'current-user',
    content: 'Hello! Is this item still available?',
    timestamp: '2025-07-26T12:34:56.789Z',
    is_read: false,
    message_type: 'user',
    event_type: null,
    metadata: null
  },
  {
    message_id: 'msg-456',
    swap_id: 'swap-456',
    sender_id: 'SYSTEM',
    recipient_id: 'current-user',
    content: 'The swap request has been accepted.',
    timestamp: '2025-07-26T12:40:56.789Z',
    is_read: false,
    message_type: 'system',
    event_type: 'swap_accepted',
    metadata: {
      previous_status: 'pending',
      new_status: 'accepted'
    }
  }
];

// Mock props
const mockProps = {
  swapId: 'swap-456',
  userId: 'current-user',
  recipientName: 'Other User'
};

describe('MessagePanel Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (messageService.getMessagesForSwap as jest.Mock).mockResolvedValue(mockMessages);
    (messageService.sendMessage as jest.Mock).mockResolvedValue({
      message_id: 'new-msg-123',
      swap_id: 'swap-456',
      sender_id: 'current-user',
      recipient_id: 'other-user',
      content: 'Yes, it is still available!',
      timestamp: '2025-07-26T12:50:56.789Z',
      is_read: false,
      message_type: 'user'
    });
    (messageService.markMessageAsRead as jest.Mock).mockResolvedValue({ is_read: true });
  });

  it('renders loading state initially', async () => {
    render(
      <ChakraProvider>
        <MessagePanel {...mockProps} />
      </ChakraProvider>
    );
    
    // Check for loading spinner
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('fetches and displays messages on mount', async () => {
    render(
      <ChakraProvider>
        <MessagePanel {...mockProps} />
      </ChakraProvider>
    );
    
    // Wait for messages to load
    await waitFor(() => {
      expect(screen.getByText('Hello! Is this item still available?')).toBeInTheDocument();
      expect(screen.getByText('The swap request has been accepted.')).toBeInTheDocument();
    });
    
    // Check if messageService was called correctly
    expect(messageService.getMessagesForSwap).toHaveBeenCalledWith('swap-456', 'current-user');
  });

  it('marks unread messages as read', async () => {
    render(
      <ChakraProvider>
        <MessagePanel {...mockProps} />
      </ChakraProvider>
    );
    
    // Wait for messages to load
    await waitFor(() => {
      expect(screen.getByText('Hello! Is this item still available?')).toBeInTheDocument();
    });
    
    // Check if markMessageAsRead was called for the unread message
    expect(messageService.markMessageAsRead).toHaveBeenCalledWith('msg-123', 'swap-456', 'current-user');
    expect(messageService.markMessageAsRead).toHaveBeenCalledWith('msg-456', 'swap-456', 'current-user');
  });

  it('sends new messages', async () => {
    const user = userEvent.setup();
    
    render(
      <ChakraProvider>
        <MessagePanel {...mockProps} />
      </ChakraProvider>
    );
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
    });
    
    // Type and send a new message
    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    await user.type(input, 'Yes, it is still available!');
    await user.click(sendButton);
    
    // Check if sendMessage was called correctly
    expect(messageService.sendMessage).toHaveBeenCalledWith('swap-456', 'current-user', 'Yes, it is still available!');
    
    // Check if the new message is added to the list
    await waitFor(() => {
      expect(screen.getByText('Yes, it is still available!')).toBeInTheDocument();
    });
  });

  it('shows error alert when message fetch fails', async () => {
    // Mock error response
    (messageService.getMessagesForSwap as jest.Mock).mockRejectedValue(new Error('Failed to load messages'));
    
    render(
      <ChakraProvider>
        <MessagePanel {...mockProps} />
      </ChakraProvider>
    );
    
    // Check for error alert
    await waitFor(() => {
      expect(screen.getByText('Failed to load messages. Please try again later.')).toBeInTheDocument();
    });
  });

  it('shows error alert when sending message fails', async () => {
    const user = userEvent.setup();
    
    // Setup successful message fetch but failed send
    (messageService.getMessagesForSwap as jest.Mock).mockResolvedValue(mockMessages);
    (messageService.sendMessage as jest.Mock).mockRejectedValue(new Error('Failed to send message'));
    
    render(
      <ChakraProvider>
        <MessagePanel {...mockProps} />
      </ChakraProvider>
    );
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
    });
    
    // Type and send a new message
    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    await user.type(input, 'Test message');
    await user.click(sendButton);
    
    // Check for error alert
    await waitFor(() => {
      expect(screen.getByText('Failed to send message. Please try again.')).toBeInTheDocument();
    });
  });

  it('polls for new messages periodically', async () => {
    // Setup jest fake timers to test polling
    jest.useFakeTimers();
    
    render(
      <ChakraProvider>
        <MessagePanel {...mockProps} />
      </ChakraProvider>
    );
    
    // Wait for initial load
    await waitFor(() => {
      expect(messageService.getMessagesForSwap).toHaveBeenCalledTimes(1);
    });
    
    // Fast forward 30 seconds (polling interval)
    act(() => {
      jest.advanceTimersByTime(30000);
    });
    
    // Check if getMessagesForSwap was called again
    expect(messageService.getMessagesForSwap).toHaveBeenCalledTimes(2);
    
    // Cleanup
    jest.useRealTimers();
  });

  it('displays recipient name in header when provided', () => {
    render(
      <ChakraProvider>
        <MessagePanel {...mockProps} />
      </ChakraProvider>
    );
    
    // Check if the recipient name is displayed in the header
    expect(screen.getByText('with Other User')).toBeInTheDocument();
  });
});
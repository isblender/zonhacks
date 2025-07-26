import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChakraProvider } from '@chakra-ui/react';
import MessageItem from '../MessageItem';

// Mock the message data
const userMessageProps = {
  message: {
    message_id: 'msg-123',
    swap_id: 'swap-456',
    sender_id: 'user-789',
    recipient_id: 'user-101',
    content: 'Hello! Is this item still available?',
    timestamp: '2025-07-26T12:34:56.789Z',
    is_read: false,
    message_type: 'user',
    event_type: null,
    metadata: null
  },
  isCurrentUser: false,
  highlight: false,
};

const systemMessageProps = {
  message: {
    message_id: 'msg-456',
    swap_id: 'swap-456',
    sender_id: 'SYSTEM',
    recipient_id: 'user-789',
    content: 'The swap request has been accepted.',
    timestamp: '2025-07-26T12:40:56.789Z',
    is_read: false,
    message_type: 'system',
    event_type: 'swap_accepted',
    metadata: {
      previous_status: 'pending',
      new_status: 'accepted'
    }
  },
  isCurrentUser: false,
  highlight: false,
};

const currentUserMessageProps = {
  ...userMessageProps,
  isCurrentUser: true,
};

const highlightedMessageProps = {
  ...userMessageProps,
  highlight: true,
};

describe('MessageItem Component', () => {
  it('renders user message correctly', () => {
    render(
      <ChakraProvider>
        <MessageItem {...userMessageProps} />
      </ChakraProvider>
    );

    // Check that message content is rendered
    expect(screen.getByText('Hello! Is this item still available?')).toBeInTheDocument();
    
    // Check timestamp formatting (might need adjustment depending on actual implementation)
    expect(screen.getByText(/12:34/)).toBeInTheDocument();
  });

  it('renders system message correctly', () => {
    render(
      <ChakraProvider>
        <MessageItem {...systemMessageProps} />
      </ChakraProvider>
    );

    // Check system message content is rendered
    expect(screen.getByText('The swap request has been accepted.')).toBeInTheDocument();
    
    // System messages typically have different styling or indicators
    // This will depend on the actual implementation
    const systemMessageElement = screen.getByText('The swap request has been accepted.').closest('div');
    expect(systemMessageElement).toHaveStyle('background-color: var(--chakra-colors-gray-100)'); // Adjust based on actual styling
  });

  it('positions current user messages correctly', () => {
    render(
      <ChakraProvider>
        <MessageItem {...currentUserMessageProps} />
      </ChakraProvider>
    );

    // Current user messages are typically right-aligned
    // This will depend on the actual implementation
    const messageContainer = screen.getByText('Hello! Is this item still available?').closest('div');
    expect(messageContainer?.parentElement).toHaveStyle('justify-content: flex-end');
  });

  it('applies highlight styling when highlighted', () => {
    render(
      <ChakraProvider>
        <MessageItem {...highlightedMessageProps} />
      </ChakraProvider>
    );

    // Highlighted messages should have a different background or border
    const messageElement = screen.getByText('Hello! Is this item still available?').closest('div');
    expect(messageElement).toHaveStyle('border: 2px solid var(--chakra-colors-blue-500)'); // Adjust based on actual styling
  });

  it('displays formatted timestamp correctly', () => {
    render(
      <ChakraProvider>
        <MessageItem {...userMessageProps} />
      </ChakraProvider>
    );

    // Check that timestamp is formatted (this might need to be adjusted based on actual implementation)
    const timestamp = new Date(userMessageProps.message.timestamp);
    const formattedTime = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    expect(screen.getByText(new RegExp(formattedTime))).toBeInTheDocument();
  });
});
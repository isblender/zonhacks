import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChakraProvider } from '@chakra-ui/react';
import MessageList from '../MessageList';

// Sample messages data
const messages = [
  {
    message_id: 'msg-123',
    swap_id: 'swap-456',
    sender_id: 'user-789',
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
  },
  {
    message_id: 'msg-789',
    swap_id: 'swap-456',
    sender_id: 'current-user',
    recipient_id: 'user-789',
    content: 'Thanks for your interest! Yes, it is still available.',
    timestamp: '2025-07-26T12:45:56.789Z',
    is_read: true,
    message_type: 'user',
    event_type: null,
    metadata: null
  }
];

describe('MessageList Component', () => {
  it('renders all messages correctly', () => {
    render(
      <ChakraProvider>
        <MessageList 
          messages={messages}
          currentUserId="current-user"
          isLoading={false}
        />
      </ChakraProvider>
    );

    // Check that all messages are rendered
    expect(screen.getByText('Hello! Is this item still available?')).toBeInTheDocument();
    expect(screen.getByText('The swap request has been accepted.')).toBeInTheDocument();
    expect(screen.getByText('Thanks for your interest! Yes, it is still available.')).toBeInTheDocument();
  });

  it('shows loading indicator when isLoading is true', () => {
    render(
      <ChakraProvider>
        <MessageList 
          messages={messages}
          currentUserId="current-user"
          isLoading={true}
        />
      </ChakraProvider>
    );

    // Check for loading indicator (spinner or text)
    // This depends on the actual implementation
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    
    // Messages should still be visible while loading
    expect(screen.getByText('Hello! Is this item still available?')).toBeInTheDocument();
  });

  it('handles empty message list', () => {
    render(
      <ChakraProvider>
        <MessageList 
          messages={[]}
          currentUserId="current-user"
          isLoading={false}
        />
      </ChakraProvider>
    );

    // Check for empty state message or component
    // This depends on the actual implementation
    expect(screen.getByText(/No messages/i)).toBeInTheDocument();
  });

  it('identifies current user messages correctly', () => {
    const { container } = render(
      <ChakraProvider>
        <MessageList 
          messages={messages}
          currentUserId="current-user"
          isLoading={false}
        />
      </ChakraProvider>
    );

    // This is a more complex test that would need to inspect the DOM
    // to verify that messages are properly styled based on sender
    // For the current user's message:
    const userMessage = screen.getByText('Thanks for your interest! Yes, it is still available.');
    const userMessageContainer = userMessage.closest('div');
    
    // The specific assertion will depend on how your component visually differentiates sent vs received messages
    expect(userMessageContainer?.parentElement).toHaveStyle('justify-content: flex-end');
  });

  it('displays messages in chronological order', () => {
    const { container } = render(
      <ChakraProvider>
        <MessageList 
          messages={messages}
          currentUserId="current-user"
          isLoading={false}
        />
      </ChakraProvider>
    );

    // This test assumes that messages are rendered in order
    // Get all message elements
    const messageElements = container.querySelectorAll('[data-testid^="message-"]');
    
    // Check that they appear in the correct order
    expect(messageElements[0].textContent).toContain('Hello! Is this item still available?');
    expect(messageElements[1].textContent).toContain('The swap request has been accepted.');
    expect(messageElements[2].textContent).toContain('Thanks for your interest! Yes, it is still available.');
  });
});
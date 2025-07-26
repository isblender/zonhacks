import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ChakraProvider } from '@chakra-ui/react';
import MessageComposer from '../MessageComposer';

describe('MessageComposer Component', () => {
  it('renders correctly with default props', () => {
    const mockSendMessage = jest.fn();
    
    render(
      <ChakraProvider>
        <MessageComposer 
          onSendMessage={mockSendMessage}
          isLoading={false}
          placeholder="Type your message..."
        />
      </ChakraProvider>
    );
    
    // Check if input and send button are rendered
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('handles text input correctly', async () => {
    const mockSendMessage = jest.fn();
    const user = userEvent.setup();
    
    render(
      <ChakraProvider>
        <MessageComposer 
          onSendMessage={mockSendMessage}
          isLoading={false}
          placeholder="Type your message..."
        />
      </ChakraProvider>
    );
    
    // Get the text input
    const textInput = screen.getByPlaceholderText('Type your message...');
    
    // Type a message
    await user.type(textInput, 'Hello, is this item available?');
    
    // Check if the input value was updated
    expect(textInput).toHaveValue('Hello, is this item available?');
  });

  it('calls onSendMessage when send button is clicked', async () => {
    const mockSendMessage = jest.fn();
    const user = userEvent.setup();
    
    render(
      <ChakraProvider>
        <MessageComposer 
          onSendMessage={mockSendMessage}
          isLoading={false}
          placeholder="Type your message..."
        />
      </ChakraProvider>
    );
    
    // Get the text input and send button
    const textInput = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    // Type a message
    await user.type(textInput, 'Hello, is this item available?');
    
    // Click the send button
    await user.click(sendButton);
    
    // Check if onSendMessage was called with the correct text
    expect(mockSendMessage).toHaveBeenCalledWith('Hello, is this item available?');
    
    // Check if the input was cleared after sending
    expect(textInput).toHaveValue('');
  });

  it('calls onSendMessage when Enter key is pressed', async () => {
    const mockSendMessage = jest.fn();
    const user = userEvent.setup();
    
    render(
      <ChakraProvider>
        <MessageComposer 
          onSendMessage={mockSendMessage}
          isLoading={false}
          placeholder="Type your message..."
        />
      </ChakraProvider>
    );
    
    // Get the text input
    const textInput = screen.getByPlaceholderText('Type your message...');
    
    // Type a message and press Enter
    await user.type(textInput, 'Hello, is this item available?{enter}');
    
    // Check if onSendMessage was called with the correct text
    expect(mockSendMessage).toHaveBeenCalledWith('Hello, is this item available?');
    
    // Check if the input was cleared after sending
    expect(textInput).toHaveValue('');
  });

  it('disables input and button when isLoading is true', () => {
    const mockSendMessage = jest.fn();
    
    render(
      <ChakraProvider>
        <MessageComposer 
          onSendMessage={mockSendMessage}
          isLoading={true}
          placeholder="Type your message..."
        />
      </ChakraProvider>
    );
    
    // Check if input and button are disabled
    const textInput = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    expect(textInput).toBeDisabled();
    expect(sendButton).toBeDisabled();
  });

  it('does not call onSendMessage when empty message is submitted', async () => {
    const mockSendMessage = jest.fn();
    const user = userEvent.setup();
    
    render(
      <ChakraProvider>
        <MessageComposer 
          onSendMessage={mockSendMessage}
          isLoading={false}
          placeholder="Type your message..."
        />
      </ChakraProvider>
    );
    
    // Get the send button
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    // Click the send button without typing anything
    await user.click(sendButton);
    
    // Check that onSendMessage was not called
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it('does not call onSendMessage when only whitespace is submitted', async () => {
    const mockSendMessage = jest.fn();
    const user = userEvent.setup();
    
    render(
      <ChakraProvider>
        <MessageComposer 
          onSendMessage={mockSendMessage}
          isLoading={false}
          placeholder="Type your message..."
        />
      </ChakraProvider>
    );
    
    // Get the text input and send button
    const textInput = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    // Type only whitespace
    await user.type(textInput, '   ');
    
    // Click the send button
    await user.click(sendButton);
    
    // Check that onSendMessage was not called
    expect(mockSendMessage).not.toHaveBeenCalled();
  });
});
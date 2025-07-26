import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  Heading,
  Divider,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  useColorModeValue,
  Text
} from '@chakra-ui/react';
import MessageList from './MessageList';
import MessageComposer from './MessageComposer';
import messageService, { Message } from '../../services/messageService';

interface MessagePanelProps {
  swapId: string;
  userId: string;
  recipientName?: string;
}

/**
 * Container component for the entire messaging interface
 * Handles API calls, state management, and coordination between child components
 */
const MessagePanel: React.FC<MessagePanelProps> = ({
  swapId,
  userId,
  recipientName
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Fetch messages for the swap
  const fetchMessages = useCallback(async () => {
    if (!swapId || !userId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const fetchedMessages = await messageService.getMessagesForSwap(swapId, userId);
      
      // Set messages only if we got a valid array back
      if (Array.isArray(fetchedMessages)) {
        setMessages(fetchedMessages);
        
        // Mark unread messages as read
        const unreadMessages = fetchedMessages.filter(
          message => !message.is_read && message.recipient_id === userId
        );
        
        if (unreadMessages.length > 0) {
          try {
            // Mark messages as read in parallel
            await Promise.all(
              unreadMessages.map(message =>
                messageService.markMessageAsRead(message.message_id, swapId, userId)
              )
            );
          } catch (markError) {
            console.warn('Error marking messages as read:', markError);
            // Continue execution even if marking as read fails
          }
        }
      } else {
        // If we get here, the API returned something other than an array
        console.warn('API returned invalid messages format:', fetchedMessages);
        setMessages([]);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages. The messaging service might be temporarily unavailable.');
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, [swapId, userId]);

  // Fetch messages on component mount and when dependencies change
  useEffect(() => {
    fetchMessages();
    
    // Optional: Set up polling for new messages
    const intervalId = setInterval(fetchMessages, 30000); // Poll every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [fetchMessages]);

  // Send a new message
  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isSending) return;
    
    setIsSending(true);
    
    try {
      const newMessage = await messageService.sendMessage(swapId, userId, content);
      
      // Add the new message to the state if we got a valid response
      if (newMessage && newMessage.message_id) {
        setMessages(prevMessages => [...prevMessages, newMessage]);
      } else {
        // Create a temporary local-only message for better UX
        const tempMessage = {
          message_id: `temp-${Date.now()}`,
          swap_id: swapId,
          sender_id: userId,
          recipient_id: '',  // We don't know the recipient ID here
          content: content,
          timestamp: new Date().toISOString(),
          is_read: true,
          message_type: 'user' as const
        };
        
        setMessages(prevMessages => [...prevMessages, tempMessage]);
        setError('Message sent but not saved to server. It may not be visible to the recipient.');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. The messaging service might be temporarily unavailable.');
      
      // Still add the message to the UI for better UX, but mark it as unsent
      const tempMessage = {
        message_id: `temp-${Date.now()}`,
        swap_id: swapId,
        sender_id: userId,
        recipient_id: '',
        content: `${content} (Not sent - please try again)`,
        timestamp: new Date().toISOString(),
        is_read: true,
        message_type: 'user' as const
      };
      
      setMessages(prevMessages => [...prevMessages, tempMessage]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Box
      height="100%"
      borderWidth="1px"
      borderRadius="lg"
      borderColor={borderColor}
      bg={bgColor}
      overflow="hidden"
      display="flex"
      flexDirection="column"
    >
      {/* Header */}
      <Box p={4} borderBottomWidth="1px" borderColor={borderColor}>
        <Heading size="md" fontWeight="semibold">
          Messages
          {recipientName && (
            <Text as="span" fontWeight="normal" color="gray.500" ml={2}>
              with {recipientName}
            </Text>
          )}
        </Heading>
      </Box>

      {/* Error alert */}
      {error && (
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      )}

      {/* Message content area */}
      <Box flex="1" overflow="hidden" position="relative">
        {isLoading && messages.length === 0 ? (
          <Center h="100%">
            <Spinner size="lg" color="blue.500" />
          </Center>
        ) : (
          <MessageList
            messages={messages}
            currentUserId={userId}
            isLoading={isLoading}
          />
        )}
      </Box>

      {/* Message composer */}
      <MessageComposer
        onSendMessage={handleSendMessage}
        isLoading={isSending}
        placeholder="Type your message..."
      />
    </Box>
  );
};

export default MessagePanel;
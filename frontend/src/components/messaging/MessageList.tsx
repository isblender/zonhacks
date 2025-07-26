import React, { useEffect, useRef } from 'react';
import {
  VStack,
  Box,
  Text,
  Divider,
  useColorModeValue,
} from '@chakra-ui/react';
import MessageItem from './MessageItem';
import { Message } from '../../services/messageService';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  isLoading?: boolean;
}

/**
 * Component for displaying a list of messages in a conversation
 * Automatically scrolls to the bottom when new messages arrive
 */
const MessageList: React.FC<MessageListProps> = ({ messages, currentUserId, isLoading = false }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emptyStateColor = useColorModeValue('gray.500', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Group messages by date for better visual separation
  const groupMessagesByDate = () => {
    const groups: { [key: string]: Message[] } = {};
    
    messages.forEach(message => {
      const date = new Date(message.timestamp).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  };

  const messageGroups = groupMessagesByDate();

  if (isLoading) {
    return (
      <Box
        w="100%"
        h="100%"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Text color={emptyStateColor}>Loading messages...</Text>
      </Box>
    );
  }

  if (messages.length === 0) {
    return (
      <Box
        w="100%"
        h="100%"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Text color={emptyStateColor}>No messages yet. Start the conversation!</Text>
      </Box>
    );
  }

  return (
    <Box 
      w="100%" 
      h="100%" 
      overflowY="auto" 
      p={4}
    >
      {Object.keys(messageGroups).map((date) => (
        <VStack key={date} spacing={2} align="stretch" mb={4}>
          <Divider />
          <Box textAlign="center" my={2}>
            <Text
              fontSize="xs"
              color={emptyStateColor}
              px={2}
              py={1}
              borderRadius="md"
              bg={useColorModeValue('gray.100', 'gray.700')}
              display="inline-block"
            >
              {date}
            </Text>
          </Box>
          
          {messageGroups[date].map((message) => (
            <MessageItem
              key={message.message_id}
              message={message}
              isCurrentUser={message.sender_id === currentUserId}
            />
          ))}
        </VStack>
      ))}
      
      <div ref={messagesEndRef} />
    </Box>
  );
};

export default MessageList;
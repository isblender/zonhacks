import React from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Avatar,
  Flex,
  useColorModeValue,
  Tooltip,
  Icon,
  Divider
} from '@chakra-ui/react';
import { Message, MessageType } from '../../services/messageService';
import { InfoIcon } from '@chakra-ui/icons';

interface MessageItemProps {
  message: Message;
  isCurrentUser: boolean;
}

/**
 * Component for displaying an individual message
 * Shows different styling based on whether the message is from the current user or system
 */
const MessageItem: React.FC<MessageItemProps> = ({ message, isCurrentUser }) => {
  const isSystemMessage = message.message_type === 'system';
  
  // Different styling for user vs system messages
  const bgColor = useColorModeValue(
    isSystemMessage ? 'orange.50' : (isCurrentUser ? 'blue.100' : 'gray.100'),
    isSystemMessage ? 'gray.600' : (isCurrentUser ? 'blue.700' : 'gray.700')
  );
  
  const textColor = useColorModeValue(
    isSystemMessage ? 'gray.700' : 'gray.800',
    isSystemMessage ? 'gray.100' : 'white'
  );

  const timeColor = useColorModeValue(
    'gray.500',
    'gray.400'
  );
  
  const borderColor = useColorModeValue(
    isSystemMessage ? 'orange.200' : 'transparent',
    isSystemMessage ? 'gray.500' : 'transparent'
  );

  // Format timestamp
  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const formattedDate = new Date(message.timestamp).toLocaleDateString();
  
  // System messages are centered and have special styling
  if (isSystemMessage) {
    return (
      <Flex
        w="100%"
        justify="center"
        mb={2}
        mt={4}
      >
        <VStack spacing={1} w="90%" maxW="500px">
          <HStack w="100%" justify="center" my={1}>
            <Divider flex="1" />
            <Box px={3}>
              <InfoIcon color="orange.400" />
            </Box>
            <Divider flex="1" />
          </HStack>
          
          <Box
            px={4}
            py={2}
            borderRadius="lg"
            bg={bgColor}
            boxShadow="sm"
            maxW="100%"
            textAlign="center"
            borderWidth="1px"
            borderColor={borderColor}
            w="100%"
          >
            <Text color={textColor} fontSize="md" fontWeight="medium">
              {message.content}
            </Text>
          </Box>
          
          <Tooltip label={formattedDate} placement="bottom">
            <Text fontSize="xs" color={timeColor} mt={1}>
              {formattedTime}
            </Text>
          </Tooltip>
        </VStack>
      </Flex>
    );
  }

  // Regular user message
  return (
    <Flex
      w="100%"
      justify={isCurrentUser ? 'flex-end' : 'flex-start'}
      mb={2}
    >
      <HStack alignItems="flex-start" spacing={2} maxW="80%">
        {!isCurrentUser && (
          <Avatar size="sm" name="User" bg="teal.500" />
        )}
        
        <VStack alignItems={isCurrentUser ? 'flex-end' : 'flex-start'} spacing={0}>
          <Box
            px={4}
            py={2}
            borderRadius="lg"
            bg={bgColor}
            boxShadow="sm"
            maxW="100%"
          >
            <Text color={textColor} fontSize="md" wordBreak="break-word">
              {message.content}
            </Text>
          </Box>
          
          <Tooltip label={formattedDate} placement="bottom">
            <Text fontSize="xs" color={timeColor} mt={1}>
              {formattedTime}
              {!message.is_read && isCurrentUser && (
                <Text as="span" ml={1} fontSize="xs">
                  • Delivered
                </Text>
              )}
              {message.is_read && isCurrentUser && (
                <Text as="span" ml={1} fontSize="xs">
                  • Read
                </Text>
              )}
            </Text>
          </Tooltip>
        </VStack>
        
        {isCurrentUser && (
          <Avatar size="sm" name="Me" bg="blue.500" />
        )}
      </HStack>
    </Flex>
  );
};

export default MessageItem;
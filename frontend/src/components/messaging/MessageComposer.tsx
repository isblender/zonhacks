import React, { useState, KeyboardEvent } from 'react';
import {
  Box,
  Input,
  InputGroup,
  IconButton,
  InputRightElement,
  useColorModeValue,
} from '@chakra-ui/react';
import { ArrowForwardIcon } from '@chakra-ui/icons';

interface MessageComposerProps {
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

/**
 * Component for composing and sending new messages
 * Includes an input field and send button
 */
const MessageComposer: React.FC<MessageComposerProps> = ({
  onSendMessage,
  isLoading = false,
  placeholder = "Type a message..."
}) => {
  const [message, setMessage] = useState('');
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  const handleSend = () => {
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };
  
  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  return (
    <Box p={3} borderTop="1px solid" borderColor={borderColor} bg={bgColor}>
      <InputGroup size="md">
        <Input
          placeholder={placeholder}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          pr="4.5rem"
          disabled={isLoading}
          focusBorderColor="blue.400"
          borderRadius="full"
        />
        <InputRightElement width="4.5rem">
          <IconButton
            h="1.75rem"
            size="sm"
            aria-label="Send message"
            icon={<ArrowForwardIcon />}
            isDisabled={!message.trim() || isLoading}
            onClick={handleSend}
            colorScheme="blue"
            borderRadius="full"
          />
        </InputRightElement>
      </InputGroup>
    </Box>
  );
};

export default MessageComposer;
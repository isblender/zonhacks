import React from 'react';
import {
  Badge,
  Box,
  useColorModeValue,
} from '@chakra-ui/react';

interface UnreadBadgeProps {
  count: number;
  size?: 'sm' | 'md' | 'lg';
  maxCount?: number;
}

/**
 * Component to display an unread message count badge
 * Shows a badge with the number of unread messages, with an optional maximum display count
 */
const UnreadBadge: React.FC<UnreadBadgeProps> = ({
  count,
  size = 'md',
  maxCount = 99
}) => {
  if (count === 0) {
    return null;
  }

  // Determine badge size
  const badgeSizes = {
    sm: {
      minWidth: '1.2rem',
      height: '1.2rem',
      fontSize: 'xs',
      px: 1,
    },
    md: {
      minWidth: '1.5rem',
      height: '1.5rem',
      fontSize: 'sm',
      px: 1,
    },
    lg: {
      minWidth: '1.8rem',
      height: '1.8rem',
      fontSize: 'md',
      px: 1,
    },
  };
  
  // Format the count display
  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();
  
  return (
    <Badge
      colorScheme="red"
      borderRadius="full"
      variant="solid"
      display="flex"
      alignItems="center"
      justifyContent="center"
      {...badgeSizes[size]}
    >
      {displayCount}
    </Badge>
  );
};

export default UnreadBadge;
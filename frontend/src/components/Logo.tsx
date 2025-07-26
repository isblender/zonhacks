import React from 'react';
import { Box, Text, HStack, Image } from '@chakra-ui/react';
import recyclingIcon from '../assets/circle_arrows.jpg';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true }) => {
  const sizeMap = {
    sm: { icon: 24, text: 'md' },
    md: { icon: 32, text: 'lg' },
    lg: { icon: 48, text: 'xl' }
  };

  const iconSize = sizeMap[size].icon;
  const textSize = sizeMap[size].text;

  return (
    <HStack spacing={showText ? 2 : 0} align="center">
      {/* Recycling icon with gradient overlay */}
      <Box
        width={`${iconSize}px`}
        height={`${iconSize}px`}
        position="relative"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Box
          position="relative"
          width="100%"
          height="100%"
          borderRadius="4px"
          overflow="hidden"
        >
          {/* Base recycling image without gradient */}
          <Image
            src={recyclingIcon}
            alt="Swaps Logo"
            width="100%"
            height="100%"
            objectFit="contain"
          />
        </Box>
      </Box>

      {/* Text with gradient */}
      {showText && (
        <Text
          fontSize={textSize}
          fontWeight="bold"
          background="#2b4859"
          backgroundClip="text"
          color="transparent"
          letterSpacing="tight"
        >
          Swaps
        </Text>
      )}
    </HStack>
  );
};

export default Logo;

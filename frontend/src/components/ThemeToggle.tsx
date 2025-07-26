import React from 'react';
import { IconButton } from '@chakra-ui/react';
import { SunIcon, MoonIcon } from '@chakra-ui/icons';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeToggleProps {
  size?: 'sm' | 'md' | 'lg';
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ size = 'md' }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <IconButton
      aria-label="Toggle theme"
      icon={isDark ? <SunIcon /> : <MoonIcon />}
      onClick={toggleTheme}
      size={size}
      variant="ghost"
      colorScheme="gray"
    />
  );
};

export default ThemeToggle;

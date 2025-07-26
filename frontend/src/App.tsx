import React, { useState } from 'react';
import {
  Box,
  Flex,
  VStack,
  Text,
  Button,
  IconButton,
} from '@chakra-ui/react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';

// Import page components (we'll create these)
import Gallery from './pages/Gallery';
import SwapRequests from './pages/SwapRequests';
import Leaderboard from './pages/Leaderboard';
import Login from './pages/Login';
import Logo from './components/Logo';
import ThemeToggle from './components/ThemeToggle';
import { useTheme } from './contexts/ThemeContext';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();

  // Mock user data - in real app this would come from auth context
  const user = {
    name: 'John Doe',
    email: 'john@example.com',
    swapCount: 12
  };

  const menuItems = [
    { label: 'Gallery', path: '/gallery', icon: '🏪' },
    { label: 'Swap Requests', path: '/swap-requests', icon: '🔄' },
    { label: 'Leaderboard', path: '/leaderboard', icon: '🏆' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <Box
      w={isCollapsed ? '60px' : '280px'}
      h="100vh"
      bg={isDark ? 'gray.800' : 'white'}
      borderRight="1px solid"
      borderColor={isDark ? 'gray.600' : 'gray.200'}
      transition="width 0.3s ease"
      position="fixed"
      left={0}
      top={0}
      zIndex={1000}
    >
      <VStack spacing={0} align="stretch" h="full">
        {/* Header with toggle button */}
        <Flex
          p={4}
          justify={isCollapsed ? 'center' : 'space-between'}
          align="center"
          borderBottom="1px solid"
          borderColor={isDark ? 'gray.600' : 'gray.200'}
        >
          {!isCollapsed && (
            <Logo size="md" showText={true} />
          )}
          {isCollapsed && (
            <Logo size="sm" showText={false} />
          )}
          <Flex gap={2}>
            {!isCollapsed && <ThemeToggle size="sm" />}
            <IconButton
              aria-label="Toggle sidebar"
              size="sm"
              variant="ghost"
              onClick={onToggle}
            >
              {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </IconButton>
          </Flex>
        </Flex>

        {/* User Profile Section */}
        <Box p={4} borderBottom="1px solid" borderColor={isDark ? 'gray.600' : 'gray.200'}>
          <VStack spacing={3} align={isCollapsed ? 'center' : 'start'}>
            <Box
              w={isCollapsed ? '32px' : '48px'}
              h={isCollapsed ? '32px' : '48px'}
              bg="gray.500"
              borderRadius="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
              color="white"
              fontWeight="bold"
            >
              {user.name.charAt(0)}
            </Box>
            {!isCollapsed && (
              <VStack spacing={1} align="start">
                <Text fontWeight="semibold" fontSize="sm" color={isDark ? 'white' : 'gray.800'}>
                  {user.name}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {user.email}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {user.swapCount} swaps completed
                </Text>
              </VStack>
            )}
          </VStack>
        </Box>

        {/* Navigation Menu */}
        <VStack spacing={1} align="stretch" p={2} flex={1}>
          {menuItems.map((item) => (
            <Button
              key={item.path}
              variant={location.pathname === item.path ? 'solid' : 'ghost'}
              colorScheme="gray"
              justifyContent={isCollapsed ? 'center' : 'flex-start'}
              onClick={() => handleNavigation(item.path)}
              size="md"
              w="full"
              px={isCollapsed ? 2 : 4}
            >
              <Text mr={isCollapsed ? 0 : 2}>{item.icon}</Text>
              {!isCollapsed && item.label}
            </Button>
          ))}
        </VStack>

        {/* Logout Button */}
        <Box p={2} borderTop="1px solid" borderColor={isDark ? 'gray.600' : 'gray.200'}>
          <Button
            variant="ghost"
            colorScheme="red"
            size="sm"
            w="full"
            justifyContent={isCollapsed ? 'center' : 'flex-start'}
            onClick={() => navigate('/login')}
          >
            {isCollapsed ? '🚪' : 'Logout'}
          </Button>
        </Box>
      </VStack>
    </Box>
  );
};

const App: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const location = useLocation();
  const { isDark } = useTheme();

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Don't show sidebar on login page
  const showSidebar = location.pathname !== '/login';

  return (
    <Flex h="100vh" bg={isDark ? 'gray.900' : 'gray.50'}>
      {showSidebar && (
        <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
      )}
      
      <Box
        flex={1}
        ml={showSidebar ? (isSidebarCollapsed ? '60px' : '280px') : 0}
        transition="margin-left 0.3s ease"
        overflow="auto"
        bg={isDark ? 'gray.900' : 'gray.50'}
      >
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Gallery />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/swap-requests" element={<SwapRequests />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
        </Routes>
      </Box>
    </Flex>
  );
};

export default App;

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
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons';

// Import page components (we'll create these)
import Gallery from './pages/Gallery';
import SwapRequests from './pages/SwapRequests';
import Leaderboard from './pages/Leaderboard';
import Login from './pages/Login';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();

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
      bg="gray.50"
      borderRight="1px solid"
      borderColor="gray.200"
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
          borderColor="gray.200"
        >
          {!isCollapsed && (
            <Text fontSize="lg" fontWeight="bold" color="green.500">
              ClothingSwap
            </Text>
          )}
          <IconButton
            aria-label="Toggle sidebar"
            size="sm"
            variant="ghost"
            onClick={onToggle}
          >
            {isCollapsed ? <HamburgerIcon /> : <CloseIcon />}
          </IconButton>
        </Flex>

        {/* User Profile Section */}
        <Box p={4} borderBottom="1px solid" borderColor="gray.200">
          <VStack spacing={3} align={isCollapsed ? 'center' : 'start'}>
            <Box
              w={isCollapsed ? '32px' : '48px'}
              h={isCollapsed ? '32px' : '48px'}
              bg="green.500"
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
                <Text fontWeight="semibold" fontSize="sm">
                  {user.name}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {user.email}
                </Text>
                <Text fontSize="xs" color="green.500">
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
              colorScheme={location.pathname === item.path ? 'green' : 'gray'}
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
        <Box p={2} borderTop="1px solid" borderColor="gray.200">
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

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Don't show sidebar on login page
  const showSidebar = location.pathname !== '/login';

  return (
    <Flex h="100vh">
      {showSidebar && (
        <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
      )}
      
      <Box
        flex={1}
        ml={showSidebar ? (isSidebarCollapsed ? '60px' : '280px') : 0}
        transition="margin-left 0.3s ease"
        overflow="auto"
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

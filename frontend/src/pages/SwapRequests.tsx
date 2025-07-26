import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Heading,
  Badge,
  Image,
} from '@chakra-ui/react';
import { useTheme } from '../contexts/ThemeContext';

interface SwapRequest {
  id: string;
  itemRequested: {
    id: string;
    title: string;
    imageUrl: string;
    owner: string;
  };
  itemOffered: {
    id: string;
    title: string;
    imageUrl: string;
    owner: string;
  };
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  createdAt: string;
  message?: string;
}

const SwapRequests: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing' | 'completed'>('incoming');
  const { isDark } = useTheme();
  const [requests, setRequests] = useState<SwapRequest[]>([
    {
      id: '1',
      itemRequested: {
        id: '1',
        title: 'Vintage Denim Jacket',
        imageUrl: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=150&h=150&fit=crop',
        owner: 'Sarah Johnson'
      },
      itemOffered: {
        id: '7',
        title: 'Leather Boots',
        imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=150&h=150&fit=crop',
        owner: 'John Doe'
      },
      status: 'pending',
      createdAt: '2024-01-15',
      message: 'Hi! I love your denim jacket. Would you be interested in swapping for my leather boots?'
    },
    {
      id: '2',
      itemRequested: {
        id: '8',
        title: 'Red Sweater',
        imageUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=150&h=150&fit=crop',
        owner: 'John Doe'
      },
      itemOffered: {
        id: '2',
        title: 'Summer Floral Dress',
        imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=150&h=150&fit=crop',
        owner: 'Emma Wilson'
      },
      status: 'pending',
      createdAt: '2024-01-14',
      message: 'Your sweater would be perfect for the winter season!'
    },
    {
      id: '3',
      itemRequested: {
        id: '3',
        title: 'Black Leather Boots',
        imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=150&h=150&fit=crop',
        owner: 'Mike Chen'
      },
      itemOffered: {
        id: '9',
        title: 'Blue Jeans',
        imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=150&h=150&fit=crop',
        owner: 'John Doe'
      },
      status: 'accepted',
      createdAt: '2024-01-10'
    },
    {
      id: '4',
      itemRequested: {
        id: '10',
        title: 'White Shirt',
        imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=150&h=150&fit=crop',
        owner: 'John Doe'
      },
      itemOffered: {
        id: '4',
        title: 'Cozy Knit Sweater',
        imageUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=150&h=150&fit=crop',
        owner: 'Lisa Park'
      },
      status: 'completed',
      createdAt: '2024-01-05'
    }
  ]);

  const handleAcceptRequest = (requestId: string) => {
    setRequests(prev => prev.map(req => 
      req.id === requestId ? { ...req, status: 'accepted' as const } : req
    ));
  };

  const handleDeclineRequest = (requestId: string) => {
    setRequests(prev => prev.map(req => 
      req.id === requestId ? { ...req, status: 'declined' as const } : req
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'yellow';
      case 'accepted': return 'green';
      case 'declined': return 'red';
      case 'completed': return 'blue';
      default: return 'gray';
    }
  };

  const incomingRequests = requests.filter(req => req.status === 'pending');
  const outgoingRequests = requests.filter(req => req.itemOffered.owner === 'John Doe');
  const completedSwaps = requests.filter(req => req.status === 'completed');

  const getCurrentRequests = () => {
    switch (activeTab) {
      case 'incoming': return incomingRequests;
      case 'outgoing': return outgoingRequests;
      case 'completed': return completedSwaps;
      default: return [];
    }
  };

  const SwapRequestCard: React.FC<{ request: SwapRequest; showActions?: boolean }> = ({ 
    request, 
    showActions = false 
  }) => (
    <Box
      bg={isDark ? 'gray.800' : 'white'}
      p={6}
      borderRadius="lg"
      boxShadow="md"
      border="1px solid"
      borderColor={isDark ? 'gray.600' : 'gray.200'}
      w="100%"
      maxW="none"
    >
      <VStack spacing={4} align="stretch">
        <HStack justify="space-between">
          <Text fontSize="sm" color="gray.500">
            {new Date(request.createdAt).toLocaleDateString()}
          </Text>
          <Badge colorScheme={getStatusColor(request.status)}>
            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
          </Badge>
        </HStack>

        <HStack spacing={8} align="center" w="100%">
          {/* Requested Item */}
          <VStack spacing={3} flex={1} minW="0">
            <Text fontSize="md" fontWeight="medium" color="gray.600">
              Requested
            </Text>
            <Image
              src={request.itemRequested.imageUrl}
              alt={request.itemRequested.title}
              w="120px"
              h="120px"
              objectFit="cover"
              borderRadius="lg"
            />
            <VStack spacing={1}>
              <Text fontSize="lg" fontWeight="bold" textAlign="center" color={isDark ? 'white' : 'gray.800'}>
                {request.itemRequested.title}
              </Text>
              <Text fontSize="sm" color="gray.500">
                by {request.itemRequested.owner}
              </Text>
            </VStack>
          </VStack>

          {/* Arrow */}
          <Box color="gray.400" fontSize="3xl" px={4}>
            ↔️
          </Box>

          {/* Offered Item */}
          <VStack spacing={3} flex={1} minW="0">
            <Text fontSize="md" fontWeight="medium" color="gray.600">
              Offered
            </Text>
            <Image
              src={request.itemOffered.imageUrl}
              alt={request.itemOffered.title}
              w="120px"
              h="120px"
              objectFit="cover"
              borderRadius="lg"
            />
            <VStack spacing={1}>
              <Text fontSize="lg" fontWeight="bold" textAlign="center" color={isDark ? 'white' : 'gray.800'}>
                {request.itemOffered.title}
              </Text>
              <Text fontSize="sm" color="gray.500">
                by {request.itemOffered.owner}
              </Text>
            </VStack>
          </VStack>
        </HStack>

        {request.message && (
          <Box bg={isDark ? 'gray.700' : 'gray.50'} p={4} borderRadius="lg" w="100%">
            <Text fontSize="md" color={isDark ? 'gray.300' : 'gray.700'}>
              "{request.message}"
            </Text>
          </Box>
        )}

        {showActions && request.status === 'pending' && (
          <HStack spacing={2}>
            <Button
              colorScheme="gray"
              size="sm"
              flex={1}
              onClick={() => handleAcceptRequest(request.id)}
            >
              Accept
            </Button>
            <Button
              colorScheme="red"
              variant="outline"
              size="sm"
              flex={1}
              onClick={() => handleDeclineRequest(request.id)}
            >
              Decline
            </Button>
          </HStack>
        )}
      </VStack>
    </Box>
  );

  return (
    <Box 
      w="100%"
      h="100vh"
      p={0}
      overflow="auto"
      bg={isDark ? 'gray.900' : 'gray.50'}
      position="relative"
    >
      <VStack spacing={6} align="stretch" p={0} w="100%" minH="100%">
        <Box px={2} pt={6}>
          <Heading size="lg" mb={2} color={isDark ? 'white' : 'gray.800'}>Swap Requests</Heading>
          <Text color="gray.600">Manage your incoming and outgoing swap requests</Text>
        </Box>

        {/* Custom Tab Navigation */}
        <Box px={2}>
          <HStack spacing={2} bg={isDark ? 'gray.700' : 'gray.100'} p={1} borderRadius="lg">
            <Button
              size="sm"
              variant={activeTab === 'incoming' ? 'solid' : 'ghost'}
              colorScheme="gray"
              bg={activeTab === 'incoming' ? (isDark ? 'gray.600' : 'gray.300') : 'transparent'}
              _hover={{ bg: activeTab === 'incoming' ? (isDark ? 'gray.500' : 'gray.400') : (isDark ? 'gray.600' : 'gray.200') }}
              onClick={() => setActiveTab('incoming')}
              flex={1}
            >
              Incoming ({incomingRequests.length})
            </Button>
            <Button
              size="sm"
              variant={activeTab === 'outgoing' ? 'solid' : 'ghost'}
              colorScheme="gray"
              bg={activeTab === 'outgoing' ? (isDark ? 'gray.600' : 'gray.300') : 'transparent'}
              _hover={{ bg: activeTab === 'outgoing' ? (isDark ? 'gray.500' : 'gray.400') : (isDark ? 'gray.600' : 'gray.200') }}
              onClick={() => setActiveTab('outgoing')}
              flex={1}
            >
              Outgoing ({outgoingRequests.length})
            </Button>
            <Button
              size="sm"
              variant={activeTab === 'completed' ? 'solid' : 'ghost'}
              colorScheme="gray"
              bg={activeTab === 'completed' ? (isDark ? 'gray.600' : 'gray.300') : 'transparent'}
              _hover={{ bg: activeTab === 'completed' ? (isDark ? 'gray.500' : 'gray.400') : (isDark ? 'gray.600' : 'gray.200') }}
              onClick={() => setActiveTab('completed')}
              flex={1}
            >
              Completed ({completedSwaps.length})
            </Button>
          </HStack>
        </Box>

        {/* Content */}
        <Box w="100%" maxW="none" px={2} pb={6} flex={1}>
          <VStack spacing={4} align="stretch">
            {getCurrentRequests().length > 0 ? (
              getCurrentRequests().map(request => (
                <SwapRequestCard
                  key={request.id}
                  request={request}
                  showActions={activeTab === 'incoming'}
                />
              ))
            ) : (
              <Box textAlign="center" py={8}>
                <Text color="gray.500">
                  {activeTab === 'incoming' && 'No incoming requests at the moment.'}
                  {activeTab === 'outgoing' && "You haven't made any swap requests yet."}
                  {activeTab === 'completed' && 'No completed swaps yet.'}
                </Text>
              </Box>
            )}
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default SwapRequests;

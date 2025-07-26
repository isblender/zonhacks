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
      bg="white"
      p={4}
      borderRadius="lg"
      boxShadow="md"
      border="1px solid"
      borderColor="gray.200"
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

        <HStack spacing={4} align="center">
          {/* Requested Item */}
          <VStack spacing={2} flex={1}>
            <Text fontSize="sm" fontWeight="medium" color="gray.600">
              Requested
            </Text>
            <Image
              src={request.itemRequested.imageUrl}
              alt={request.itemRequested.title}
              w="80px"
              h="80px"
              objectFit="cover"
              borderRadius="md"
            />
            <VStack spacing={1}>
              <Text fontSize="sm" fontWeight="bold" textAlign="center">
                {request.itemRequested.title}
              </Text>
              <Text fontSize="xs" color="gray.500">
                by {request.itemRequested.owner}
              </Text>
            </VStack>
          </VStack>

          {/* Arrow */}
          <Box color="gray.400" fontSize="xl">
            ↔️
          </Box>

          {/* Offered Item */}
          <VStack spacing={2} flex={1}>
            <Text fontSize="sm" fontWeight="medium" color="gray.600">
              Offered
            </Text>
            <Image
              src={request.itemOffered.imageUrl}
              alt={request.itemOffered.title}
              w="80px"
              h="80px"
              objectFit="cover"
              borderRadius="md"
            />
            <VStack spacing={1}>
              <Text fontSize="sm" fontWeight="bold" textAlign="center">
                {request.itemOffered.title}
              </Text>
              <Text fontSize="xs" color="gray.500">
                by {request.itemOffered.owner}
              </Text>
            </VStack>
          </VStack>
        </HStack>

        {request.message && (
          <Box bg="gray.50" p={3} borderRadius="md">
            <Text fontSize="sm" color="gray.700">
              "{request.message}"
            </Text>
          </Box>
        )}

        {showActions && request.status === 'pending' && (
          <HStack spacing={2}>
            <Button
              colorScheme="green"
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
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="lg" mb={2}>Swap Requests</Heading>
          <Text color="gray.600">Manage your incoming and outgoing swap requests</Text>
        </Box>

        {/* Custom Tab Navigation */}
        <HStack spacing={2} bg="gray.100" p={1} borderRadius="lg">
          <Button
            size="sm"
            variant={activeTab === 'incoming' ? 'solid' : 'ghost'}
            colorScheme="blue"
            onClick={() => setActiveTab('incoming')}
            flex={1}
          >
            Incoming ({incomingRequests.length})
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'outgoing' ? 'solid' : 'ghost'}
            colorScheme="blue"
            onClick={() => setActiveTab('outgoing')}
            flex={1}
          >
            Outgoing ({outgoingRequests.length})
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'completed' ? 'solid' : 'ghost'}
            colorScheme="blue"
            onClick={() => setActiveTab('completed')}
            flex={1}
          >
            Completed ({completedSwaps.length})
          </Button>
        </HStack>

        {/* Content */}
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
      </VStack>
    </Box>
  );
};

export default SwapRequests;

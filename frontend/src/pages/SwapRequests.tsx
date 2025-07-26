import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Heading,
  Badge,
  Image,
  Alert,
  AlertIcon,
  Spinner,
  Center,
  useToast,
} from '@chakra-ui/react';
import { useTheme } from '../contexts/ThemeContext';
import { SwapService, SwapRequest } from '../services/swapService';

const SwapRequests: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing' | 'completed'>('incoming');
  const [incomingRequests, setIncomingRequests] = useState<SwapRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<SwapRequest[]>([]);
  const [completedSwaps, setCompletedSwaps] = useState<SwapRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isDark } = useTheme();
  const toast = useToast();

  const currentUserId = '1'; // In real app, this would come from auth context

  useEffect(() => {
    loadSwapRequests();
  }, []);

  const loadSwapRequests = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load incoming requests
      const incomingResponse = await SwapService.getIncomingSwapRequests(currentUserId);
      const formattedIncoming = (incomingResponse.swaps || []).map((swap: any) =>
        SwapService.formatSwapRequestForDisplay(swap)
      );
      setIncomingRequests(formattedIncoming);

      // Load outgoing requests
      const outgoingResponse = await SwapService.getOutgoingSwapRequests(currentUserId);
      const formattedOutgoing = (outgoingResponse.swaps || []).map((swap: any) =>
        SwapService.formatSwapRequestForDisplay(swap)
      );
      setOutgoingRequests(formattedOutgoing);

      // Filter completed swaps from both incoming and outgoing
      const allSwaps = [...formattedIncoming, ...formattedOutgoing];
      const completed = allSwaps.filter(swap => swap.status === 'completed');
      setCompletedSwaps(completed);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load swap requests');
      console.error('Error loading swap requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptRequest = async (swapId: string) => {
    try {
      await SwapService.acceptSwapRequest(swapId, currentUserId);
      
      // Update the local state
      setIncomingRequests(prev => prev.map(req => 
        req.swapId === swapId ? { ...req, status: 'accepted' } : req
      ));

      toast({
        title: 'Swap request accepted!',
        description: 'The swap request has been accepted successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error accepting request',
        description: error instanceof Error ? error.message : 'Failed to accept request',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleRejectRequest = async (swapId: string) => {
    try {
      await SwapService.rejectSwapRequest(swapId, currentUserId);
      
      // Remove from incoming requests
      setIncomingRequests(prev => prev.filter(req => req.swapId !== swapId));

      toast({
        title: 'Swap request rejected',
        description: 'The swap request has been rejected.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error rejecting request',
        description: error instanceof Error ? error.message : 'Failed to reject request',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleCancelRequest = async (swapId: string) => {
    try {
      await SwapService.cancelSwapRequest(swapId, currentUserId);
      
      // Remove from outgoing requests
      setOutgoingRequests(prev => prev.filter(req => req.swapId !== swapId));

      toast({
        title: 'Swap request cancelled',
        description: 'Your swap request has been cancelled.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error cancelling request',
        description: error instanceof Error ? error.message : 'Failed to cancel request',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleCompleteSwap = async (swapId: string) => {
    try {
      await SwapService.completeSwapRequest(swapId, currentUserId);
      
      // Move to completed and update status
      const updatedSwap = [...incomingRequests, ...outgoingRequests]
        .find(req => req.swapId === swapId);
      
      if (updatedSwap) {
        const completedSwap = { ...updatedSwap, status: 'completed' as const };
        setCompletedSwaps(prev => [...prev, completedSwap]);
        
        // Remove from current lists
        setIncomingRequests(prev => prev.filter(req => req.swapId !== swapId));
        setOutgoingRequests(prev => prev.filter(req => req.swapId !== swapId));
      }

      toast({
        title: 'Swap completed!',
        description: 'The swap has been marked as completed.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error completing swap',
        description: error instanceof Error ? error.message : 'Failed to complete swap',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const getCurrentRequests = () => {
    switch (activeTab) {
      case 'incoming': return incomingRequests.filter(req => req.status === 'pending');
      case 'outgoing': return outgoingRequests.filter(req => ['pending', 'accepted'].includes(req.status));
      case 'completed': return completedSwaps;
      default: return [];
    }
  };

  const getImageUrl = (item: any) => {
    // Handle different possible image formats from backend
    if (item?.images && Array.isArray(item.images) && item.images.length > 0) {
      if (item.images[0].url) return item.images[0].url;
      if (item.images[0].imageUrl) return item.images[0].imageUrl;
      if (typeof item.images[0] === 'string') return item.images[0];
    }
    
    if (item?.imageUrl) return item.imageUrl;
    if (item?.image_url) return item.image_url;
    if (item?.image) return item.image;
    
    // Fallback placeholder
    return `https://via.placeholder.com/120x120/e2e8f0/718096?text=${encodeURIComponent(item?.title || 'No Image')}`;
  };

  const SwapRequestCard: React.FC<{ request: SwapRequest; type: 'incoming' | 'outgoing' | 'completed' }> = ({ 
    request, 
    type 
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
          <Badge colorScheme={SwapService.getStatusBadgeColor(request.status)}>
            {SwapService.getStatusDisplayText(request.status)}
          </Badge>
        </HStack>

        <HStack spacing={8} align="center" w="100%">
          {/* Target Item (what's being requested) */}
          <VStack spacing={3} flex={1} minW="0">
            <Text fontSize="md" fontWeight="medium" color="gray.600">
              {type === 'outgoing' ? 'Requesting' : 'Your Item'}
            </Text>
            <Image
              src={getImageUrl(request.targetListing)}
              alt={request.targetListing?.title || 'Item'}
              w="120px"
              h="120px"
              objectFit="cover"
              borderRadius="lg"
              fallbackSrc={`https://via.placeholder.com/120x120/e2e8f0/718096?text=${encodeURIComponent(request.targetListing?.title || 'No Image')}`}
            />
            <VStack spacing={1}>
              <Text fontSize="lg" fontWeight="bold" textAlign="center" color={isDark ? 'white' : 'gray.800'}>
                {request.targetListing?.title || 'Unknown Item'}
              </Text>
              <Text fontSize="sm" color="gray.500">
                Size: {request.targetListing?.size || 'N/A'}
              </Text>
              <Text fontSize="sm" color="gray.500">
                Condition: {request.targetListing?.condition || 'N/A'}
              </Text>
            </VStack>
          </VStack>

          {/* Arrow */}
          <Box color="gray.400" fontSize="3xl" px={4}>
            ↔️
          </Box>

          {/* Requester Item (what's being offered) */}
          <VStack spacing={3} flex={1} minW="0">
            <Text fontSize="md" fontWeight="medium" color="gray.600">
              {type === 'outgoing' ? 'Offering' : 'Requesting'}
            </Text>
            <Image
              src={getImageUrl(request.requesterListing)}
              alt={request.requesterListing?.title || 'Item'}
              w="120px"
              h="120px"
              objectFit="cover"
              borderRadius="lg"
              fallbackSrc={`https://via.placeholder.com/120x120/e2e8f0/718096?text=${encodeURIComponent(request.requesterListing?.title || 'No Image')}`}
            />
            <VStack spacing={1}>
              <Text fontSize="lg" fontWeight="bold" textAlign="center" color={isDark ? 'white' : 'gray.800'}>
                {request.requesterListing?.title || 'Unknown Item'}
              </Text>
              <Text fontSize="sm" color="gray.500">
                Size: {request.requesterListing?.size || 'N/A'}
              </Text>
              <Text fontSize="sm" color="gray.500">
                Condition: {request.requesterListing?.condition || 'N/A'}
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

        {/* Action Buttons */}
        {type === 'incoming' && request.status === 'pending' && (
          <HStack spacing={2}>
            <Button
              colorScheme="green"
              size="sm"
              flex={1}
              onClick={() => handleAcceptRequest(request.swapId)}
            >
              Accept
            </Button>
            <Button
              colorScheme="red"
              variant="outline"
              size="sm"
              flex={1}
              onClick={() => handleRejectRequest(request.swapId)}
            >
              Reject
            </Button>
          </HStack>
        )}

        {type === 'outgoing' && ['pending', 'accepted'].includes(request.status) && (
          <HStack spacing={2}>
            {request.status === 'accepted' && (
              <Button
                colorScheme="blue"
                size="sm"
                flex={1}
                onClick={() => handleCompleteSwap(request.swapId)}
              >
                Mark as Completed
              </Button>
            )}
            <Button
              colorScheme="gray"
              variant="outline"
              size="sm"
              flex={request.status === 'accepted' ? 1 : 2}
              onClick={() => handleCancelRequest(request.swapId)}
            >
              Cancel Request
            </Button>
          </HStack>
        )}

        {(type === 'incoming' || type === 'outgoing') && request.status === 'accepted' && (
          <Alert status="success" borderRadius="md">
            <AlertIcon />
            <Text fontSize="sm">
              Swap accepted! Coordinate with the other user to complete the exchange.
            </Text>
          </Alert>
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

        {/* Error Alert */}
        {error && (
          <Box px={2}>
            <Alert status="error">
              <AlertIcon />
              {error}
            </Alert>
          </Box>
        )}

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
              Incoming ({incomingRequests.filter(req => req.status === 'pending').length})
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
              Outgoing ({outgoingRequests.filter(req => ['pending', 'accepted'].includes(req.status)).length})
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

        {/* Loading State */}
        {isLoading && (
          <Center py={8}>
            <VStack spacing={4}>
              <Spinner size="lg" color="blue.500" />
              <Text color="gray.500">Loading swap requests...</Text>
            </VStack>
          </Center>
        )}

        {/* Content */}
        {!isLoading && (
          <Box w="100%" maxW="none" px={2} pb={6} flex={1}>
            <VStack spacing={4} align="stretch">
              {getCurrentRequests().length > 0 ? (
                getCurrentRequests().map(request => (
                  <SwapRequestCard
                    key={request.swapId}
                    request={request}
                    type={activeTab}
                  />
                ))
              ) : (
                <Box textAlign="center" py={8}>
                  <Text color="gray.500">
                    {activeTab === 'incoming' && 'No incoming requests at the moment.'}
                    {activeTab === 'outgoing' && "You haven't made any swap requests yet."}
                    {activeTab === 'completed' && 'No completed swaps yet.'}
                  </Text>
                  {!error && (
                    <Button
                      mt={4}
                      colorScheme="blue"
                      variant="outline"
                      size="sm"
                      onClick={loadSwapRequests}
                    >
                      Refresh
                    </Button>
                  )}
                </Box>
              )}
            </VStack>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default SwapRequests;

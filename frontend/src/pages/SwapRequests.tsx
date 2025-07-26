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
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { useTheme } from '../contexts/ThemeContext';
import MessagePanel from '../components/messaging/MessagePanel';
import messageService, { MessageReference } from '../services/messageService';
import UnreadBadge from '../components/messaging/UnreadBadge';
import { InfoIcon, ChatIcon } from '@chakra-ui/icons';

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
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  createdAt: string;
  message?: string;
  messages?: MessageReference;
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
  
  // State for unread message counts per swap
  const [unreadMessageCounts, setUnreadMessageCounts] = useState<{ [key: string]: number }>({});
  const [selectedSwapId, setSelectedSwapId] = useState<string | null>(null);
  
  // Current user - would normally be fetched from auth context
  const currentUserId = 'user123';

  useEffect(() => {
    // Fetch unread message counts
    const fetchUnreadCounts = async () => {
      try {
        const counts = await messageService.getUnreadMessageCount(currentUserId);
        
        // Make sure counts is properly structured before using it
        if (counts && counts.swaps && Array.isArray(counts.swaps)) {
          // Convert to map for easier access
          const countMap: { [key: string]: number } = {};
          counts.swaps.forEach(swap => {
            if (swap && swap.swap_id) {
              countMap[swap.swap_id] = swap.count || 0;
            }
          });
          
          setUnreadMessageCounts(countMap);
        } else {
          console.warn('Invalid unread counts format:', counts);
          // Don't update the state, keep the previous counts
        }
      } catch (error) {
        console.error('Error fetching unread message counts:', error);
        // We could provide a visual indication here that message counts might be outdated
        // but for now, we'll just keep the previous state
      }
    };
    
    fetchUnreadCounts();
    
    // Refresh counts every minute
    const intervalId = setInterval(fetchUnreadCounts, 60000);
    return () => clearInterval(intervalId);
  }, [currentUserId]);

  const handleAcceptRequest = (requestId: string) => {
    setRequests(prev => prev.map(req => 
      req.id === requestId ? { ...req, status: 'accepted' as const } : req
    ));
  };

  const handleDeclineRequest = (requestId: string) => {
    setRequests(prev => prev.map(req =>
      req.id === requestId ? { ...req, status: 'rejected' as const } : req
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

  const getMessagePromptForStatus = (status: string): string => {
    switch (status) {
      case 'pending':
        return "Discuss the details of your potential swap...";
      case 'accepted':
        return "Great! Your swap was accepted. Coordinate the exchange details here...";
      case 'rejected':
        return "This swap was declined. You can still message to discuss alternatives.";
      case 'completed':
        return "Swap completed! Feel free to leave feedback about your experience.";
      case 'cancelled':
        return "This swap was cancelled.";
      default:
        return "Send a message...";
    }
  };

  const SwapRequestCard: React.FC<{ request: SwapRequest; showActions?: boolean }> = ({
    request,
    showActions = false
  }) => {
    const [activeTab, setActiveTab] = useState<'details' | 'messages'>('details');
    
    // Get unread message count from the request or fallback to unreadMessageCounts
    const unreadCount = request.messages?.unread_count || unreadMessageCounts[request.id] || 0;
    
    // Has latest message?
    const hasLatestMessage = request.messages?.latest_message !== undefined;
    
    // Should highlight based on status and unread messages
    const highlightCard = unreadCount > 0 ||
      (request.status === 'accepted' && activeTab === 'details');
    
    return (
      <Box
        bg={isDark ? 'gray.800' : 'white'}
        p={6}
        borderRadius="lg"
        boxShadow={highlightCard ? "lg" : "md"}
        border="1px solid"
        borderColor={
          highlightCard
            ? (request.status === 'accepted' ? 'green.300' : 'blue.300')
            : (isDark ? 'gray.600' : 'gray.200')
        }
        w="100%"
        maxW="none"
        transition="all 0.2s"
        _hover={{
          transform: "translateY(-2px)",
          boxShadow: "lg"
        }}
      >
        <Tabs
          isFitted
          variant="enclosed"
          onChange={(index) => setActiveTab(index === 0 ? 'details' : 'messages')}
          colorScheme={unreadCount > 0 ? "blue" : "gray"}
        >
          <TabList mb={4}>
            <Tab>
              <HStack>
                <InfoIcon mr={1} />
                <Text>Details</Text>
              </HStack>
            </Tab>
            <Tab position="relative">
              <HStack>
                <ChatIcon mr={1} />
                <Text>Messages</Text>
                {unreadCount > 0 && (
                  <Box position="absolute" top="-2px" right="-2px">
                    <UnreadBadge count={unreadCount} size="sm" />
                  </Box>
                )}
              </HStack>
            </Tab>
          </TabList>
          
          <TabPanels>
            {/* Details Tab */}
            <TabPanel p={0}>
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

                {/* Initial message or latest message preview */}
                {(request.message || hasLatestMessage) && (
                  <Box bg={isDark ? 'gray.700' : 'gray.50'} p={4} borderRadius="lg" w="100%" position="relative">
                    {hasLatestMessage && request.messages?.latest_message?.message_type === 'system' && (
                      <InfoIcon position="absolute" top={2} left={2} color="orange.400" />
                    )}
                    <Text fontSize="md" color={isDark ? 'gray.300' : 'gray.700'} pl={hasLatestMessage && request.messages?.latest_message?.message_type === 'system' ? 6 : 0}>
                      {hasLatestMessage
                        ? `"${request.messages?.latest_message?.content}"`
                        : `"${request.message}"`
                      }
                    </Text>
                    {hasLatestMessage && (
                      <Text fontSize="xs" color="gray.500" mt={1} textAlign="right">
                        {new Date(request.messages?.latest_message?.timestamp || '').toLocaleString()}
                      </Text>
                    )}
                  </Box>
                )}

                {/* Action buttons */}
                <VStack spacing={2} w="100%">
                  {showActions && request.status === 'pending' && (
                    <HStack spacing={2} w="100%">
                      <Button
                        colorScheme="green"
                        size="sm"
                        flex={1}
                        leftIcon={<InfoIcon />}
                        onClick={() => handleAcceptRequest(request.id)}
                      >
                        Accept Swap
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
                  
                  {/* Message button that switches to message tab */}
                  {activeTab === 'details' && (
                    <Button
                      size="sm"
                      width="100%"
                      colorScheme={unreadCount > 0 ? "blue" : "gray"}
                      variant={unreadCount > 0 ? "solid" : "outline"}
                      leftIcon={<ChatIcon />}
                      onClick={() => setActiveTab('messages')}
                    >
                      {unreadCount > 0 ? `View Messages (${unreadCount} unread)` : "View Messages"}
                    </Button>
                  )}
                </VStack>
              </VStack>
            </TabPanel>
            
            {/* Messages Tab */}
            <TabPanel p={0}>
              <Box height="450px" display="flex" flexDirection="column">
                {/* Status banner */}
                <Box
                  bg={getStatusColor(request.status) + ".100"}
                  color={getStatusColor(request.status) + ".800"}
                  p={2}
                  mb={2}
                  borderRadius="md"
                  fontWeight="medium"
                  fontSize="sm"
                  textAlign="center"
                >
                  Status: {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  {request.status === 'accepted' && (
                    <Button size="xs" colorScheme="green" ml={2} onClick={() => handleAcceptRequest(request.id)}>
                      Mark Completed
                    </Button>
                  )}
                </Box>
                
                <Box display="flex" flexDirection="column" height="100%">
                  {/* Message Panel */}
                  <MessagePanel
                    swapId={request.id}
                    userId={currentUserId}
                    recipientName={request.itemRequested.owner !== 'John Doe' ?
                      request.itemRequested.owner : request.itemOffered.owner}
                  />
                  
                  {/* Message prompt text */}
                  <Text
                    fontSize="xs"
                    textAlign="center"
                    color="gray.500"
                    mt={2}
                  >
                    {getMessagePromptForStatus(request.status)}
                  </Text>
                </Box>
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    );
  };

  return (
    <Box 
      w="100%"
      h="100vh"
      p={6}
      overflow="auto"
      bg={isDark ? 'gray.900' : 'gray.50'}
      position="relative"
    >
      <VStack spacing={6} align="stretch" w="100%" minH="100%">
        <Box>
          <Heading size="lg" mb={2} color={isDark ? 'white' : 'gray.800'}>Swap Requests</Heading>
          <Text color="gray.600">Manage your incoming and outgoing swap requests</Text>
        </Box>

        {/* Custom Tab Navigation */}
        <Box>
          <HStack spacing={2} bg={isDark ? 'gray.700' : 'gray.100'} p={1} borderRadius="lg">
            <Button
              size="sm"
              variant={activeTab === 'incoming' ? 'solid' : 'ghost'}
              colorScheme="gray"
              bg={activeTab === 'incoming' ? (isDark ? 'gray.600' : 'gray.300') : 'transparent'}
              _hover={{ bg: activeTab === 'incoming' ? (isDark ? 'gray.500' : 'gray.400') : (isDark ? 'gray.600' : 'gray.200') }}
              onClick={() => setActiveTab('incoming')}
              flex={1}
              position="relative"
            >
              Incoming ({incomingRequests.length})
              {activeTab !== 'incoming' && Object.keys(unreadMessageCounts).some(id => 
                incomingRequests.some(req => req.id === id && unreadMessageCounts[id] > 0)
              ) && (
                <Box position="absolute" top="0" right="0" transform="translate(30%, -30%)">
                  <UnreadBadge 
                    count={Object.keys(unreadMessageCounts)
                      .filter(id => incomingRequests.some(req => req.id === id))
                      .reduce((sum, id) => sum + unreadMessageCounts[id], 0)} 
                    size="sm" 
                  />
                </Box>
              )}
            </Button>
            <Button
              size="sm"
              variant={activeTab === 'outgoing' ? 'solid' : 'ghost'}
              colorScheme="gray"
              bg={activeTab === 'outgoing' ? (isDark ? 'gray.600' : 'gray.300') : 'transparent'}
              _hover={{ bg: activeTab === 'outgoing' ? (isDark ? 'gray.500' : 'gray.400') : (isDark ? 'gray.600' : 'gray.200') }}
              onClick={() => setActiveTab('outgoing')}
              flex={1}
              position="relative"
            >
              Outgoing ({outgoingRequests.length})
              {activeTab !== 'outgoing' && Object.keys(unreadMessageCounts).some(id => 
                outgoingRequests.some(req => req.id === id && unreadMessageCounts[id] > 0)
              ) && (
                <Box position="absolute" top="0" right="0" transform="translate(30%, -30%)">
                  <UnreadBadge 
                    count={Object.keys(unreadMessageCounts)
                      .filter(id => outgoingRequests.some(req => req.id === id))
                      .reduce((sum, id) => sum + unreadMessageCounts[id], 0)} 
                    size="sm" 
                  />
                </Box>
              )}
            </Button>
            <Button
              size="sm"
              variant={activeTab === 'completed' ? 'solid' : 'ghost'}
              colorScheme="gray"
              bg={activeTab === 'completed' ? (isDark ? 'gray.600' : 'gray.300') : 'transparent'}
              _hover={{ bg: activeTab === 'completed' ? (isDark ? 'gray.500' : 'gray.400') : (isDark ? 'gray.600' : 'gray.200') }}
              onClick={() => setActiveTab('completed')}
              flex={1}
              position="relative"
            >
              Completed ({completedSwaps.length})
              {activeTab !== 'completed' && Object.keys(unreadMessageCounts).some(id => 
                completedSwaps.some(req => req.id === id && unreadMessageCounts[id] > 0)
              ) && (
                <Box position="absolute" top="0" right="0" transform="translate(30%, -30%)">
                  <UnreadBadge 
                    count={Object.keys(unreadMessageCounts)
                      .filter(id => completedSwaps.some(req => req.id === id))
                      .reduce((sum, id) => sum + unreadMessageCounts[id], 0)} 
                    size="sm" 
                  />
                </Box>
              )}
            </Button>
          </HStack>
        </Box>

        {/* Content */}
        <Box w="100%" maxW="none" flex={1}>
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

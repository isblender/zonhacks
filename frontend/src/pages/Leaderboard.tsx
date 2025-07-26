import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Badge,
  SimpleGrid,
} from '@chakra-ui/react';

interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string;
  swapCount: number;
  joinedDate: string;
  recentSwaps: string[];
}

const Leaderboard: React.FC = () => {
  // Mock data - in real app this would come from API
  const users: LeaderboardUser[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      avatar: 'SJ',
      swapCount: 47,
      joinedDate: '2023-06-15',
      recentSwaps: ['Vintage Denim Jacket', 'Summer Dress', 'Leather Boots']
    },
    {
      id: '2',
      name: 'Emma Wilson',
      avatar: 'EW',
      swapCount: 42,
      joinedDate: '2023-07-20',
      recentSwaps: ['Floral Dress', 'Winter Coat', 'Sneakers']
    },
    {
      id: '3',
      name: 'Mike Chen',
      avatar: 'MC',
      swapCount: 38,
      joinedDate: '2023-05-10',
      recentSwaps: ['Black Boots', 'Casual Shirt', 'Jeans']
    },
    {
      id: '4',
      name: 'Lisa Park',
      avatar: 'LP',
      swapCount: 35,
      joinedDate: '2023-08-05',
      recentSwaps: ['Knit Sweater', 'Scarf', 'Handbag']
    },
    {
      id: '5',
      name: 'Anna Davis',
      avatar: 'AD',
      swapCount: 31,
      joinedDate: '2023-04-12',
      recentSwaps: ['Designer Handbag', 'Silk Blouse', 'Heels']
    },
    {
      id: '6',
      name: 'Tom Rodriguez',
      avatar: 'TR',
      swapCount: 28,
      joinedDate: '2023-09-18',
      recentSwaps: ['T-Shirt', 'Shorts', 'Cap']
    },
    {
      id: '7',
      name: 'John Doe',
      avatar: 'JD',
      swapCount: 12,
      joinedDate: '2024-01-01',
      recentSwaps: ['Leather Boots', 'Blue Jeans']
    },
    {
      id: '8',
      name: 'Rachel Green',
      avatar: 'RG',
      swapCount: 25,
      joinedDate: '2023-10-22',
      recentSwaps: ['Evening Dress', 'Cardigan', 'Necklace']
    },
    {
      id: '9',
      name: 'David Kim',
      avatar: 'DK',
      swapCount: 19,
      joinedDate: '2023-11-30',
      recentSwaps: ['Hoodie', 'Backpack', 'Watch']
    },
    {
      id: '10',
      name: 'Sophie Brown',
      avatar: 'SB',
      swapCount: 16,
      joinedDate: '2023-12-08',
      recentSwaps: ['Winter Jacket', 'Boots', 'Gloves']
    }
  ];

  // Sort users by swap count
  const sortedUsers = [...users].sort((a, b) => b.swapCount - a.swapCount);

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'yellow.400'; // Gold
      case 2: return 'gray.400';   // Silver
      case 3: return 'orange.400'; // Bronze
      default: return 'blue.500';
    }
  };

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const LeaderboardCard: React.FC<{ user: LeaderboardUser; rank: number }> = ({ 
    user, 
    rank 
  }) => (
    <Box
      bg="white"
      p={4}
      borderRadius="lg"
      boxShadow="md"
      border="1px solid"
      borderColor="gray.200"
      position="relative"
      _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
      transition="all 0.2s"
    >
      {/* Rank Badge */}
      <Box
        position="absolute"
        top={-2}
        left={-2}
        bg={getRankColor(rank)}
        color="white"
        borderRadius="full"
        w="32px"
        h="32px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        fontWeight="bold"
        fontSize="sm"
        boxShadow="md"
      >
        {rank <= 3 ? getRankEmoji(rank) : rank}
      </Box>

      <VStack spacing={3} align="stretch">
        <HStack spacing={3} align="center">
          {/* Avatar */}
          <Box
            w="48px"
            h="48px"
            bg="blue.500"
            borderRadius="full"
            display="flex"
            alignItems="center"
            justifyContent="center"
            color="white"
            fontWeight="bold"
            fontSize="lg"
          >
            {user.avatar}
          </Box>

          {/* User Info */}
          <VStack align="start" spacing={1} flex={1}>
            <Text fontWeight="bold" fontSize="lg">
              {user.name}
            </Text>
            <Text fontSize="sm" color="gray.500">
              Joined {new Date(user.joinedDate).toLocaleDateString()}
            </Text>
          </VStack>

          {/* Swap Count */}
          <VStack align="center" spacing={1}>
            <Text fontSize="2xl" fontWeight="bold" color="blue.500">
              {user.swapCount}
            </Text>
            <Text fontSize="xs" color="gray.500" textAlign="center">
              swaps
            </Text>
          </VStack>
        </HStack>

        {/* Recent Swaps */}
        {user.recentSwaps.length > 0 && (
          <Box>
            <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={2}>
              Recent Swaps:
            </Text>
            <HStack spacing={1} wrap="wrap">
              {user.recentSwaps.slice(0, 3).map((item, index) => (
                <Badge key={index} colorScheme="blue" fontSize="xs">
                  {item}
                </Badge>
              ))}
              {user.recentSwaps.length > 3 && (
                <Badge colorScheme="gray" fontSize="xs">
                  +{user.recentSwaps.length - 3} more
                </Badge>
              )}
            </HStack>
          </Box>
        )}
      </VStack>
    </Box>
  );

  // Stats calculations
  const totalSwaps = users.reduce((sum, user) => sum + user.swapCount, 0);
  const averageSwaps = Math.round(totalSwaps / users.length);
  const topSwapper = sortedUsers[0];

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg" mb={2}>Leaderboard</Heading>
          <Text color="gray.600">See who's leading the clothing swap community!</Text>
        </Box>

        {/* Stats Overview */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          <Box
            bg="white"
            p={4}
            borderRadius="lg"
            boxShadow="md"
            textAlign="center"
          >
            <Text fontSize="2xl" fontWeight="bold" color="blue.500">
              {totalSwaps}
            </Text>
            <Text fontSize="sm" color="gray.600">
              Total Swaps
            </Text>
          </Box>
          <Box
            bg="white"
            p={4}
            borderRadius="lg"
            boxShadow="md"
            textAlign="center"
          >
            <Text fontSize="2xl" fontWeight="bold" color="green.500">
              {averageSwaps}
            </Text>
            <Text fontSize="sm" color="gray.600">
              Average Swaps
            </Text>
          </Box>
          <Box
            bg="white"
            p={4}
            borderRadius="lg"
            boxShadow="md"
            textAlign="center"
          >
            <Text fontSize="2xl" fontWeight="bold" color="purple.500">
              {users.length}
            </Text>
            <Text fontSize="sm" color="gray.600">
              Active Users
            </Text>
          </Box>
        </SimpleGrid>

        {/* Top 3 Highlight */}
        <Box>
          <Heading size="md" mb={4}>🏆 Top Swappers</Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            {sortedUsers.slice(0, 3).map((user, index) => (
              <LeaderboardCard
                key={user.id}
                user={user}
                rank={index + 1}
              />
            ))}
          </SimpleGrid>
        </Box>

        {/* Full Leaderboard */}
        <Box>
          <Heading size="md" mb={4}>Full Rankings</Heading>
          <VStack spacing={3} align="stretch">
            {sortedUsers.map((user, index) => (
              <LeaderboardCard
                key={user.id}
                user={user}
                rank={index + 1}
              />
            ))}
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default Leaderboard;

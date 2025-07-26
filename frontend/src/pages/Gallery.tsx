import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  Heading,
  SimpleGrid,
  Image,
  Badge,
} from '@chakra-ui/react';
import { useTheme } from '../contexts/ThemeContext';

interface ClothingItem {
  id: string;
  title: string;
  description: string;
  size: string;
  condition: string;
  category: string;
  imageUrl: string;
  owner: string;
  ownerAvatar: string;
}

const Gallery: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { isDark } = useTheme();

  // Mock data - in real app this would come from API
  const clothingItems: ClothingItem[] = [
    {
      id: '1',
      title: 'Vintage Denim Jacket',
      description: 'Classic blue denim jacket in excellent condition. Perfect for casual outings.',
      size: 'M',
      condition: 'Excellent',
      category: 'Jackets',
      imageUrl: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=300&h=300&fit=crop',
      owner: 'Sarah Johnson',
      ownerAvatar: 'SJ'
    },
    {
      id: '2',
      title: 'Summer Floral Dress',
      description: 'Beautiful floral print dress, perfect for summer occasions.',
      size: 'S',
      condition: 'Good',
      category: 'Dresses',
      imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=300&h=300&fit=crop',
      owner: 'Emma Wilson',
      ownerAvatar: 'EW'
    },
    {
      id: '3',
      title: 'Black Leather Boots',
      description: 'Stylish black leather boots, barely worn. Great for fall and winter.',
      size: '8',
      condition: 'Like New',
      category: 'Shoes',
      imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=300&fit=crop',
      owner: 'Mike Chen',
      ownerAvatar: 'MC'
    },
    {
      id: '4',
      title: 'Cozy Knit Sweater',
      description: 'Warm and comfortable knit sweater in cream color.',
      size: 'L',
      condition: 'Good',
      category: 'Sweaters',
      imageUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=300&h=300&fit=crop',
      owner: 'Lisa Park',
      ownerAvatar: 'LP'
    },
    {
      id: '5',
      title: 'Designer Handbag',
      description: 'Elegant designer handbag with minimal wear. Comes with authenticity card.',
      size: 'One Size',
      condition: 'Excellent',
      category: 'Accessories',
      imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=300&fit=crop',
      owner: 'Anna Davis',
      ownerAvatar: 'AD'
    },
    {
      id: '6',
      title: 'Casual T-Shirt',
      description: 'Comfortable cotton t-shirt in navy blue. Great for everyday wear.',
      size: 'M',
      condition: 'Good',
      category: 'T-Shirts',
      imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop',
      owner: 'Tom Rodriguez',
      ownerAvatar: 'TR'
    }
  ];

  const categories = ['All', 'Jackets', 'Dresses', 'Shoes', 'Sweaters', 'Accessories', 'T-Shirts'];

  const filteredItems = clothingItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSwapRequest = (item: ClothingItem) => {
    // In real app, this would create a swap request
    alert(`Swap request sent for ${item.title}!`);
  };

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg" mb={2} color={isDark ? 'white' : 'gray.800'}>Clothing Gallery</Heading>
          <Text color="gray.600">Discover and swap amazing clothing items with other users</Text>
        </Box>

        {/* Search and Filter */}
        <HStack spacing={4} wrap="wrap">
          <Input
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            maxW="300px"
            bg={isDark ? 'gray.700' : 'white'}
            borderColor={isDark ? 'gray.600' : 'gray.200'}
            color={isDark ? 'white' : 'gray.800'}
            _placeholder={{ color: isDark ? 'gray.400' : 'gray.500' }}
          />
          <HStack spacing={2} wrap="wrap">
            {categories.map(category => (
              <Button
                key={category}
                size="sm"
                variant={selectedCategory === category ? 'solid' : 'outline'}
                colorScheme="gray"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </HStack>
        </HStack>

        {/* Items Grid */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6}>
          {filteredItems.map(item => (
            <Box
              key={item.id}
              bg={isDark ? 'gray.800' : 'white'}
              borderRadius="lg"
              boxShadow="md"
              overflow="hidden"
              transition="transform 0.2s"
              _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
              border={isDark ? '1px solid' : 'none'}
              borderColor={isDark ? 'gray.600' : 'transparent'}
            >
              <Image
                src={item.imageUrl}
                alt={item.title}
                h="200px"
                w="full"
                objectFit="cover"
              />
              <Box p={4}>
                <VStack align="start" spacing={2}>
                  <HStack justify="space-between" w="full">
                    <Text fontWeight="bold" fontSize="lg" color={isDark ? 'white' : 'gray.800'}>{item.title}</Text>
                    <Badge colorScheme="gray">{item.size}</Badge>
                  </HStack>
                  <Text color="gray.600" fontSize="sm" lineHeight="1.4">
                    {item.description}
                  </Text>
                  <HStack justify="space-between" w="full">
                    <Badge colorScheme="gray">{item.condition}</Badge>
                    <HStack spacing={1}>
                      <Box
                        w="24px"
                        h="24px"
                        bg="gray.500"
                        borderRadius="full"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        color="white"
                        fontSize="xs"
                        fontWeight="bold"
                      >
                        {item.ownerAvatar}
                      </Box>
                      <Text fontSize="xs" color="gray.500">{item.owner}</Text>
                    </HStack>
                  </HStack>
                  <Button
                    colorScheme="gray"
                    size="sm"
                    w="full"
                    onClick={() => handleSwapRequest(item)}
                  >
                    Request Swap
                  </Button>
                </VStack>
              </Box>
            </Box>
          ))}
        </SimpleGrid>

        {filteredItems.length === 0 && (
          <Box textAlign="center" py={8}>
            <Text color="gray.500">No items found matching your criteria.</Text>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default Gallery;

import React, { useState, useEffect } from 'react';
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
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Alert,
  AlertIcon,
  Spinner,
  Center,
} from '@chakra-ui/react';
import { useTheme } from '../contexts/ThemeContext';
import LocationSearch from '../components/LocationSearch';
import { LocationService, LocationData } from '../services/locationService';
import { ListingsService, Listing } from '../services/listingsService';
import { SwapService } from '../services/swapService';

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
  const [selectedSize, setSelectedSize] = useState('All');
  const [selectedCondition, setSelectedCondition] = useState('All');
  const [locationSearchResults, setLocationSearchResults] = useState<any[]>([]);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [searchRadius, setSearchRadius] = useState(25);
  const [isLocationSearching, setIsLocationSearching] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(false);
  const [listingsError, setListingsError] = useState<string | null>(null);
  const [requestedListingIds, setRequestedListingIds] = useState<string[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [useLocationFilter, setUseLocationFilter] = useState(false);
  const { isDark } = useTheme();

  const currentUserId = '1'; // In real app, this would come from auth context

  // Load all listings and requested listing IDs on component mount
  useEffect(() => {
    loadAllListings();
    loadRequestedListingIds();
  }, []);

  const loadRequestedListingIds = async () => {
    setIsLoadingRequests(true);
    try {
      const requestedIds = await SwapService.getRequestedListingIds(currentUserId);
      setRequestedListingIds(requestedIds);
    } catch (error) {
      console.error('Error loading requested listing IDs:', error);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const loadAllListings = async () => {
    setIsLoadingListings(true);
    setListingsError(null);

    try {
      const response = await ListingsService.getListings();
      const formattedListings = response.listings.map((listing: any) => 
        ListingsService.formatListingForDisplay(listing)
      );
      setAllListings(formattedListings);
    } catch (error) {
      setListingsError(error instanceof Error ? error.message : 'Failed to load listings');
      console.error('Error loading listings:', error);
    } finally {
      setIsLoadingListings(false);
    }
  };

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

  const categories = ListingsService.getCategories();
  const sizes = ListingsService.getSizes();
  const conditions = ListingsService.getConditions();

  // Get the items to display based on location filter
  const itemsToFilter = useLocationFilter && locationSearchResults.length > 0 
    ? locationSearchResults 
    : allListings;

  // Filter listings data with all criteria
  const filteredItems = itemsToFilter.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSize = selectedSize === 'All' || item.size === selectedSize;
    const matchesCondition = selectedCondition === 'All' || item.condition === selectedCondition;
    const isNotOwnListing = item.userId !== currentUserId;
    const isNotRequested = !requestedListingIds.includes(item.listingId);
    
    return matchesSearch && matchesCategory && matchesSize && matchesCondition && isNotOwnListing && isNotRequested;
  });

  const handleSwapRequest = async (item: any) => {
    try {
      // For now, we'll need the user to select one of their own listings to offer
      // In a real app, this would open a modal to select which listing to offer
      const userListings = await ListingsService.getUserListings(currentUserId);
      
      if (!userListings.active_listings || userListings.active_listings.length === 0) {
        alert('You need to create a listing first before you can request swaps!');
        return;
      }

      // For demo purposes, use the first available listing
      const requesterListing = userListings.active_listings[0];

      const swapRequestData = {
        requesterId: currentUserId,
        ownerId: item.userId, // The owner of the target listing
        requesterListingId: requesterListing.listingId,
        ownerListingId: item.listingId, // Changed from targetListingId
        message: `I'd like to swap my ${requesterListing.title} for your ${item.title}!`
      };

      await SwapService.createSwapRequest(swapRequestData);
      
      // Update the requested listings list to hide this item
      setRequestedListingIds(prev => [...prev, item.listingId]);
      
      alert(`Swap request sent for ${item.title}! Check your swap requests page to see the status.`);
    } catch (error) {
      console.error('Error creating swap request:', error);
      alert(`Failed to send swap request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleLocationChange = (location: LocationData | null, radius: number) => {
    setCurrentLocation(location);
    setSearchRadius(radius);
    setLocationError(null);
  };

  const handleLocationSearch = async () => {
    if (!currentLocation) return;

    setIsLocationSearching(true);
    setLocationError(null);

    try {
      const results = await ListingsService.searchListingsByLocation({
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        radius: searchRadius,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
      });

      const formattedResults = results.listings.map((listing: any) => 
        ListingsService.formatListingForDisplay(listing)
      );

      setLocationSearchResults(formattedResults);
    } catch (error) {
      setLocationError(error instanceof Error ? error.message : 'Failed to search listings');
      setLocationSearchResults([]);
    } finally {
      setIsLocationSearching(false);
    }
  };

  const renderListingItem = (item: any, showDistance = false) => {
    // Get the image URL with multiple fallback options
    const getImageUrl = (item: any) => {
      // Try different possible image URL formats from backend
      if (item.images && Array.isArray(item.images) && item.images.length > 0) {
        // Backend format: array of image objects with url property
        if (item.images[0].url) return item.images[0].url;
        // Backend format: array of image objects with different property names
        if (item.images[0].imageUrl) return item.images[0].imageUrl;
        // Backend format: array of strings
        if (typeof item.images[0] === 'string') return item.images[0];
      }
      
      // Try single image URL property
      if (item.imageUrl) return item.imageUrl;
      if (item.image_url) return item.image_url;
      if (item.image) return item.image;
      
      // Mock data fallback
      if (item.imageUrl) return item.imageUrl;
      
      // Default placeholder
      return `https://via.placeholder.com/300x200/e2e8f0/718096?text=${encodeURIComponent(item.title || 'No Image')}`;
    };

    const imageUrl = getImageUrl(item);

    return (
      <Box
        key={item.listingId || item.id}
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
          src={imageUrl}
          alt={item.title || 'Clothing item'}
          h="200px"
          w="full"
          objectFit="cover"
          fallbackSrc={`https://via.placeholder.com/300x200/e2e8f0/718096?text=${encodeURIComponent(item.title || 'No Image')}`}
          onError={(e) => {
            console.log('Image failed to load:', imageUrl, 'for item:', item);
            // Set a fallback image
            e.currentTarget.src = `https://via.placeholder.com/300x200/e2e8f0/718096?text=${encodeURIComponent(item.title || 'No Image')}`;
          }}
        />
        <Box p={4}>
          <VStack align="start" spacing={2}>
            <HStack justify="space-between" w="full">
              <Text fontWeight="bold" fontSize="lg" color={isDark ? 'white' : 'gray.800'}>
                {item.title}
              </Text>
              <Badge colorScheme="gray">{item.size}</Badge>
            </HStack>
            <Text color="gray.600" fontSize="sm" lineHeight="1.4">
              {item.description}
            </Text>
            <HStack justify="space-between" w="full">
              <Badge colorScheme="gray">{item.condition}</Badge>
              {showDistance && item.distance_miles !== undefined && (
                <Badge colorScheme="blue" variant="subtle">
                  {LocationService.formatDistance(item.distance_miles)}
                </Badge>
              )}
            </HStack>
            {item.location?.city && item.location?.state && (
              <Text fontSize="xs" color="gray.500">
                📍 {item.location.city}, {item.location.state}
              </Text>
            )}
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
    );
  };

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg" mb={2} color={isDark ? 'white' : 'gray.800'}>Clothing Gallery</Heading>
          <Text color="gray.600">Discover and swap amazing clothing items with other users</Text>
        </Box>

        {/* Unified Search and Filter Interface */}
        <VStack spacing={6} align="stretch">
          {/* Search Bar */}
          <Input
            placeholder="Search items by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="lg"
            bg={isDark ? 'gray.700' : 'white'}
            borderColor={isDark ? 'gray.600' : 'gray.200'}
            color={isDark ? 'white' : 'gray.800'}
            _placeholder={{ color: isDark ? 'gray.400' : 'gray.500' }}
          />

          {/* Filter Section */}
          <Box
            bg={isDark ? 'gray.800' : 'white'}
            p={6}
            borderRadius="lg"
            boxShadow="md"
            border={isDark ? '1px solid' : 'none'}
            borderColor={isDark ? 'gray.600' : 'transparent'}
          >
            <VStack spacing={4} align="stretch">
              <Text fontSize="lg" fontWeight="semibold" color={isDark ? 'white' : 'gray.800'}>
                Filters
              </Text>

              {/* Category Filter */}
              <Box>
                <Text fontWeight="medium" mb={3} color={isDark ? 'white' : 'gray.700'}>
                  Category
                </Text>
                <HStack spacing={2} wrap="wrap">
                  {categories.map(category => (
                    <Button
                      key={category}
                      size="sm"
                      variant={selectedCategory === category ? 'solid' : 'outline'}
                      colorScheme="blue"
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </Button>
                  ))}
                </HStack>
              </Box>

              {/* Size Filter */}
              <Box>
                <Text fontWeight="medium" mb={3} color={isDark ? 'white' : 'gray.700'}>
                  Size
                </Text>
                <HStack spacing={2} wrap="wrap">
                  {['All', ...sizes].map(size => (
                    <Button
                      key={size}
                      size="sm"
                      variant={selectedSize === size ? 'solid' : 'outline'}
                      colorScheme="green"
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </Button>
                  ))}
                </HStack>
              </Box>

              {/* Condition Filter */}
              <Box>
                <Text fontWeight="medium" mb={3} color={isDark ? 'white' : 'gray.700'}>
                  Condition
                </Text>
                <HStack spacing={2} wrap="wrap">
                  {['All', ...conditions].map(condition => (
                    <Button
                      key={condition}
                      size="sm"
                      variant={selectedCondition === condition ? 'solid' : 'outline'}
                      colorScheme="purple"
                      onClick={() => setSelectedCondition(condition)}
                    >
                      {condition}
                    </Button>
                  ))}
                </HStack>
              </Box>

              {/* Location Filter */}
              <Box>
                <HStack justify="space-between" align="center" mb={3}>
                  <Text fontWeight="medium" color={isDark ? 'white' : 'gray.700'}>
                    Location Filter
                  </Text>
                  <Button
                    size="sm"
                    variant={useLocationFilter ? 'solid' : 'outline'}
                    colorScheme="orange"
                    onClick={() => {
                      setUseLocationFilter(!useLocationFilter);
                      if (!useLocationFilter) {
                        setLocationSearchResults([]);
                      }
                    }}
                  >
                    {useLocationFilter ? 'Disable' : 'Enable'} Location Filter
                  </Button>
                </HStack>

                {useLocationFilter && (
                  <VStack spacing={4} align="stretch">
                    <LocationSearch
                      onLocationChange={handleLocationChange}
                      onSearch={handleLocationSearch}
                      isLoading={isLocationSearching}
                    />

                    {currentLocation && locationSearchResults.length > 0 && (
                      <Text fontSize="sm" color="gray.500">
                        Found {locationSearchResults.length} listings within {searchRadius} miles of {currentLocation.formatted_address || 'your location'}
                      </Text>
                    )}
                  </VStack>
                )}
              </Box>

              {/* Clear Filters Button */}
              <Button
                variant="outline"
                colorScheme="gray"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('All');
                  setSelectedSize('All');
                  setSelectedCondition('All');
                  setUseLocationFilter(false);
                  setLocationSearchResults([]);
                  setCurrentLocation(null);
                }}
              >
                Clear All Filters
              </Button>
            </VStack>
          </Box>

          {/* Error Messages */}
          {listingsError && (
            <Alert status="error">
              <AlertIcon />
              {listingsError}
            </Alert>
          )}

          {locationError && useLocationFilter && (
            <Alert status="error">
              <AlertIcon />
              {locationError}
            </Alert>
          )}

          {/* Loading States */}
          {(isLoadingListings || (isLocationSearching && useLocationFilter)) && (
            <Center py={8}>
              <VStack spacing={4}>
                <Spinner size="lg" color="blue.500" />
                <Text color="gray.500">
                  {isLoadingListings ? 'Loading listings...' : 'Searching nearby listings...'}
                </Text>
              </VStack>
            </Center>
          )}

          {/* Results Summary */}
          {!isLoadingListings && !isLocationSearching && (
            <HStack justify="space-between" align="center">
              <Text fontWeight="medium" color={isDark ? 'white' : 'gray.800'}>
                {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} found
                {useLocationFilter && currentLocation && ` within ${searchRadius} miles`}
              </Text>
              {(selectedCategory !== 'All' || selectedSize !== 'All' || selectedCondition !== 'All' || useLocationFilter) && (
                <Text fontSize="sm" color="gray.500">
                  Filters active
                </Text>
              )}
            </HStack>
          )}

          {/* Items Grid */}
          {!isLoadingListings && !isLocationSearching && (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6}>
              {filteredItems.map(item => renderListingItem(item, useLocationFilter && item.distance_miles !== undefined))}
            </SimpleGrid>
          )}

          {/* No Results */}
          {!isLoadingListings && !isLocationSearching && filteredItems.length === 0 && (
            <Box textAlign="center" py={8}>
              <Text color="gray.500" mb={4}>
                {allListings.length === 0 
                  ? 'No listings available. Create the first listing!' 
                  : 'No items found matching your criteria.'
                }
              </Text>
              {allListings.length === 0 ? (
                <Button
                  colorScheme="blue"
                  onClick={loadAllListings}
                  size="sm"
                >
                  Refresh
                </Button>
              ) : (
                <Button
                  variant="outline"
                  colorScheme="gray"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('All');
                    setSelectedSize('All');
                    setSelectedCondition('All');
                    setUseLocationFilter(false);
                    setLocationSearchResults([]);
                    setCurrentLocation(null);
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </Box>
          )}
        </VStack>
      </VStack>
    </Box>
  );
};

export default Gallery;

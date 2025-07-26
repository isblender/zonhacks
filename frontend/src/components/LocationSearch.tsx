import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Input,
  Button,
  Text,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Alert,
  AlertIcon,
  Spinner,
  Badge,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import { LocationService, LocationData } from '../services/locationService';
import { useTheme } from '../contexts/ThemeContext';

interface LocationSearchProps {
  onLocationChange: (location: LocationData | null, radius: number) => void;
  onSearch: () => void;
  isLoading?: boolean;
}

const LocationSearch: React.FC<LocationSearchProps> = ({
  onLocationChange,
  onSearch,
  isLoading = false
}) => {
  const [addressInput, setAddressInput] = useState('');
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [radius, setRadius] = useState(25);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);
  const [locationPermission, setLocationPermission] = useState<PermissionState | 'unsupported' | null>(null);
  const { isDark } = useTheme();

  useEffect(() => {
    // Check location permission status on mount
    LocationService.getLocationPermissionStatus().then(setLocationPermission);
  }, []);

  const handleGetCurrentLocation = async () => {
    setIsGettingLocation(true);
    setLocationError(null);

    try {
      const location = await LocationService.getCurrentLocation();
      setCurrentLocation(location);
      
      // Display coordinates immediately, address will be updated if available
      const displayText = location.formatted_address || 
                         `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
      setAddressInput(displayText);
      
      onLocationChange(location, radius);
      
      // If we only have coordinates, try to get address in background
      if (!location.formatted_address) {
        try {
          const addressInfo = await LocationService.reverseGeocode(location.lat, location.lng);
          if (addressInfo.formatted_address) {
            const updatedLocation = { ...location, ...addressInfo };
            setCurrentLocation(updatedLocation);
            setAddressInput(addressInfo.formatted_address);
            onLocationChange(updatedLocation, radius);
          }
        } catch (error) {
          // Silently fail - coordinates are sufficient
          console.log('Background reverse geocoding failed:', error);
        }
      }
    } catch (error) {
      setLocationError(error instanceof Error ? error.message : 'Failed to get current location');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleAddressSearch = async () => {
    if (!addressInput.trim()) return;

    setIsGeocodingAddress(true);
    setLocationError(null);

    try {
      const location = await LocationService.geocodeAddress(addressInput.trim());
      setCurrentLocation(location);
      setAddressInput(location.formatted_address || addressInput);
      onLocationChange(location, radius);
    } catch (error) {
      setLocationError(error instanceof Error ? error.message : 'Failed to find address');
    } finally {
      setIsGeocodingAddress(false);
    }
  };

  const handleRadiusChange = (newRadius: number) => {
    setRadius(newRadius);
    if (currentLocation) {
      onLocationChange(currentLocation, newRadius);
    }
  };

  const handleClearLocation = () => {
    setCurrentLocation(null);
    setAddressInput('');
    setLocationError(null);
    onLocationChange(null, radius);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddressSearch();
    }
  };

  return (
    <Box
      p={4}
      bg={isDark ? 'gray.800' : 'white'}
      borderRadius="lg"
      boxShadow="md"
      border={isDark ? '1px solid' : 'none'}
      borderColor={isDark ? 'gray.600' : 'transparent'}
    >
      <VStack spacing={4} align="stretch">
        <Text fontWeight="semibold" color={isDark ? 'white' : 'gray.800'}>
          Search by Location
        </Text>

        {/* Address Input */}
        <HStack spacing={2}>
          <Input
            placeholder="Enter address, city, or zip code..."
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            onKeyPress={handleKeyPress}
            bg={isDark ? 'gray.700' : 'white'}
            borderColor={isDark ? 'gray.600' : 'gray.200'}
            color={isDark ? 'white' : 'gray.800'}
            _placeholder={{ color: isDark ? 'gray.400' : 'gray.500' }}
            isDisabled={isGeocodingAddress}
          />
          <Button
            onClick={handleAddressSearch}
            isLoading={isGeocodingAddress}
            loadingText="Finding..."
            colorScheme="blue"
            isDisabled={!addressInput.trim()}
          >
            Search
          </Button>
        </HStack>

        {/* Current Location Button */}
        <HStack justify="space-between">
          <Button
            onClick={handleGetCurrentLocation}
            isLoading={isGettingLocation}
            loadingText="Getting location..."
            variant="outline"
            colorScheme="green"
            size="sm"
            isDisabled={!LocationService.isGeolocationSupported()}
          >
            📍 Use Current Location
          </Button>

          {currentLocation && (
            <HStack spacing={2}>
              <Badge colorScheme="green" variant="subtle">
                Location Set
              </Badge>
              <Tooltip label="Clear location">
                <IconButton
                  aria-label="Clear location"
                  size="sm"
                  variant="ghost"
                  onClick={handleClearLocation}
                >
                  ✕
                </IconButton>
              </Tooltip>
            </HStack>
          )}
        </HStack>

        {/* Location Permission Warning */}
        {locationPermission === 'denied' && (
          <Alert status="warning" size="sm">
            <AlertIcon />
            <Text fontSize="sm">
              Location access denied. Please enable location permissions to use current location.
            </Text>
          </Alert>
        )}

        {/* Error Display */}
        {locationError && (
          <Alert status="error" size="sm">
            <AlertIcon />
            <Text fontSize="sm">{locationError}</Text>
          </Alert>
        )}

        {/* Current Location Display */}
        {currentLocation && (
          <Box
            p={3}
            bg={isDark ? 'gray.700' : 'gray.50'}
            borderRadius="md"
            border={isDark ? '1px solid' : 'none'}
            borderColor={isDark ? 'gray.600' : 'transparent'}
          >
            <VStack spacing={2} align="start">
              <Text fontSize="sm" fontWeight="medium" color={isDark ? 'white' : 'gray.800'}>
                Search Center:
              </Text>
              <Text fontSize="sm" color={isDark ? 'gray.300' : 'gray.600'}>
                {currentLocation.formatted_address || 
                 `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`}
              </Text>
              {currentLocation.city && currentLocation.state && (
                <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'}>
                  {currentLocation.city}, {currentLocation.state}
                </Text>
              )}
            </VStack>
          </Box>
        )}

        {/* Radius Slider */}
        <Box>
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" fontWeight="medium" color={isDark ? 'white' : 'gray.800'}>
              Search Radius
            </Text>
            <Text fontSize="sm" color={isDark ? 'gray.300' : 'gray.600'}>
              {radius} miles
            </Text>
          </HStack>
          <Slider
            value={radius}
            onChange={handleRadiusChange}
            min={1}
            max={100}
            step={1}
            colorScheme="blue"
          >
            <SliderTrack bg={isDark ? 'gray.600' : 'gray.200'}>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb boxSize={4} />
          </Slider>
          <HStack justify="space-between" mt={1}>
            <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'}>1 mi</Text>
            <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'}>100 mi</Text>
          </HStack>
        </Box>

        {/* Search Button */}
        <Button
          onClick={onSearch}
          colorScheme="blue"
          size="lg"
          isLoading={isLoading}
          loadingText="Searching..."
          isDisabled={!currentLocation}
        >
          Search Listings
        </Button>

        {/* Help Text */}
        <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'} textAlign="center">
          {!LocationService.isGeolocationSupported() 
            ? 'Geolocation not supported. Please enter an address manually.'
            : 'Allow location access for best results, or enter an address manually.'
          }
        </Text>
      </VStack>
    </Box>
  );
};

export default LocationSearch;

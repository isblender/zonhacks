import React, { useState, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  Textarea,
  Select,
  Heading,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Alert,
  AlertIcon,
  Image,
  SimpleGrid,
  Badge,
  IconButton,
  Spinner,
  Center,
  useToast,
} from '@chakra-ui/react';
import { useTheme } from '../contexts/ThemeContext';
import LocationSearch from '../components/LocationSearch';
import { LocationData } from '../services/locationService';
import { ListingsService, CreateListingData } from '../services/listingsService';

const CreateListing: React.FC = () => {
  const [formData, setFormData] = useState<CreateListingData>({
    userId: '1', // In real app, this would come from auth context
    title: '',
    description: '',
    category: '',
    size: '',
    condition: '',
    zipCode: '',
    location: null,
    tags: [],
    images: []
  });

  const [tagInput, setTagInput] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const { isDark } = useTheme();

  const categories = ListingsService.getCategories().filter(cat => cat !== 'All');
  const sizes = ListingsService.getSizes();
  const conditions = ListingsService.getConditions();

  const handleInputChange = (field: keyof CreateListingData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setErrors([]);
    setSubmitError(null);
  };

  const handleLocationChange = (location: LocationData | null, radius: number) => {
    setCurrentLocation(location);
    setFormData(prev => ({
      ...prev,
      location: location
    }));
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;

    // Validate file types and sizes
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        invalidFiles.push(`${file.name} is not an image file`);
        return;
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        invalidFiles.push(`${file.name} is too large (max 5MB)`);
        return;
      }

      validFiles.push(file);
    });

    if (invalidFiles.length > 0) {
      toast({
        title: 'Invalid files',
        description: invalidFiles.join(', '),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }

    if (validFiles.length > 0) {
      const newImages = [...selectedImages, ...validFiles].slice(0, 5); // Max 5 images
      setSelectedImages(newImages);
      setFormData(prev => ({
        ...prev,
        images: newImages
      }));

      // Create previews
      const newPreviews: string[] = [];
      newImages.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          newPreviews.push(e.target?.result as string);
          if (newPreviews.length === newImages.length) {
            setImagePreviews(newPreviews);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    
    setSelectedImages(newImages);
    setImagePreviews(newPreviews);
    setFormData(prev => ({
      ...prev,
      images: newImages
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      const newTags = [...(formData.tags || []), tagInput.trim()];
      setFormData(prev => ({
        ...prev,
        tags: newTags
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = formData.tags?.filter(tag => tag !== tagToRemove) || [];
    setFormData(prev => ({
      ...prev,
      tags: newTags
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    const validationErrors = ListingsService.validateListingData(formData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setErrors([]);

    try {
      const response = await ListingsService.createListing(formData);
      
      setSubmitSuccess(true);
      toast({
        title: 'Listing created successfully!',
        description: `Your listing "${formData.title}" has been created.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Reset form
      setFormData({
        userId: '1',
        title: '',
        description: '',
        category: '',
        size: '',
        condition: '',
        zipCode: '',
        location: null,
        tags: [],
        images: []
      });
      setSelectedImages([]);
      setImagePreviews([]);
      setCurrentLocation(null);
      setTagInput('');

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to create listing');
      toast({
        title: 'Error creating listing',
        description: error instanceof Error ? error.message : 'Please try again',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box p={6} maxW="800px" mx="auto">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg" mb={2} color={isDark ? 'white' : 'gray.800'}>
            Create New Listing
          </Heading>
          <Text color="gray.600">
            Share your clothing items with the community
          </Text>
        </Box>

        {/* Success Message */}
        {submitSuccess && (
          <Alert status="success">
            <AlertIcon />
            Listing created successfully! It's now available for other users to discover.
          </Alert>
        )}

        {/* Error Messages */}
        {errors.length > 0 && (
          <Alert status="error">
            <AlertIcon />
            <VStack align="start" spacing={1}>
              <Text fontWeight="medium">Please fix the following errors:</Text>
              {errors.map((error, index) => (
                <Text key={index} fontSize="sm">• {error}</Text>
              ))}
            </VStack>
          </Alert>
        )}

        {submitError && (
          <Alert status="error">
            <AlertIcon />
            {submitError}
          </Alert>
        )}

        {/* Form */}
        <Box
          as="form"
          onSubmit={handleSubmit}
          bg={isDark ? 'gray.800' : 'white'}
          p={6}
          borderRadius="lg"
          boxShadow="md"
          border={isDark ? '1px solid' : 'none'}
          borderColor={isDark ? 'gray.600' : 'transparent'}
        >
          <VStack spacing={6} align="stretch">
            {/* Basic Information */}
            <Box>
              <Text fontSize="lg" fontWeight="semibold" mb={4} color={isDark ? 'white' : 'gray.800'}>
                Basic Information
              </Text>
              
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  <FormLabel color={isDark ? 'white' : 'gray.700'}>Title</FormLabel>
                  <Input
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="e.g., Vintage Denim Jacket"
                    bg={isDark ? 'gray.700' : 'white'}
                    borderColor={isDark ? 'gray.600' : 'gray.200'}
                    color={isDark ? 'white' : 'gray.800'}
                    _placeholder={{ color: isDark ? 'gray.400' : 'gray.500' }}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel color={isDark ? 'white' : 'gray.700'}>Description</FormLabel>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe the item's condition, style, and any other details..."
                    rows={4}
                    bg={isDark ? 'gray.700' : 'white'}
                    borderColor={isDark ? 'gray.600' : 'gray.200'}
                    color={isDark ? 'white' : 'gray.800'}
                    _placeholder={{ color: isDark ? 'gray.400' : 'gray.500' }}
                  />
                </FormControl>

                <HStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel color={isDark ? 'white' : 'gray.700'}>Category</FormLabel>
                    <Select
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      placeholder="Select category"
                      bg={isDark ? 'gray.700' : 'white'}
                      borderColor={isDark ? 'gray.600' : 'gray.200'}
                      color={isDark ? 'white' : 'gray.800'}
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel color={isDark ? 'white' : 'gray.700'}>Size</FormLabel>
                    <Select
                      value={formData.size}
                      onChange={(e) => handleInputChange('size', e.target.value)}
                      placeholder="Select size"
                      bg={isDark ? 'gray.700' : 'white'}
                      borderColor={isDark ? 'gray.600' : 'gray.200'}
                      color={isDark ? 'white' : 'gray.800'}
                    >
                      {sizes.map(size => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel color={isDark ? 'white' : 'gray.700'}>Condition</FormLabel>
                    <Select
                      value={formData.condition}
                      onChange={(e) => handleInputChange('condition', e.target.value)}
                      placeholder="Select condition"
                      bg={isDark ? 'gray.700' : 'white'}
                      borderColor={isDark ? 'gray.600' : 'gray.200'}
                      color={isDark ? 'white' : 'gray.800'}
                    >
                      {conditions.map(condition => (
                        <option key={condition} value={condition}>
                          {condition}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                </HStack>
              </VStack>
            </Box>

            {/* Location */}
            <Box>
              <Text fontSize="lg" fontWeight="semibold" mb={4} color={isDark ? 'white' : 'gray.800'}>
                Location
              </Text>
              
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  <FormLabel color={isDark ? 'white' : 'gray.700'}>Zip Code</FormLabel>
                  <Input
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    placeholder="e.g., 98101"
                    maxW="200px"
                    bg={isDark ? 'gray.700' : 'white'}
                    borderColor={isDark ? 'gray.600' : 'gray.200'}
                    color={isDark ? 'white' : 'gray.800'}
                    _placeholder={{ color: isDark ? 'gray.400' : 'gray.500' }}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color={isDark ? 'white' : 'gray.700'}>
                    Specific Location (Optional)
                  </FormLabel>
                  <Text fontSize="sm" color="gray.500" mb={3}>
                    Set a more specific location to help users find your item
                  </Text>
                  <LocationSearch
                    onLocationChange={handleLocationChange}
                    onSearch={() => {}} // Not needed for creation
                    isLoading={false}
                  />
                </FormControl>
              </VStack>
            </Box>

            {/* Images */}
            <Box>
              <Text fontSize="lg" fontWeight="semibold" mb={4} color={isDark ? 'white' : 'gray.800'}>
                Images
              </Text>
              
              <VStack spacing={4} align="stretch">
                <FormControl>
                  <FormLabel color={isDark ? 'white' : 'gray.700'}>
                    Upload Images (Max 5, 5MB each)
                  </FormLabel>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    display="none"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    colorScheme="blue"
                    isDisabled={selectedImages.length >= 5}
                  >
                    {selectedImages.length === 0 ? 'Choose Images' : 'Add More Images'}
                  </Button>
                  <Text fontSize="sm" color="gray.500" mt={2}>
                    {selectedImages.length}/5 images selected
                  </Text>
                </FormControl>

                {imagePreviews.length > 0 && (
                  <SimpleGrid columns={{ base: 2, md: 3, lg: 5 }} spacing={4}>
                    {imagePreviews.map((preview, index) => (
                      <Box key={index} position="relative">
                        <Image
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          borderRadius="md"
                          objectFit="cover"
                          h="120px"
                          w="full"
                        />
                        <IconButton
                          aria-label="Remove image"
                          size="sm"
                          colorScheme="red"
                          position="absolute"
                          top={1}
                          right={1}
                          onClick={() => removeImage(index)}
                        >
                          ✕
                        </IconButton>
                      </Box>
                    ))}
                  </SimpleGrid>
                )}
              </VStack>
            </Box>

            {/* Tags */}
            <Box>
              <Text fontSize="lg" fontWeight="semibold" mb={4} color={isDark ? 'white' : 'gray.800'}>
                Tags (Optional)
              </Text>
              
              <VStack spacing={4} align="stretch">
                <FormControl>
                  <FormLabel color={isDark ? 'white' : 'gray.700'}>Add Tags</FormLabel>
                  <HStack>
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="e.g., vintage, casual, summer"
                      bg={isDark ? 'gray.700' : 'white'}
                      borderColor={isDark ? 'gray.600' : 'gray.200'}
                      color={isDark ? 'white' : 'gray.800'}
                      _placeholder={{ color: isDark ? 'gray.400' : 'gray.500' }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                    />
                    <Button onClick={addTag} colorScheme="blue" variant="outline">
                      Add
                    </Button>
                  </HStack>
                </FormControl>

                {formData.tags && formData.tags.length > 0 && (
                  <HStack spacing={2} wrap="wrap">
                    {formData.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        colorScheme="blue"
                        variant="subtle"
                        px={2}
                        py={1}
                        cursor="pointer"
                        onClick={() => removeTag(tag)}
                      >
                        {tag} ✕
                      </Badge>
                    ))}
                  </HStack>
                )}
              </VStack>
            </Box>

            {/* Submit Button */}
            <Button
              type="submit"
              colorScheme="blue"
              size="lg"
              isLoading={isSubmitting}
              loadingText="Creating Listing..."
              isDisabled={isSubmitting}
            >
              Create Listing
            </Button>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default CreateListing;

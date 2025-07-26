// Service for managing listings API calls
export interface Listing {
  listingId: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  size: string;
  condition: string;
  zipCode: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
    formatted_address?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  tags: string[];
  images: Array<{
    key: string;
    url: string;
    original_filename?: string;
  }>;
  status: string;
  createdAt: string;
  updatedAt: string;
  distance_miles?: number;
}

export interface CreateListingData {
  userId: string;
  title: string;
  description: string;
  category: string;
  size: string;
  condition: string;
  zipCode: string;
  location?: any;
  tags?: string[];
  images?: File[];
}

export interface SearchFilters {
  zipCode?: string;
  category?: string;
  size?: string;
  condition?: string;
  userId?: string;
}

export interface LocationSearchParams {
  lat?: number;
  lng?: number;
  address?: string;
  zipCode?: string;
  radius?: number;
  category?: string;
  size?: string;
  condition?: string;
}

export class ListingsService {
  private static readonly API_BASE_URL = 'http://127.0.0.1:8000';

  /**
   * Create a new listing
   */
  static async createListing(data: CreateListingData): Promise<any> {
    try {
      const formData = new FormData();
      
      // Add form fields
      formData.append('userId', data.userId);
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('category', data.category);
      formData.append('size', data.size);
      formData.append('condition', data.condition);
      formData.append('zipCode', data.zipCode);
      
      // Add optional fields
      if (data.location) {
        formData.append('location', JSON.stringify(data.location));
      }
      
      if (data.tags && data.tags.length > 0) {
        formData.append('tags', JSON.stringify(data.tags));
      }
      
      // Add image files
      if (data.images && data.images.length > 0) {
        for (const image of data.images) {
          formData.append('images', image);
        }
      }

      const response = await fetch(`${this.API_BASE_URL}/listings/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create listing');
      }

      return await response.json();
    } catch (error) {
      console.error('Create listing error:', error);
      throw error;
    }
  }

  /**
   * Get all listings with optional filters
   */
  static async getListings(filters: SearchFilters = {}): Promise<any> {
    try {
      const searchParams = new URLSearchParams();
      
      if (filters.zipCode) searchParams.append('zip_code', filters.zipCode);
      if (filters.category) searchParams.append('category', filters.category);
      if (filters.size) searchParams.append('size', filters.size);
      if (filters.userId) searchParams.append('user_id', filters.userId);

      const response = await fetch(`${this.API_BASE_URL}/listings/?${searchParams}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch listings');
      }

      return await response.json();
    } catch (error) {
      console.error('Get listings error:', error);
      throw error;
    }
  }

  /**
   * Get a specific listing by ID
   */
  static async getListing(listingId: string): Promise<any> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/listings/${listingId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch listing');
      }

      return await response.json();
    } catch (error) {
      console.error('Get listing error:', error);
      throw error;
    }
  }

  /**
   * Update a listing
   */
  static async updateListing(listingId: string, data: Partial<CreateListingData>): Promise<any> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/listings/${listingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update listing');
      }

      return await response.json();
    } catch (error) {
      console.error('Update listing error:', error);
      throw error;
    }
  }

  /**
   * Delete a listing
   */
  static async deleteListing(listingId: string, userId: string): Promise<any> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/listings/${listingId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete listing');
      }

      return await response.json();
    } catch (error) {
      console.error('Delete listing error:', error);
      throw error;
    }
  }

  /**
   * Search listings by location
   */
  static async searchListingsByLocation(params: LocationSearchParams): Promise<any> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params.lat !== undefined) searchParams.append('lat', params.lat.toString());
      if (params.lng !== undefined) searchParams.append('lng', params.lng.toString());
      if (params.address) searchParams.append('address', params.address);
      if (params.zipCode) searchParams.append('zip_code', params.zipCode);
      if (params.radius !== undefined) searchParams.append('radius', params.radius.toString());
      if (params.category) searchParams.append('category', params.category);
      if (params.size) searchParams.append('size', params.size);
      if (params.condition) searchParams.append('condition', params.condition);

      const response = await fetch(`${this.API_BASE_URL}/listings/search/by-location?${searchParams}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to search listings');
      }

      return await response.json();
    } catch (error) {
      console.error('Location search error:', error);
      throw error;
    }
  }

  /**
   * Get listings by user
   */
  static async getUserListings(userId: string): Promise<any> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/listings/user/${userId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch user listings');
      }

      return await response.json();
    } catch (error) {
      console.error('Get user listings error:', error);
      throw error;
    }
  }

  /**
   * Format listing for display
   */
  static formatListingForDisplay(listing: any): Listing {
    return {
      listingId: listing.listingId || listing.id,
      userId: listing.userId,
      title: listing.title,
      description: listing.description,
      category: listing.category,
      size: listing.size,
      condition: listing.condition,
      zipCode: listing.zipCode,
      location: listing.location,
      tags: listing.tags || [],
      images: listing.images || [],
      status: listing.status,
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
      distance_miles: listing.distance_miles
    };
  }

  /**
   * Get available categories
   */
  static getCategories(): string[] {
    return [
      'All',
      'Jackets',
      'Dresses', 
      'Shoes',
      'Sweaters',
      'Accessories',
      'T-Shirts',
      'Pants',
      'Shirts',
      'Skirts',
      'Bags',
      'Jewelry'
    ];
  }

  /**
   * Get available sizes
   */
  static getSizes(): string[] {
    return ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'];
  }

  /**
   * Get available conditions
   */
  static getConditions(): string[] {
    return ['Like New', 'Excellent', 'Good', 'Fair', 'Poor'];
  }

  /**
   * Validate listing data before submission
   */
  static validateListingData(data: CreateListingData): string[] {
    const errors: string[] = [];

    if (!data.title?.trim()) {
      errors.push('Title is required');
    }

    if (!data.description?.trim()) {
      errors.push('Description is required');
    }

    if (!data.category?.trim()) {
      errors.push('Category is required');
    }

    if (!data.size?.trim()) {
      errors.push('Size is required');
    }

    if (!data.condition?.trim()) {
      errors.push('Condition is required');
    }

    if (!data.zipCode?.trim()) {
      errors.push('Zip code is required');
    } else if (!/^\d{5}(-\d{4})?$/.test(data.zipCode.trim())) {
      errors.push('Invalid zip code format');
    }

    if (!data.userId?.trim()) {
      errors.push('User ID is required');
    }

    return errors;
  }

  /**
   * Format distance for display
   */
  static formatDistance(miles: number): string {
    if (miles < 1) {
      return `${(miles * 5280).toFixed(0)} ft`;
    } else if (miles < 10) {
      return `${miles.toFixed(1)} mi`;
    } else {
      return `${Math.round(miles)} mi`;
    }
  }
}

// Location service for handling geolocation and geocoding
export interface LocationData {
  lat: number;
  lng: number;
  address?: string;
  formatted_address?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface GeolocationError {
  code: number;
  message: string;
}

export class LocationService {
  private static readonly API_BASE_URL = 'http://127.0.0.1:8000';

  /**
   * Get user's current location using browser geolocation API
   */
  static async getCurrentLocation(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      };

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Return coordinates immediately
          const locationData: LocationData = {
            lat: latitude,
            lng: longitude
          };
          
          resolve(locationData);
          
          // Try to reverse geocode in the background (optional)
          try {
            const addressInfo = await Promise.race([
              this.reverseGeocode(latitude, longitude),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Reverse geocoding timeout')), 3000)
              )
            ]) as Partial<LocationData>;
            
            // Update with address info if successful (this won't affect the resolved promise)
            Object.assign(locationData, addressInfo);
          } catch (error) {
            // Silently fail reverse geocoding - coordinates are sufficient
            console.log('Reverse geocoding failed or timed out:', error);
          }
        },
        (error) => {
          let message = 'Unknown geolocation error';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              message = 'Location request timed out';
              break;
          }
          reject(new Error(message));
        },
        options
      );
    });
  }

  /**
   * Geocode an address to get coordinates
   */
  static async geocodeAddress(address: string): Promise<LocationData> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/listings/geocode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to geocode address');
      }

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  }

  /**
   * Get address suggestions based on partial query
   */
  static async getAddressSuggestions(query: string, limit: number = 5): Promise<LocationData[]> {
    try {
      if (query.length < 3) {
        return [];
      }

      const response = await fetch(`${this.API_BASE_URL}/listings/address-suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, limit }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get address suggestions');
      }

      const data = await response.json();
      return data.suggestions || [];
    } catch (error) {
      console.error('Address suggestions error:', error);
      return [];
    }
  }

  /**
   * Reverse geocode coordinates to get address
   */
  static async reverseGeocode(lat: number, lng: number): Promise<Partial<LocationData>> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/listings/reverse-geocode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lat, lng }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to reverse geocode coordinates');
      }

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      throw error;
    }
  }

  /**
   * Search listings by location
   */
  static async searchListingsByLocation(params: {
    lat?: number;
    lng?: number;
    address?: string;
    zipCode?: string;
    radius?: number;
    category?: string;
    size?: string;
    condition?: string;
  }) {
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
   * Calculate distance between two points (client-side utility)
   */
  static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 3956; // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Check if geolocation is supported
   */
  static isGeolocationSupported(): boolean {
    return 'geolocation' in navigator;
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

  /**
   * Get location permission status
   */
  static async getLocationPermissionStatus(): Promise<PermissionState | 'unsupported'> {
    if (!navigator.permissions) {
      return 'unsupported';
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      return permission.state;
    } catch (error) {
      return 'unsupported';
    }
  }
}

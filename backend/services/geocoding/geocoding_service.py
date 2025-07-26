import requests
import logging
from typing import Dict, Optional, Tuple, List
from core.config import settings
import math
from decimal import Decimal

logger = logging.getLogger(__name__)

class GeocodingService:
    """Service for geocoding addresses and calculating distances"""
    
    @staticmethod
    def geocode_address(address: str) -> Optional[Dict]:
        """
        Convert an address to latitude/longitude coordinates using a free geocoding service.
        Returns dict with lat, lng, formatted_address, or None if failed.
        """
        try:
            # Using Nominatim (OpenStreetMap) - free geocoding service
            url = "https://nominatim.openstreetmap.org/search"
            params = {
                'q': address,
                'format': 'json',
                'limit': 1,
                'addressdetails': 1
            }
            headers = {
                'User-Agent': 'ClothingSwapApp/1.0'  # Required by Nominatim
            }
            
            response = requests.get(url, params=params, headers=headers, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            if not data:
                logger.warning(f"No geocoding results found for address: {address}")
                return None
            
            result = data[0]
            return {
                'lat': float(result['lat']),
                'lng': float(result['lon']),
                'formatted_address': result.get('display_name', address),
                'city': result.get('address', {}).get('city', ''),
                'state': result.get('address', {}).get('state', ''),
                'country': result.get('address', {}).get('country', '')
            }
            
        except requests.RequestException as e:
            logger.error(f"Geocoding API request failed: {e}")
            return None
        except (KeyError, ValueError, TypeError) as e:
            logger.error(f"Error parsing geocoding response: {e}")
            return None
    
    @staticmethod
    def search_address_suggestions(query: str, limit: int = 5) -> List[Dict]:
        """
        Search for address suggestions based on a partial query.
        Returns list of suggested addresses with their details.
        """
        try:
            # Using Nominatim (OpenStreetMap) - free geocoding service
            url = "https://nominatim.openstreetmap.org/search"
            params = {
                'q': query,
                'format': 'json',
                'limit': limit,
                'addressdetails': 1
            }
            headers = {
                'User-Agent': 'ClothingSwapApp/1.0'  # Required by Nominatim
            }
            
            response = requests.get(url, params=params, headers=headers, timeout=5)
            response.raise_for_status()
            
            data = response.json()
            suggestions = []
            
            for result in data:
                try:
                    suggestion = {
                        'lat': float(result['lat']),
                        'lng': float(result['lon']),
                        'formatted_address': result.get('display_name', query),
                        'city': result.get('address', {}).get('city', ''),
                        'state': result.get('address', {}).get('state', ''),
                        'country': result.get('address', {}).get('country', ''),
                        'type': result.get('type', ''),
                        'importance': result.get('importance', 0)
                    }
                    suggestions.append(suggestion)
                except (KeyError, ValueError, TypeError) as e:
                    logger.warning(f"Error parsing suggestion result: {e}")
                    continue
            
            # Sort by importance (higher is better)
            suggestions.sort(key=lambda x: x.get('importance', 0), reverse=True)
            
            return suggestions
            
        except requests.RequestException as e:
            logger.error(f"Address suggestions API request failed: {e}")
            return []
        except (KeyError, ValueError, TypeError) as e:
            logger.error(f"Error parsing address suggestions response: {e}")
            return []
    
    @staticmethod
    def reverse_geocode(lat: float, lng: float) -> Optional[Dict]:
        """
        Convert latitude/longitude to address information.
        Returns dict with address components or None if failed.
        """
        try:
            url = "https://nominatim.openstreetmap.org/reverse"
            params = {
                'lat': lat,
                'lon': lng,
                'format': 'json',
                'addressdetails': 1
            }
            headers = {
                'User-Agent': 'ClothingSwapApp/1.0'
            }
            
            response = requests.get(url, params=params, headers=headers, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            if not data:
                return None
            
            address = data.get('address', {})
            return {
                'formatted_address': data.get('display_name', ''),
                'city': address.get('city', address.get('town', address.get('village', ''))),
                'state': address.get('state', ''),
                'country': address.get('country', ''),
                'postal_code': address.get('postcode', '')
            }
            
        except requests.RequestException as e:
            logger.error(f"Reverse geocoding API request failed: {e}")
            return None
        except (KeyError, ValueError, TypeError) as e:
            logger.error(f"Error parsing reverse geocoding response: {e}")
            return None
    
    @staticmethod
    def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """
        Calculate the distance between two points using the Haversine formula.
        Returns distance in miles.
        """
        # Convert latitude and longitude from degrees to radians
        lat1, lng1, lat2, lng2 = map(math.radians, [lat1, lng1, lat2, lng2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlng = lng2 - lng1
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        # Radius of earth in miles
        r = 3956
        
        return c * r
    
    @staticmethod
    def get_zip_code_coordinates(zip_code: str) -> Optional[Dict]:
        """
        Get coordinates for a zip code.
        Returns dict with lat, lng or None if failed.
        """
        return GeocodingService.geocode_address(f"{zip_code}, USA")
    
    @staticmethod
    def filter_listings_by_distance(
        listings: list, 
        center_lat: float, 
        center_lng: float, 
        radius_miles: float
    ) -> list:
        """
        Filter listings by distance from a center point.
        Returns list of listings within the specified radius.
        """
        filtered_listings = []
        
        for listing in listings:
            location = listing.get('location', {})
            if not location or 'lat' not in location or 'lng' not in location:
                continue
            
            # Convert Decimal to float for calculation if needed
            lat = float(location['lat']) if isinstance(location['lat'], Decimal) else location['lat']
            lng = float(location['lng']) if isinstance(location['lng'], Decimal) else location['lng']
            
            distance = GeocodingService.calculate_distance(
                center_lat, center_lng, lat, lng
            )
            
            if distance <= radius_miles:
                # Add distance to listing for sorting/display
                listing['distance_miles'] = round(distance, 1)
                filtered_listings.append(listing)
        
        # Sort by distance
        filtered_listings.sort(key=lambda x: x.get('distance_miles', float('inf')))
        
        return filtered_listings
    
    @staticmethod
    def convert_coordinates_for_dynamodb(location_data: Dict) -> Dict:
        """
        Convert float coordinates to Decimal for DynamoDB storage.
        DynamoDB requires Decimal types for numbers.
        """
        if not location_data:
            return location_data
        
        converted_data = location_data.copy()
        
        # Convert lat/lng to Decimal if they exist
        if 'lat' in converted_data and isinstance(converted_data['lat'], (int, float)):
            converted_data['lat'] = Decimal(str(converted_data['lat']))
        
        if 'lng' in converted_data and isinstance(converted_data['lng'], (int, float)):
            converted_data['lng'] = Decimal(str(converted_data['lng']))
        
        return converted_data

// Service for managing swap requests API calls
export interface SwapRequest {
  swapId: string;
  requesterId: string;
  requesterListingId: string;
  targetListingId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  message?: string;
  createdAt: string;
  updatedAt: string;
  // Populated data
  requesterListing?: any;
  targetListing?: any;
  requesterUser?: any;
  targetUser?: any;
}

export interface CreateSwapRequestData {
  requesterId: string;
  ownerId: string;
  requesterListingId: string;
  ownerListingId: string;
  message?: string;
  meetupDetails?: {
    preferredLocation?: string;
    preferredTime?: string;
    contactMethod?: string;
  };
}

export class SwapService {
  private static readonly API_BASE_URL = 'http://127.0.0.1:8000';

  /**
   * Create a new swap request
   */
  static async createSwapRequest(data: CreateSwapRequestData): Promise<any> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/swaps/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create swap request');
      }

      return await response.json();
    } catch (error) {
      console.error('Create swap request error:', error);
      throw error;
    }
  }

  /**
   * Get swap requests for a user (both incoming and outgoing)
   */
  static async getUserSwapRequests(userId: string): Promise<any> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/swaps/user/${userId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch swap requests');
      }

      return await response.json();
    } catch (error) {
      console.error('Get user swap requests error:', error);
      throw error;
    }
  }

  /**
   * Get incoming swap requests for a user (where user is the owner)
   */
  static async getIncomingSwapRequests(userId: string): Promise<any> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/swaps/?user_id=${userId}&role=owner&status=pending`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch incoming swap requests');
      }

      return await response.json();
    } catch (error) {
      console.error('Get incoming swap requests error:', error);
      throw error;
    }
  }

  /**
   * Get outgoing swap requests for a user (where user is the requester)
   */
  static async getOutgoingSwapRequests(userId: string): Promise<any> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/swaps/?user_id=${userId}&role=requester`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch outgoing swap requests');
      }

      return await response.json();
    } catch (error) {
      console.error('Get outgoing swap requests error:', error);
      throw error;
    }
  }

  /**
   * Update swap request status
   */
  static async updateSwapRequest(swapId: string, status: string, userId: string): Promise<any> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/swaps/${swapId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update swap request');
      }

      return await response.json();
    } catch (error) {
      console.error('Update swap request error:', error);
      throw error;
    }
  }

  /**
   * Accept a swap request
   */
  static async acceptSwapRequest(swapId: string, userId: string): Promise<any> {
    return this.updateSwapRequest(swapId, 'accepted', userId);
  }

  /**
   * Reject a swap request
   */
  static async rejectSwapRequest(swapId: string, userId: string): Promise<any> {
    return this.updateSwapRequest(swapId, 'rejected', userId);
  }

  /**
   * Cancel a swap request
   */
  static async cancelSwapRequest(swapId: string, userId: string): Promise<any> {
    return this.updateSwapRequest(swapId, 'cancelled', userId);
  }

  /**
   * Complete a swap request
   */
  static async completeSwapRequest(swapId: string, userId: string): Promise<any> {
    return this.updateSwapRequest(swapId, 'completed', userId);
  }

  /**
   * Get swap request by ID
   */
  static async getSwapRequest(swapId: string): Promise<any> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/swaps/${swapId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch swap request');
      }

      return await response.json();
    } catch (error) {
      console.error('Get swap request error:', error);
      throw error;
    }
  }

  /**
   * Check if user has already requested a swap for a listing
   */
  static async hasUserRequestedSwap(userId: string, targetListingId: string): Promise<boolean> {
    try {
      const response = await this.getOutgoingSwapRequests(userId);
      const outgoingRequests = response.swaps || [];
      
      return outgoingRequests.some((swap: SwapRequest) => 
        swap.targetListingId === targetListingId && 
        ['pending', 'accepted'].includes(swap.status)
      );
    } catch (error) {
      console.error('Check swap request error:', error);
      return false;
    }
  }

  /**
   * Get listings that user has already requested swaps for
   */
  static async getRequestedListingIds(userId: string): Promise<string[]> {
    try {
      const response = await this.getOutgoingSwapRequests(userId);
      const outgoingRequests = response.swaps || [];
      
      return outgoingRequests
        .filter((swap: any) => ['pending', 'accepted'].includes(swap.status))
        .map((swap: any) => swap.ownerListingId); // Backend uses ownerListingId
    } catch (error) {
      console.error('Get requested listing IDs error:', error);
      return [];
    }
  }

  /**
   * Format swap request for display
   */
  static formatSwapRequestForDisplay(swap: any): SwapRequest {
    return {
      swapId: swap.swapId,
      requesterId: swap.requesterId,
      requesterListingId: swap.requesterListingId,
      targetListingId: swap.ownerListingId, // Map ownerListingId to targetListingId for frontend
      status: swap.status,
      message: swap.message,
      createdAt: swap.createdAt,
      updatedAt: swap.updatedAt,
      requesterListing: swap.requester_listing, // Backend uses snake_case
      targetListing: swap.owner_listing, // Backend uses owner_listing
      requesterUser: swap.requester_info, // Backend uses requester_info
      targetUser: swap.owner_info, // Backend uses owner_info
    };
  }

  /**
   * Get status badge color
   */
  static getStatusBadgeColor(status: string): string {
    switch (status) {
      case 'pending':
        return 'yellow';
      case 'accepted':
        return 'green';
      case 'rejected':
        return 'red';
      case 'completed':
        return 'blue';
      case 'cancelled':
        return 'gray';
      default:
        return 'gray';
    }
  }

  /**
   * Get status display text
   */
  static getStatusDisplayText(status: string): string {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'accepted':
        return 'Accepted';
      case 'rejected':
        return 'Rejected';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  }

  /**
   * Check if user can perform action on swap request
   */
  static canUserPerformAction(swap: SwapRequest, userId: string, action: string): boolean {
    switch (action) {
      case 'accept':
      case 'reject':
        // Only target user can accept/reject incoming requests
        return swap.targetListing?.userId === userId && swap.status === 'pending';
      case 'cancel':
        // Only requester can cancel their own requests
        return swap.requesterId === userId && ['pending', 'accepted'].includes(swap.status);
      case 'complete':
        // Both users can mark as completed
        return ['accepted'].includes(swap.status) && 
               (swap.requesterId === userId || swap.targetListing?.userId === userId);
      default:
        return false;
    }
  }
}

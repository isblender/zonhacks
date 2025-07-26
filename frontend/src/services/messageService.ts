import axios from 'axios';

// Types
export type MessageType = 'user' | 'system';
export type SystemEventType =
  | 'swap_created'
  | 'swap_accepted'
  | 'swap_rejected'
  | 'swap_completed'
  | 'swap_cancelled';

export interface Message {
  message_id: string;
  swap_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  timestamp: string;
  is_read: boolean;
  message_type: MessageType;
  event_type?: SystemEventType;
  metadata?: {
    previous_status?: string;
    new_status?: string;
    actor_id?: string;
    timestamp?: string;
    [key: string]: any;
  };
}

export interface MessageCreate {
  content: string;
}

export interface UnreadMessageCount {
  count: number;
  swaps: {
    swap_id: string;
    count: number;
  }[];
}

export interface MessageReference {
  total_count: number;
  unread_count: number;
  latest_message?: {
    content: string;
    timestamp: string;
    message_type: MessageType;
    event_type?: SystemEventType;
  };
}

// Base API URL - can be imported from a config file
const API_BASE_URL = '';

/**
 * Service for handling message-related API calls
 */
const messageService = {
  /**
   * Get messages for a specific swap
   */
  getMessagesForSwap: async (swapId: string, userId: string): Promise<Message[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/messages/swap/${swapId}?user_id=${userId}`);
      
      // Ensure we always return an array, even if the API returns something else
      const messages = response.data;
      if (!Array.isArray(messages)) {
        console.error('API did not return an array for messages:', messages);
        return [];
      }
      
      return messages;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  /**
   * Send a new message in a swap
   */
  sendMessage: async (swapId: string, userId: string, content: string): Promise<Message> => {
    try {
      const messageData: MessageCreate = { content };
      const response = await axios.post(
        `${API_BASE_URL}/messages/swap/${swapId}?user_id=${userId}`, 
        messageData
      );
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  /**
   * Mark a message as read
   */
  markMessageAsRead: async (messageId: string, swapId: string, userId: string): Promise<Message> => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/messages/${messageId}/read?swap_id=${swapId}&user_id=${userId}`,
        { message_id: messageId }
      );
      return response.data;
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  },

  /**
   * Get unread message count for the user
   */
  getUnreadMessageCount: async (userId: string): Promise<UnreadMessageCount> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/messages/unread?user_id=${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching unread message count:', error);
      throw error;
    }
  },
};

export default messageService;
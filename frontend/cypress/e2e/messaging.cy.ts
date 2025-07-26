// frontend/cypress/e2e/messaging.cy.ts
/**
 * End-to-end tests for the messaging functionality in the clothing swap application
 * 
 * These tests verify the complete messaging workflow from both the requester and owner perspectives,
 * including system messages that appear during swap status changes.
 */

// Utility to intercept API calls for swap messages
const interceptMessageAPIs = () => {
  // Intercept GET calls to fetch messages
  cy.intercept('GET', '/swap/*/messages*', { fixture: 'messages.json' }).as('getMessages');
  
  // Intercept POST calls to send messages
  cy.intercept('POST', '/swap/*/messages*', (req) => {
    const newMessage = {
      message_id: `msg-${Date.now()}`,
      swap_id: req.url.split('/')[2],
      sender_id: 'test-user-123',
      recipient_id: 'test-user-456',
      content: req.body.content,
      timestamp: new Date().toISOString(),
      is_read: false,
      message_type: 'user'
    };
    req.reply({ 
      statusCode: 200,
      body: newMessage
    });
  }).as('sendMessage');
  
  // Intercept PUT calls to mark messages as read
  cy.intercept('PUT', '/*/read', {
    statusCode: 200,
    body: { is_read: true }
  }).as('markAsRead');
  
  // Intercept GET calls for unread message count
  cy.intercept('GET', '/unread*', {
    count: 3,
    swaps: [
      { swap_id: 'test-swap-123', count: 2 },
      { swap_id: 'test-swap-456', count: 1 }
    ]
  }).as('getUnreadCount');
};

describe('Messaging Functionality', () => {
  beforeEach(() => {
    // Login and set user tokens
    cy.login('testuser@example.com', 'password123');
    
    // Set up API intercepts
    interceptMessageAPIs();
  });

  it('allows viewing and sending messages in a swap', () => {
    // Navigate to swap requests page
    cy.visit('/swap-requests');
    cy.wait('@getUnreadCount');
    
    // Find and click on a swap with unread messages
    cy.get('[data-testid="unread-badge"]').should('contain', '2');
    cy.contains('Test Item Swap').click();
    
    // Wait for messages to load
    cy.wait('@getMessages');
    
    // Verify messages are displayed
    cy.get('[data-testid^="message-"]').should('have.length.at.least', 2);
    cy.contains('Hello! Is this item still available?').should('be.visible');
    cy.contains('The swap request has been accepted.').should('be.visible');
    
    // Verify that unread messages are automatically marked as read
    cy.wait('@markAsRead');
    
    // Type and send a new message
    cy.get('textarea[placeholder="Type your message..."]').type('Yes, it is still available and in good condition!');
    cy.get('button[aria-label="Send message"]').click();
    
    // Wait for the message to be sent
    cy.wait('@sendMessage');
    
    // Verify the new message appears in the list
    cy.contains('Yes, it is still available and in good condition!').should('be.visible');
  });

  it('displays system messages when swap status changes', () => {
    // Set up intercept for swap status change
    cy.intercept('PUT', '/swaps/*', (req) => {
      // Mock the response for swap status change
      req.reply({
        statusCode: 200,
        body: {
          swap_id: 'test-swap-123',
          status: 'accepted',
          // Other swap properties...
        }
      });
      
      // After status change, the API would typically create a system message
      // We'll simulate this by setting up a new intercept for the next message fetch
      cy.intercept('GET', '/swap/*/messages*', {
        fixture: 'messages_with_status_change.json'
      }).as('getMessagesAfterStatusChange');
    }).as('updateSwapStatus');
    
    // Navigate to the swap detail page
    cy.visit('/swaps/test-swap-123');
    cy.wait('@getMessages');
    
    // Accept the swap
    cy.contains('button', 'Accept Swap').click();
    cy.wait('@updateSwapStatus');
    
    // Wait for messages to reload with the system message
    cy.wait('@getMessagesAfterStatusChange');
    
    // Verify the system message about status change appears
    cy.contains('The swap request has been accepted').should('be.visible');
    
    // Verify the system message has different styling
    cy.contains('The swap request has been accepted')
      .closest('[data-testid^="message-"]')
      .should('have.class', 'system-message');
  });

  it('shows unread message count indicators', () => {
    // Navigate to home page
    cy.visit('/');
    cy.wait('@getUnreadCount');
    
    // Verify the global unread count badge
    cy.get('[data-testid="global-unread-badge"]').should('contain', '3');
    
    // Navigate to swap requests page
    cy.visit('/swap-requests');
    cy.wait('@getUnreadCount');
    
    // Verify individual swap unread count badges
    cy.get('[data-testid="swap-test-swap-123"] [data-testid="unread-badge"]')
      .should('contain', '2');
      
    cy.get('[data-testid="swap-test-swap-456"] [data-testid="unread-badge"]')
      .should('contain', '1');
  });

  it('handles error states gracefully', () => {
    // Set up error intercepts
    cy.intercept('GET', '/swap/*/messages*', {
      statusCode: 500,
      body: { detail: 'Internal server error' }
    }).as('getMessagesError');
    
    // Navigate to swap detail page
    cy.visit('/swaps/test-swap-123');
    cy.wait('@getMessagesError');
    
    // Verify error message is displayed
    cy.contains('Failed to load messages. Please try again later.')
      .should('be.visible');
      
    // Set up error intercept for sending message
    cy.intercept('POST', '/swap/*/messages*', {
      statusCode: 500,
      body: { detail: 'Error sending message' }
    }).as('sendMessageError');
    
    // Try to send a message
    cy.get('textarea[placeholder="Type your message..."]').type('Test message with error');
    cy.get('button[aria-label="Send message"]').click();
    cy.wait('@sendMessageError');
    
    // Verify error message for sending
    cy.contains('Failed to send message. Please try again.')
      .should('be.visible');
  });
});
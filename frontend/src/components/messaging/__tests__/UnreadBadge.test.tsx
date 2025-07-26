import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChakraProvider } from '@chakra-ui/react';
import UnreadBadge from '../UnreadBadge';

describe('UnreadBadge Component', () => {
  it('renders correctly with count', () => {
    render(
      <ChakraProvider>
        <UnreadBadge count={5} />
      </ChakraProvider>
    );
    
    // Check if the badge is rendered with the correct count
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('applies proper styling for badge', () => {
    const { container } = render(
      <ChakraProvider>
        <UnreadBadge count={5} />
      </ChakraProvider>
    );
    
    // Check for styling elements (these checks will depend on actual implementation)
    // For example, if using Chakra's Badge component
    const badge = screen.getByText('5');
    expect(badge).toHaveStyle('background-color: var(--chakra-colors-red-500)');
    expect(badge).toHaveStyle('color: var(--chakra-colors-white)');
    expect(badge).toHaveStyle('border-radius: 9999px'); // for circular badge
  });

  it('hides badge when count is 0', () => {
    const { container } = render(
      <ChakraProvider>
        <UnreadBadge count={0} />
      </ChakraProvider>
    );
    
    // Check that no badge is visible when count is 0
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('caps display at 99+ for large numbers', () => {
    render(
      <ChakraProvider>
        <UnreadBadge count={150} />
      </ChakraProvider>
    );
    
    // Check if the badge shows '99+' for values over 99
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('accepts and applies custom size prop', () => {
    const { container } = render(
      <ChakraProvider>
        <UnreadBadge count={5} size="lg" />
      </ChakraProvider>
    );
    
    // Check that the size prop is applied
    const badge = screen.getByText('5');
    expect(badge).toHaveStyle('font-size: var(--chakra-fontSizes-lg)');
  });

  it('works with custom placement', () => {
    const { container } = render(
      <ChakraProvider>
        <div data-testid="parent">
          <UnreadBadge count={5} placement="top-right" />
        </div>
      </ChakraProvider>
    );
    
    // Check the positioning based on placement prop
    const badge = screen.getByText('5');
    const parentElement = screen.getByTestId('parent');
    
    expect(badge).toHaveStyle('position: absolute');
    expect(badge).toHaveStyle('top: 0');
    expect(badge).toHaveStyle('right: 0');
  });
});
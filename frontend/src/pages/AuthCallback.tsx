import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Spinner, Text, VStack } from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { validateToken } = useAuth();
  const { isDark } = useTheme();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the access token from URL parameters
        // Cognito typically returns tokens in the URL fragment or as query parameters
        const accessToken = searchParams.get('access_token');
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
          setStatus('error');
          setErrorMessage(`Authentication error: ${error}`);
          return;
        }

        if (accessToken) {
          // Direct token from Cognito (implicit flow)
          const isValid = await validateToken(accessToken);
          if (isValid) {
            setStatus('success');
            setTimeout(() => navigate('/gallery'), 1000);
          } else {
            setStatus('error');
            setErrorMessage('Invalid token received');
          }
        } else if (code) {
          // Authorization code flow - need to exchange code for tokens
          // This would typically be handled by your backend
          setStatus('error');
          setErrorMessage('Authorization code flow not implemented yet');
        } else {
          // Check URL fragment for tokens (common with Cognito implicit flow)
          const fragment = window.location.hash.substring(1);
          const params = new URLSearchParams(fragment);
          const fragmentToken = params.get('access_token');

          if (fragmentToken) {
            const isValid = await validateToken(fragmentToken);
            if (isValid) {
              setStatus('success');
              setTimeout(() => navigate('/gallery'), 1000);
            } else {
              setStatus('error');
              setErrorMessage('Invalid token received');
            }
          } else {
            setStatus('error');
            setErrorMessage('No authentication token received');
          }
        }
      } catch (error) {
        console.error('Callback handling error:', error);
        setStatus('error');
        setErrorMessage('Failed to process authentication callback');
      }
    };

    handleCallback();
  }, [searchParams, validateToken, navigate]);

  const getStatusContent = () => {
    switch (status) {
      case 'loading':
        return (
          <>
            <Spinner size="xl" color="gray.500" />
            <Text color={isDark ? 'white' : 'gray.800'}>
              Processing authentication...
            </Text>
          </>
        );
      case 'success':
        return (
          <>
            <Box color="green.500" fontSize="4xl">✓</Box>
            <Text color={isDark ? 'white' : 'gray.800'}>
              Authentication successful! Redirecting...
            </Text>
          </>
        );
      case 'error':
        return (
          <>
            <Box color="red.500" fontSize="4xl">✗</Box>
            <Text color={isDark ? 'white' : 'gray.800'}>
              Authentication failed
            </Text>
            <Text color="red.500" fontSize="sm" textAlign="center">
              {errorMessage}
            </Text>
            <Text 
              color="gray.500" 
              fontSize="sm" 
              cursor="pointer" 
              textDecoration="underline"
              onClick={() => navigate('/login')}
            >
              Return to login
            </Text>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg={isDark ? 'gray.900' : 'gray.50'}
      p={4}
    >
      <Box
        maxW="md"
        w="full"
        bg={isDark ? 'gray.800' : 'white'}
        p={8}
        borderRadius="lg"
        boxShadow="lg"
        border={isDark ? '1px solid' : 'none'}
        borderColor={isDark ? 'gray.600' : 'transparent'}
      >
        <VStack spacing={6} align="center">
          {getStatusContent()}
        </VStack>
      </Box>
    </Box>
  );
};

export default AuthCallback;

import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Heading,
  Flex,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/gallery');
    }
  }, [isAuthenticated, navigate]);

  const handleCognitoLogin = async () => {
    setError('');
    setIsLoading(true);

    try {
      await login();
      // User will be redirected to Cognito hosted UI
    } catch (err) {
      setError('Failed to initiate login. Please try again.');
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <Box
        minH="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg={isDark ? 'gray.900' : 'gray.50'}
      >
        <Text color={isDark ? 'white' : 'gray.800'}>Loading...</Text>
      </Box>
    );
  }

  return (
    <Box
      w="100vw"
      h="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg={isDark ? 'gray.900' : 'gray.50'}
      p={4}
      position="relative"
    >
      <Box position="absolute" top={4} right={4}>
        <ThemeToggle />
      </Box>
      
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
        <VStack spacing={6} align="stretch">
          <VStack spacing={2}>
            <Logo size="lg" showText={true} />
            <Text color="gray.600" textAlign="center">
              Sign in with your AWS Cognito account
            </Text>
          </VStack>

          {error && (
            <Box
              bg="red.50"
              border="1px solid"
              borderColor="red.200"
              borderRadius="md"
              p={3}
            >
              <Text color="red.600" fontSize="sm">
                {error}
              </Text>
            </Box>
          )}

          <VStack spacing={4}>
            <Button
              onClick={handleCognitoLogin}
              colorScheme="gray"
              size="lg"
              w="full"
              isLoading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? 'Redirecting to login...' : 'Sign In with Cognito'}
            </Button>

            <Text color="gray.500" fontSize="sm" textAlign="center">
              You will be redirected to AWS Cognito for secure authentication
            </Text>
          </VStack>
        </VStack>
      </Box>
    </Box>
  );
};

export default Login;

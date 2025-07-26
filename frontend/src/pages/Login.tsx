import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  Heading,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Mock authentication - in real app this would call your backend
    try {
      if (isLogin) {
        // Mock login
        if (email && password) {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          navigate('/gallery');
        } else {
          setError('Please fill in all fields');
        }
      } else {
        // Mock registration
        if (email && password && name) {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          navigate('/gallery');
        } else {
          setError('Please fill in all fields');
        }
      }
    } catch (err) {
      setError('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="gray.50"
      p={4}
    >
      <Box
        maxW="md"
        w="full"
        bg="white"
        p={8}
        borderRadius="lg"
        boxShadow="lg"
      >
        <VStack spacing={6} align="stretch">
          <VStack spacing={2}>
            <Heading size="lg" color="green.500">
              ClothingSwap
            </Heading>
            <Text color="gray.600" textAlign="center">
              {isLogin ? 'Sign in to your account' : 'Create a new account'}
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

          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              {!isLogin && (
                <Box w="full">
                  <Text mb={2} fontWeight="medium">Full Name</Text>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </Box>
              )}

              <Box w="full">
                <Text mb={2} fontWeight="medium">Email</Text>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </Box>

              <Box w="full">
                <Text mb={2} fontWeight="medium">Password</Text>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </Box>

              <Button
                type="submit"
                colorScheme="green"
                size="lg"
                w="full"
                isLoading={isLoading}
                disabled={isLoading}
              >
                {isLoading 
                  ? (isLogin ? 'Signing in...' : 'Creating account...') 
                  : (isLogin ? 'Sign In' : 'Create Account')
                }
              </Button>
            </VStack>
          </form>

          <HStack justify="center" spacing={1}>
            <Text color="gray.600">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
            </Text>
            <Text
              color="green.500"
              fontWeight="semibold"
              onClick={() => setIsLogin(!isLogin)}
              cursor="pointer"
              _hover={{ textDecoration: 'underline' }}
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </Text>
          </HStack>
        </VStack>
      </Box>
    </Box>
  );
};

export default Login;

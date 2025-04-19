import React from 'react';
import { Box, Text, Button } from '@chakra-ui/react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to an error reporting service
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI when an error occurs
      return (
        <Box 
          p={4} 
          borderRadius="md" 
          bg="rgba(255, 0, 0, 0.1)" 
          borderLeft="4px solid red"
          my={4}
        >
          <Text fontWeight="bold" mb={2}>Something went wrong</Text>
          <Text fontSize="sm" mb={3}>
            {this.state.error && this.state.error.toString()}
          </Text>
          <Button 
            size="sm" 
            colorScheme="red" 
            onClick={() => window.location.reload()}
          >
            Reload Page
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

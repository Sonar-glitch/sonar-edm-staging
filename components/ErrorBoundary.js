import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by ErrorBoundary:", error?.message || error?.toString() || 'Unknown error', JSON.stringify(errorInfo));
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          backgroundColor: '#1e1e2f',
          borderRadius: '10px',
          color: 'white',
          textAlign: 'center'
        }}>
          <h3>Something went wrong</h3>
          <p>{this.state.error?.message || 'An error occurred'}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              backgroundColor: '#ff00ff',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '5px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

/**
 * ErrorBoundary Component
 * 
 * Error boundary for catching and gracefully handling React component errors.
 * Displays user-friendly error messages instead of crashing the entire app.
 * 
 * Features:
 * - Catches React render errors
 * - Logs errors for debugging
 * - Displays helpful error message UI
 * - Allows users to attempt recovery
 */

import React from 'react';
import { AlertCircle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  /**
   * Initialize error boundary state
   * @param {Object} props - Component props
   */
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  /**
   * Update state when error is caught
   * @param {Error} error - The error that was thrown
   * @returns {Object} New state object
   */
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  /**
   * Log error details for debugging
   * @param {Error} error - The error that was thrown
   * @param {Object} errorInfo - Object with componentStack key
   */
  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Could send to error logging service here
    // Example: logErrorToService(error, errorInfo);
  }

  /**
   * Reset error state to recover
   */
  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] text-white px-4">
          <div className="glass-dark rounded-2xl p-8 max-w-md w-full border border-red-500/20">
            <div className="flex items-center justify-center w-12 h-12 bg-red-500/10 rounded-xl mb-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            
            <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
            
            <p className="text-gray-300 text-sm mb-6">
              We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6 text-xs text-gray-300 max-h-40 overflow-y-auto">
                <p className="font-mono font-bold text-red-400 mb-2">Error Details:</p>
                <p>{this.state.error.toString()}</p>
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-lg transition-colors"
              aria-label="Try again"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

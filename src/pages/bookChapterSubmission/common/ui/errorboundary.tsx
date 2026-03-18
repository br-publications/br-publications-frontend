import React, { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import styles from './errorBoundary.module.css';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      errorInfo,
    });

    // Log to console in development
    if (import.meta.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo);
    }

    // Call optional callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className={styles.container}>
          <div className={styles.errorBox}>
            <AlertCircle className={styles.icon} size={32} />
            <h1 className={styles.title}>Oops! Something went wrong</h1>
            <p className={styles.message}>
              We're sorry, but something unexpected happened. Our team has been notified.
            </p>

            {import.meta.env.NODE_ENV === 'development' && this.state.error && (
              <details className={styles.details}>
                <summary className={styles.summary}>Error Details (Development Only)</summary>
                <pre className={styles.errorText}>
                  {this.state.error.toString()}
                  {'\n\n'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className={styles.actions}>
              <button
                className={styles.primaryButton}
                onClick={this.resetError}
              >
                <RefreshCw size={14} />
                Try Again
              </button>
              <button
                className={styles.secondaryButton}
                onClick={() => (window.location.href = '/')}
              >
                <Home size={14} />
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
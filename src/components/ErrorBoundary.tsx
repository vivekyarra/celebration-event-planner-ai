import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('CelebriteAI ErrorBoundary caught an unhandled error:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="section-card"
          style={{
            margin: '32px auto',
            maxWidth: '640px',
            textAlign: 'center',
            padding: '40px 24px',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            background: 'rgba(239, 68, 68, 0.05)',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              padding: '16px',
              borderRadius: '9999px',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              marginBottom: '16px',
            }}
          >
            <AlertTriangle size={36} aria-hidden="true" />
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px', color: '#f8fafc' }}>
            Something went wrong in CelebriteAI
          </h2>

          <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '20px', maxWidth: '480px', margin: '0 auto 24px' }}>
            An unexpected error occurred while rendering this celebration module. Your event plan data is safely stored in local memory.
          </p>

          {this.state.error && (
            <div
              style={{
                textAlign: 'left',
                background: 'rgba(15, 23, 42, 0.8)',
                padding: '12px 16px',
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                color: '#f87171',
                marginBottom: '24px',
                maxHeight: '120px',
                overflowY: 'auto',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}
            >
              {this.state.error.message || String(this.state.error)}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={this.handleReset}
              aria-label="Retry loading celebration module"
            >
              <RefreshCw size={16} aria-hidden="true" />
              <span>Retry Module</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={this.handleReload}
              aria-label="Reload entire application"
            >
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

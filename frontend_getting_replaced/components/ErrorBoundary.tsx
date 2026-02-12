
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { db } from '../services/db';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    
    // Log to backend
    db.logClientError({
      level: 'CRITICAL',
      message: error.message,
      stack_trace: error.stack,
      context: {
        componentStack: errorInfo.componentStack,
        url: window.location.href,
        userAgent: navigator.userAgent
      }
    }).catch(err => console.error('Failed to log error to backend:', err));
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-300">
            <div className="flex justify-center">
              <div className="bg-red-50 p-6 rounded-full">
                <AlertTriangle className="w-16 h-16 text-red-500" strokeWidth={1.5} />
              </div>
            </div>
            
            <div className="space-y-3">
              <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Application Error</h1>
              <p className="text-gray-500 leading-relaxed">
                Something went wrong while rendering this page. The error has been logged and our team will investigate.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-gray-50 p-4 rounded-sm border border-gray-200 text-left overflow-auto max-h-40">
                <p className="text-[10px] font-mono text-red-600 break-all whitespace-pre-wrap">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={this.handleReload}
                className="flex-1 bg-black text-white px-6 py-4 text-xs font-bold uppercase tracking-widest hover:bg-[#ff4d00] transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} /> Reload Page
              </button>
              <button 
                onClick={this.handleReset}
                className="flex-1 bg-white border border-gray-200 text-gray-900 px-6 py-4 text-xs font-bold uppercase tracking-widest hover:border-black transition-all flex items-center justify-center gap-2"
              >
                <Home size={16} /> Return Home
              </button>
            </div>
            
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest pt-8">
              System ID: {Math.random().toString(36).substring(7).toUpperCase()}
            </p>
          </div>
        </div>
      );
    }

    return this.children;
  }
}

export default ErrorBoundary;

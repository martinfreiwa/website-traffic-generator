import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { db } from './services/db';

// Global error handlers
window.onerror = (message, source, lineno, colno, error) => {
  console.error('Global Error:', message);
  try {
    db.logClientError({
        level: 'ERROR',
        message: String(message),
        stack_trace: error?.stack,
        context: { source, lineno, colno, url: window.location.href }
    }).catch(() => {});
  } catch(e) {}
};

window.onunhandledrejection = (event) => {
  console.error('Unhandled Rejection:', event.reason);
  try {
    db.logClientError({
        level: 'ERROR',
        message: `Unhandled Rejection: ${event.reason?.message || String(event.reason)}`,
        stack_trace: event.reason?.stack,
        context: { url: window.location.href }
    }).catch(() => {});
  } catch(e) {}
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <HelmetProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </HelmetProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
}
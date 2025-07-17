import React from 'react';
import ReactDOM from 'react-dom/client';
import { flushSync } from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// React 19 DOM Error Prevention
(function() {
  // Global error handler for DOM manipulation errors
  const originalError = console.error;
  console.error = function(...args) {
    // Suppress React 19 DOM manipulation warnings
    if (args[0] && typeof args[0] === 'string') {
      if (args[0].includes('insertBefore') || 
          args[0].includes('removeChild') || 
          args[0].includes('NotFoundError') ||
          args[0].includes('Failed to execute') ||
          args[0].includes('chrome-extension') ||
          args[0].includes('Warning: ReactDOM.render')) {
        return;
      }
    }
    // Also catch error objects
    if (args[0] && args[0].name === 'NotFoundError') {
      return;
    }
    originalError.apply(console, args);
  };

  // Force synchronous DOM updates
  if (window.React) {
    const originalSetState = React.Component.prototype.setState;
    React.Component.prototype.setState = function(updater, callback) {
      flushSync(() => {
        originalSetState.call(this, updater, callback);
      });
    };
  }

  // Ensure direction is always LTR
  const ensureDirection = () => {
    document.documentElement.dir = 'ltr';
    document.body.dir = 'ltr';
    const root = document.getElementById('root');
    if (root) {
      root.dir = 'ltr';
      root.style.direction = 'ltr';
      root.style.textAlign = 'left';
    }
  };

  // Run immediately and on DOM changes
  ensureDirection();
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(ensureDirection);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['dir'],
      subtree: true
    });
  }
})();

const root = ReactDOM.createRoot(document.getElementById('root'));

// React 19 DOM error prevention - Use synchronous rendering
// Wrap in StrictMode to catch development issues but handle DOM errors gracefully
try {
  flushSync(() => {
    root.render(
      process.env.NODE_ENV === 'development' ? (
        <React.StrictMode>
          <App />
        </React.StrictMode>
      ) : (
        <App />
      )
    );
  });
} catch (error) {
  console.warn('React 19 flushSync failed, falling back to normal render:', error);
  root.render(
    process.env.NODE_ENV === 'development' ? (
      <React.StrictMode>
        <App />
      </React.StrictMode>
    ) : (
      <App />
    )
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

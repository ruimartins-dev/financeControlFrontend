import React, { useState, useEffect, useCallback } from 'react';

/**
 * Toast Component Props
 */
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number; // Duration in milliseconds (default: 3000)
}

/**
 * Toast Component
 * Displays a temporary notification message
 */
export const Toast: React.FC<ToastProps> = ({
  message,
  type,
  onClose,
  duration = 3000,
}) => {
  // Auto-dismiss the toast after the duration
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  // Determine background color based on type
  const getBackgroundColor = (): string => {
    switch (type) {
      case 'success':
        return '#4caf50';
      case 'error':
        return '#f44336';
      case 'info':
        return '#2196f3';
      default:
        return '#333';
    }
  };

  return (
    <div
      className="toast"
      style={{
        backgroundColor: getBackgroundColor(),
      }}
    >
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={onClose}>
        ×
      </button>
    </div>
  );
};

/**
 * Toast state interface
 */
interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
}

/**
 * Custom hook for managing toast notifications
 * Returns: [toast state, show toast function, hide toast function]
 */
export const useToast = (): [
  ToastState | null,
  (message: string, type: 'success' | 'error' | 'info') => void,
  () => void
] => {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info') => {
      setToast({ message, type });
    },
    []
  );

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return [toast, showToast, hideToast];
};

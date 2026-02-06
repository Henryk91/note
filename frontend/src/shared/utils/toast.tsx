import React from 'react';
import toast, { Toast } from 'react-hot-toast';

/**
 * Custom toast component with working close button
 */
const CustomToast = ({ t, message, type }: { t: Toast; message: string; type: 'success' | 'error' | 'loading' }) => {
  const icons = {
    success: '✓',
    error: '✕',
    loading: '⟳',
  };

  const colors = {
    success: '#10b981',
    error: '#ef4444',
    loading: '#3b82f6',
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: '#363636',
        color: '#fff',
        padding: '12px 16px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        maxWidth: '400px',
        minWidth: '300px',
      }}
    >
      <div
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: colors[type],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          fontWeight: 'bold',
          flexShrink: 0,
        }}
      >
        {icons[type]}
      </div>
      <div style={{ flex: 1, fontSize: '14px' }}>{message}</div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          toast.dismiss(t.id);
        }}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#9ca3af',
          cursor: 'pointer',
          fontSize: '20px',
          padding: '4px',
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'color 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#fff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#9ca3af';
        }}
        aria-label="Close notification"
        type="button"
      >
        ×
      </button>
    </div>
  );
};

/**
 * Toast notification utilities with working close buttons
 */
export const toastNotifications = {
  success: (message: string) => {
    toast.custom((t) => <CustomToast t={t} message={message} type="success" />, {
      duration: 3000,
      position: 'top-right',
    });
  },

  error: (message: string) => {
    toast.custom((t) => <CustomToast t={t} message={message} type="error" />, {
      duration: 5000,
      position: 'top-right',
    });
  },

  loading: (message: string) => {
    return toast.custom((t) => <CustomToast t={t} message={message} type="loading" />, {
      position: 'top-right',
      duration: Infinity,
    });
  },

  dismiss: (toastId: string) => {
    toast.dismiss(toastId);
  },

  dismissAll: () => {
    toast.dismiss();
  },
};

/**
 * Promise-based toast notification
 */
export function toastPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string;
    error: string;
  },
) {
  return toast.promise(promise, messages, {
    position: 'top-right',
  });
}

/**
 * Format API errors for user-friendly display
 */
export function formatApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
}

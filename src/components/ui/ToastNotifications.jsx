import React from 'react';
import { Toaster } from 'react-hot-toast';

export default function ToastNotifications() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        className: '!bg-brand-card !text-brand-text !border !border-brand-muted/20 !shadow-2xl !rounded-xl font-medium',
        style: {
          padding: '16px',
        },
        success: {
          iconTheme: {
            primary: '#10B981', // green-500
            secondary: 'white',
          },
        },
        error: {
          iconTheme: {
            primary: '#EF4444', // red-500
            secondary: 'white',
          },
        },
      }}
    />
  );
}
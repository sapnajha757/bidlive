import React from 'react';

// Reusable Loading Spinner component
export default function Loading({ message = 'Loading auctions...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      <p className="mt-3 text-sm text-gray-600 font-medium">{message}</p>
    </div>
  );
}

import React from 'react';

// Reusable Button Component with customizable styles
export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  fullWidth = false,
  className = '',
}) {
  // Define styles based on variant
  const baseStyles = 'px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';
  
  let variantStyles = '';
  if (variant === 'primary') {
    variantStyles = 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500';
  } else if (variant === 'secondary') {
    variantStyles = 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500';
  } else if (variant === 'success') {
    variantStyles = 'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500';
  } else if (variant === 'danger') {
    variantStyles = 'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500';
  } else if (variant === 'outline') {
    variantStyles = 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-indigo-500';
  }

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles} ${widthStyle} ${className}`}
    >
      {children}
    </button>
  );
}

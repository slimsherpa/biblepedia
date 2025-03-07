'use client';

import React, { ReactNode } from 'react';

interface SafeRenderProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * A component that safely renders its children, catching any rendering errors
 * and displaying a fallback UI instead.
 */
const SafeRender: React.FC<SafeRenderProps> = ({ children, fallback }) => {
  try {
    // Attempt to render the children
    return <>{children}</>;
  } catch (error) {
    console.error('SafeRender caught an error:', error);
    
    // Return fallback UI if provided, otherwise a default error message
    return fallback || (
      <div className="p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
        Error rendering content
      </div>
    );
  }
};

/**
 * Safely converts any value to a string for rendering
 */
export function safeRenderValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (typeof value === 'string') {
    return value;
  }
  
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  
  // For objects, arrays, etc.
  try {
    return JSON.stringify(value);
  } catch {
    return '[Object]';
  }
}

export default SafeRender; 
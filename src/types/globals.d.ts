/**
 * Global type declarations
 */

export {};

declare global {
  interface Window {
    // Extend window object with custom properties as needed
    // Example: customProperty?: string;
  }

  // Generic API response type
  type ApiResponse<T = unknown> = 
    | { success: true; data: T }
    | { success: false; error: string };

  // Common ID type
  type ID = string;

  // Status types
  type Status = 'pending' | 'loading' | 'success' | 'error';
  
  // User role enum
  type UserRole = 'admin' | 'user' | 'guest';
}
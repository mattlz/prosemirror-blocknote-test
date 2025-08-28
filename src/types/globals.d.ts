/**
 * Global type declarations
 */

export {};

declare global {
  interface Window {
    /** Optional custom property placeholder to satisfy empty interface rule. */
    __appReserved__?: unknown;
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

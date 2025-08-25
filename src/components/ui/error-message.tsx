/**
 * ErrorMessage - Reusable error display component
 */

import { memo } from "react";

interface ErrorMessageProps {
  error: string | Error;
  className?: string;
  variant?: "inline" | "banner";
}

/**
 * ErrorMessage component for displaying error states
 * 
 * @param error - Error message or Error object to display
 * @param className - Additional CSS classes
 * @param variant - Display style variant
 */
export const ErrorMessage = memo(function ErrorMessage({ 
  error, 
  className = "",
  variant = "inline"
}: ErrorMessageProps) {
  const errorText = typeof error === "string" ? error : error.message;
  
  const baseClasses = "text-sm text-red-600";
  const variantClasses = {
    inline: "bg-red-50 p-2 rounded",
    banner: "bg-red-50 border border-red-200 p-4 rounded-lg",
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {errorText}
    </div>
  );
});
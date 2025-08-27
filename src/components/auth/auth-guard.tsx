"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode, useState, useRef } from "react";

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const currentUser = useQuery(api.users.current);
  const router = useRouter();
  const [authState, setAuthState] = useState<'loading' | 'authenticated' | 'unauthenticated' | 'redirecting'>('loading');
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Add console logging for debugging auth state
    console.log("[AuthGuard] Auth check:", {
      currentUser,
      isLoading: currentUser === undefined,
      isAuthenticated: currentUser !== null,
      authState,
    });

    // Clear any existing redirect timeout
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
      redirectTimeoutRef.current = null;
    }

    // Wait for the query to complete before making auth decisions
    if (currentUser === undefined) {
      console.log("[AuthGuard] Still loading auth state...");
      setAuthState('loading');
      return; // Still loading, don't make any decisions yet
    }

    // We have a definitive result
    if (currentUser === null) {
      console.log("[AuthGuard] User not authenticated, will redirect after delay");
      setAuthState('unauthenticated');
      
      // Add a small delay before redirect to ensure the auth check is truly complete
      redirectTimeoutRef.current = setTimeout(() => {
        console.log("[AuthGuard] Executing redirect to signin");
        setAuthState('redirecting');
        router.replace("/signin");
      }, 100); // 100ms delay to ensure auth state is stable
    } else {
      console.log("[AuthGuard] User authenticated:", {
        id: currentUser._id,
        email: currentUser.email,
      });
      setAuthState('authenticated');
    }
  }, [currentUser, router]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  // Show loading state while checking auth OR when unauthenticated (before redirect)
  if (authState === 'loading') {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-black"></div>
          <p className="mt-4 text-sm text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show loading state while unauthenticated but before redirect
  if (authState === 'unauthenticated') {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-black"></div>
          <p className="mt-4 text-sm text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Show redirecting state
  if (authState === 'redirecting') {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-gray-600">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  // User is authenticated, render children
  return <>{children}</>;
}
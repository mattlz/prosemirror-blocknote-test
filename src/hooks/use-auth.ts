'use client';

import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useCurrentUser() {
  return useQuery(api.auth.getCurrentUser);
}

export function useAuth() {
  const { signIn, signOut } = useAuthActions();
  const user = useCurrentUser();

  return {
    user,
    isLoading: user === undefined,
    isAuthenticated: !!user,
    signIn,
    signOut,
  } as const;
}



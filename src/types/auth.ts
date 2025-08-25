import type { Id } from '@/convex/_generated/dataModel';

export interface User {
  _id: Id<"users">;
  email: string;
  name?: string;
  role?: 'admin' | 'user';
  status?: 'active' | 'inactive' | 'invited';
  createdAt?: number;
  updatedAt?: number;
}

export interface AuthUser {
  userId: string;
  email: string;
  name?: string;
}

export interface AuthState {
	isAuthenticated: boolean;
}

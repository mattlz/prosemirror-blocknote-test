import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth, modifyAccountCredentials } from "@convex-dev/auth/server";
import { DataModel } from "./_generated/dataModel";
import { query, mutation, action, internalMutation } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';



// Configure the Password provider with custom profile
const PasswordProvider = Password<DataModel>({
  profile(params) {
    return {
      email: params.email as string,
      name: params.name as string,
      role: "pm" as const, // Default role for new users
      status: "active" as const, // Default status for new users
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  },
  validatePasswordRequirements(password) {
    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters long");
    }
  },
});

// Export the Convex Auth configuration
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [PasswordProvider],
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      if (args.existingUserId) {
        return args.existingUserId;
      }

      // Always check if we have an existing user with this email first
      const email = args.profile.email as string;
      if (!email) {
        throw new Error('Email is required');
      }
      
      const existingUser = await ctx.db
        .query('users')
        .filter((q) => q.eq(q.field('email'), email))
        .first();
      
      if (existingUser) {
        // Update the existing user and activate
        await ctx.db.patch(existingUser._id, {
          status: 'active',
          updatedAt: Date.now(),
        });
        return existingUser._id;
      }

      // Create new user if none exists (normal sign-up flow)
      return await ctx.db.insert('users', {
        email: email,
        name: args.profile.name as string,
        role: args.profile.role as any || 'pm',
        status: 'active',
        organizationId: undefined, // Will be set later if needed
        themePreference: 'system',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    },
  },
});

// Query to get current user
export const getCurrentUser = query({
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;
    
    return await ctx.db.get(userId);
  },
});

// Mutation to create or update user profile
export const createOrUpdateUser = mutation({
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }
    
    // Get the current user
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  },
});

// Query to get user by ID
export const getUserById = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// Mutation to update user role (for development testing)
export const updateUserRole = mutation({
  args: { 
    role: v.union(
      v.literal('admin'),
      v.literal('pm'),
      v.literal('task_owner'),
      v.literal('client')
    )
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }
    
    // Update the user's role
    const updatedUser = await ctx.db.patch(userId, {
      role: args.role,
      updatedAt: Date.now(),
    });
    
    return updatedUser;
  },
});


// Helper function to validate password strength
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors = [];
  if (password.length < 8) errors.push("At least 8 characters");
  if (!/[A-Z]/.test(password)) errors.push("One uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("One lowercase letter");
  if (!/[0-9]/.test(password)) errors.push("One number");
  return { valid: errors.length === 0, errors };
}

 
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { DataModel } from "./_generated/dataModel";
import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

const PasswordProvider = Password<DataModel>({
    profile(params) {
      return {
        email: params.email as string,
        name: params.name as string,
        role: "user", // Default role
        status: "active" as const,
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
  
  export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
    providers: [PasswordProvider],
    callbacks: {
      async createOrUpdateUser(ctx, args) {
        if (args.existingUserId) {
          return args.existingUserId;
        }
  
        const email = args.profile.email as string;
        if (!email) {
          throw new Error('Email is required');
        }
  
        const existingUser = await ctx.db
          .query('users')
          .filter((q) => q.eq(q.field('email'), email))
          .first();
  
        if (existingUser) {
          await ctx.db.patch(existingUser._id, {
            status: 'active',
            updatedAt: Date.now(),
          });
          return existingUser._id;
        }
  
        return await ctx.db.insert('users', {
          email: email,
          name: args.profile.name as string,
          role: (args.profile as any).role || 'user',
          status: 'active',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      },
    },
  });
  
  export const getCurrentUser = query({
    handler: async (ctx) => {
      const userId = await auth.getUserId(ctx);
      if (!userId) return null;
      return await ctx.db.get(userId);
    },
  });

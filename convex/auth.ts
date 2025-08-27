import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { DataModel } from "./_generated/dataModel";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password<DataModel>({
      profile(params) {
        return {
          email: params.email as string,
          name: params.name as string,
        };
      },
    }),
  ],
  session: {
    totalDurationMs: 1000 * 60 * 60 * 24 * 30, // 30 days
    inactiveDurationMs: 1000 * 60 * 60 * 24 * 7, // 7 days of inactivity
  },
});

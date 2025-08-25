import { mutation } from "./_generated/server";

export const backfillUsers = mutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    let patched = 0;
    for (const user of users) {
      const updates: Record<string, unknown> = {};
      if (user.createdAt === undefined) updates.createdAt = Date.now();
      if (user.updatedAt === undefined) updates.updatedAt = Date.now();
      if ((user as any).name === undefined) updates.name = (user as any).email?.split("@")[0] ?? "User";
      if ((user as any).role === undefined) updates.role = "user";
      if ((user as any).status === undefined) updates.status = "active";
      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(user._id, updates);
        patched++;
      }
    }
    return { patched };
  },
});



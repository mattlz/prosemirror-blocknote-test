import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const heartbeat = mutation({
	args: {
		docId: v.string(),
		cursor: v.string(),
		name: v.optional(v.string()),
		color: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (userId === null) {
			throw new Error("Unauthenticated");
		}
		const user = await ctx.db.get(userId);
		const name = args.name ?? (user as any)?.email ?? "User";
		const color = args.color ?? "#10b981";
		const now = Date.now();
		const existing = await ctx.db
			.query("presence")
			.withIndex("by_doc_user", q => q.eq("docId", args.docId).eq("userId", userId))
			.first();
		if (existing) {
			await ctx.db.patch(existing._id, { cursor: args.cursor, updatedAt: now, name, color });
		} else {
			await ctx.db.insert("presence", { docId: args.docId, userId, name, color, cursor: args.cursor, updatedAt: now });
		}
	},
});

export const list = query({
	args: { docId: v.string() },
	handler: async (ctx, { docId }) => {
		const cutoff = Date.now() - 15000;
		const rows = await ctx.db
			.query("presence")
			.withIndex("by_doc", q => q.eq("docId", docId))
			.collect();
		return rows.filter(r => r.updatedAt >= cutoff).map(r => ({ userId: r.userId, name: r.name, color: r.color, cursor: r.cursor }));
	},
});

export const cleanup = internalMutation({
	args: { olderThanMs: v.number() },
	handler: async (ctx, { olderThanMs }) => {
		const cutoff = Date.now() - olderThanMs;
		const rows = await ctx.db.query("presence").collect();
		await Promise.all(rows.filter(r => r.updatedAt < cutoff).map(r => ctx.db.delete(r._id)));
	},
});

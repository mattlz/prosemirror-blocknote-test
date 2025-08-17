import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return { userId: null } as const;
    return { userId } as const;
  },
});

export const resolveUsers = query({
  args: { ids: v.array(v.string()) },
  handler: async (ctx, { ids }) => {
    const unique = Array.from(new Set(ids.filter(Boolean)));
    const docs = await Promise.all(unique.map(async (id) => {
      try {
        const user = await ctx.db.get(id as any);
        return user ? { id, username: (user as any).email ?? "User", avatarUrl: "" } : null;
      } catch {
        return null;
      }
    }));
    return docs.filter(Boolean);
  },
});

export const listByDoc = query({
  args: { docId: v.string(), includeResolved: v.optional(v.boolean()) },
  handler: async (ctx, { docId, includeResolved }) => {
    const threads = await ctx.db
      .query("commentThreads")
      .withIndex("by_doc", (q) => q.eq("docId", docId))
      .collect();
    const visibleThreads = includeResolved ? threads : threads.filter((t) => !t.resolved);
    const results = await Promise.all(
      visibleThreads.map(async (t) => {
        const comments = await ctx.db
          .query("comments")
          .withIndex("by_thread", (q) => q.eq("threadId", t.id))
          .collect();
        comments.sort((a, b) => a.createdAt - b.createdAt);
        return { thread: t, comments };
      })
    );
    return results;
  },
});

export const listByThread = query({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_thread", (q) => q.eq("threadId", threadId))
      .collect();
    comments.sort((a, b) => a.createdAt - b.createdAt);
    return comments;
  },
});

export const getThread = query({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    const thread = (await ctx.db
      .query("commentThreads")
      .collect()).find((t) => t.id === threadId);
    if (!thread) return null;
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_thread", (q) => q.eq("threadId", threadId))
      .collect();
    comments.sort((a, b) => a.createdAt - b.createdAt);
    return { thread, comments };
  },
});

export const createThread = mutation({
  args: { docId: v.string(), blockId: v.string(), content: v.string() },
  handler: async (ctx, { docId, blockId, content }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Unauthenticated");
    const now = Date.now();
    const threadId = `${now}-${Math.random().toString(36).slice(2, 10)}`;
    await ctx.db.insert("commentThreads", { id: threadId, docId, blockId, createdAt: now, resolved: false, creatorId: userId });
    await ctx.db.insert("comments", {
      docId,
      blockId,
      threadId,
      content,
      authorId: userId,
      createdAt: now,
      updatedAt: now,
    });
    return { threadId };
  },
});

export const createComment = mutation({
  args: { docId: v.string(), blockId: v.string(), threadId: v.string(), content: v.string() },
  handler: async (ctx, { docId, blockId, threadId, content }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Unauthenticated");
    const now = Date.now();
    const thread = (await ctx.db
      .query("commentThreads")
      .withIndex("by_doc", (q) => q.eq("docId", docId))
      .collect()).find((t) => t.id === threadId);
    if (!thread) throw new Error("Thread not found");
    if (thread.blockId !== blockId) {
      // Ensure the thread belongs to the provided block
      throw new Error("Invalid block for thread");
    }
    const inserted = await ctx.db.insert("comments", {
      docId,
      blockId,
      threadId,
      content,
      authorId: userId,
      createdAt: now,
      updatedAt: now,
    });
    return inserted;
  },
});

export const replyToComment = mutation({
  args: { parentCommentId: v.id("comments"), content: v.string() },
  handler: async (ctx, { parentCommentId, content }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Unauthenticated");
    const parent = await ctx.db.get(parentCommentId);
    if (!parent) throw new Error("Parent comment not found");
    const now = Date.now();
    return await ctx.db.insert("comments", {
      docId: parent.docId,
      blockId: parent.blockId,
      threadId: parent.threadId,
      content,
      authorId: userId,
      createdAt: now,
      updatedAt: now,
      parentCommentId: parentCommentId,
    });
  },
});

export const updateComment = mutation({
  args: { commentId: v.id("comments"), content: v.string() },
  handler: async (ctx, { commentId, content }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Unauthenticated");
    const existing = await ctx.db.get(commentId);
    if (!existing) throw new Error("Comment not found");
    if (existing.authorId !== userId) throw new Error("Forbidden");
    await ctx.db.patch(commentId, { content, updatedAt: Date.now() });
  },
});

export const deleteComment = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, { commentId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Unauthenticated");
    const existing = await ctx.db.get(commentId);
    if (!existing) throw new Error("Comment not found");
    if (existing.authorId !== userId) throw new Error("Forbidden");
    await ctx.db.delete(commentId);
  },
});

export const resolveThread = mutation({
  args: { threadId: v.string(), resolved: v.optional(v.boolean()) },
  handler: async (ctx, { threadId, resolved }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Unauthenticated");
    const thread = (await ctx.db.query("commentThreads").collect()).find((t) => t.id === threadId);
    if (!thread) throw new Error("Thread not found");
    if (thread.creatorId && thread.creatorId !== userId) throw new Error("Forbidden");
    const newResolved = resolved ?? true;
    // Update thread resolved flag
    await ctx.db.patch(thread._id, { resolved: newResolved });
    // Optionally mark each comment
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_thread", (q) => q.eq("threadId", threadId))
      .collect();
    await Promise.all(comments.map((c) => ctx.db.patch(c._id, { resolved: newResolved })));
  },
});



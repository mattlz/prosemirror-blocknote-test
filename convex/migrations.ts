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


// Add after backfillUsers export:
export const backfillCommentTargets = mutation({
  args: {},
  handler: async (ctx) => {
    // Backfill threads
    const threads = await ctx.db.query("commentThreads").collect();
    let threadsPatched = 0;
    for (const t of threads) {
      const needs = (t as any).targetType === undefined || (t as any).targetId === undefined;
      if (needs) {
        await ctx.db.patch(t._id, {
          targetType: "doc",
          targetId: t.docId,
        });
        threadsPatched++;
      }
    }

    // Map threads by their custom id field for comment lookup
    const threadMap = new Map(threads.map((t) => [t.id, t]));

    // Backfill comments
    const comments = await ctx.db.query("comments").collect();
    let commentsPatched = 0;
    for (const c of comments) {
      const needs = (c as any).targetType === undefined || (c as any).targetId === undefined;
      if (!needs) continue;

      const owningThread = threadMap.get(c.threadId);
      const targetType = (owningThread as any)?.targetType ?? "doc";
      const targetId = (owningThread as any)?.targetId ?? c.docId;

      await ctx.db.patch(c._id, {
        targetType,
        targetId,
      });
      commentsPatched++;
    }

    return { threadsPatched, commentsPatched };
  },
});

// pages -> documentPages migration has been completed; legacy handler removed.

export const backfillDocumentTemplates = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    // Ensure default template exists
    let blank = await ctx.db
      .query("documentTemplates")
      .withIndex("by_key", q => q.eq("key", "blank"))
      .first();
    if (!blank) {
      const blankId = await ctx.db.insert("documentTemplates", {
        key: "blank",
        name: "Blank",
        description: "A blank document with a single page.",
        structure: undefined,
        initialSnapshot: undefined,
        createdAt: now,
        updatedAt: now,
      } as any);
      blank = await ctx.db.get(blankId);
    }

    // Backfill documents
    const docs = await ctx.db.query("documents").collect();
    let patched = 0;
    for (const d of docs) {
      const needsKey = (d as any).templateKey === undefined || (d as any).templateKey === null;
      const needsId = (d as any).templateId === undefined || (d as any).templateId === null;
      if (needsKey || needsId) {
        await ctx.db.patch(d._id, {
          templateKey: (d as any).templateKey ?? "blank",
          templateId: (d as any).templateId ?? (blank as any)._id,
        });
        patched++;
      }
    }
    return { patched };
  },
});

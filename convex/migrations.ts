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
  handler: async (_ctx) => {
    // No-op: legacy targetType/targetId fields were removed in schema alignment
    return { threadsPatched: 0, commentsPatched: 0 };
  },
});

// Optional cleanup: remove legacy targetType/targetId fields now allowed by schema
export const removeLegacyCommentTargets = mutation({
  args: {},
  handler: async (ctx) => {
    const threads = await ctx.db.query("commentThreads").collect();
    let threadsPatched = 0;
    for (const t of threads) {
      if ((t as any).targetType !== undefined || (t as any).targetId !== undefined) {
        await ctx.db.patch(t._id, { targetType: undefined, targetId: undefined } as any);
        threadsPatched++;
      }
    }

    const comments = await ctx.db.query("comments").collect();
    let commentsPatched = 0;
    for (const c of comments) {
      if ((c as any).targetType !== undefined || (c as any).targetId !== undefined) {
        await ctx.db.patch(c._id, { targetType: undefined, targetId: undefined } as any);
        commentsPatched++;
      }
    }

    return { threadsPatched, commentsPatched };
  },
});

export const migrateTemplatesToSnapshot = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const templates = await ctx.db.query("documentTemplates").collect();

    let migrated = 0;
    let normalized = 0;

    for (const t of templates as any[]) {
      const hasSnapshot = t.snapshot !== undefined && t.snapshot !== null;
      const hasInitial = t.initialSnapshot !== undefined && t.initialSnapshot !== null;
      const hasStructure = t.structure !== undefined && t.structure !== null;

      // If no snapshot yet, synthesize one from initialSnapshot or blank
      if (!hasSnapshot) {
        let content: any = { type: "doc", content: [] };
        if (typeof t.initialSnapshot === "string" && t.initialSnapshot.length > 0) {
          try { content = JSON.parse(t.initialSnapshot); } catch {}
        }
        const snapshot = {
          documentTitle: t.name ?? "Untitled",
          documentMetadata: undefined,
          pages: [
            {
              title: t.name ?? "Untitled",
              order: 0,
              content: JSON.stringify(content),
            },
          ],
        };
        await ctx.db.patch(t._id, { snapshot } as any);
        migrated++;
      }

      // Remove legacy fields if present
      if (hasInitial || hasStructure) {
        await ctx.db.patch(t._id, { initialSnapshot: undefined, structure: undefined } as any);
        normalized++;
      }

      // Ensure createdAt exists for older rows
      if (t.createdAt === undefined) {
        await ctx.db.patch(t._id, { createdAt: now } as any);
      }
    }

    return { total: templates.length, migratedToSnapshot: migrated, removedLegacyFields: normalized };
  },
});

export const removeLegacyDocumentTemplateFields = mutation({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query("documents").collect();
    let patched = 0;
    for (const d of docs as any[]) {
      const needs = d.templateId !== undefined || d.templateKey !== undefined;
      if (needs) {
        await ctx.db.patch(d._id, { templateId: undefined, templateKey: undefined } as any);
        patched++;
      }
    }
    return { removedFromDocuments: patched };
  },
});

export const migrateUserRoles = mutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    let patched = 0;
    for (const u of users as any[]) {
      const current = u.role;
      if (current === "user") {
        await ctx.db.patch(u._id, { role: "pm" } as any);
        patched++;
      }
      // If missing, default to pm for prototype
      if (current === undefined || current === null) {
        await ctx.db.patch(u._id, { role: "pm" } as any);
        patched++;
      }
    }
    return { updated: patched };
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
        description: "A blank document with a single empty page.",
        snapshot: {
          documentTitle: "Untitled",
          pages: [
            { title: "Untitled", order: 0, content: JSON.stringify({ type: "doc", content: [] }) },
          ],
        },
        isActive: true,
        isPublic: false,
        usageCount: 0,
        createdAt: now,
      } as any);
      blank = await ctx.db.get(blankId);
    }
    return { ensured: !!blank };
  },
});

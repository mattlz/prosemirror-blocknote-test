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


// Copy all rows from `pages` to `documentPages` while preserving hierarchy.
// Safe to run once; it will no-op if `documentPages` already has data.
export const migratePagesToDocumentPages = mutation({
  args: {},
  handler: async (ctx) => {
    const legacyPages = await ctx.db.query("pages").collect();
    if (legacyPages.length === 0) {
      return { migrated: 0, patchedParents: 0, skipped: false } as const;
    }

    // Build docId -> existing newId mapping for any rows already copied
    const allNew = await ctx.db.query("documentPages").collect();
    const docIdToNewId: Record<string, string> = {};
    for (const dp of allNew) {
      docIdToNewId[(dp as any).docId] = String((dp as any)._id);
    }

    let inserted = 0;
    // First pass: insert any missing rows by docId (idempotent)
    for (const p of legacyPages) {
      const existing = await ctx.db
        .query("documentPages")
        .withIndex("by_docId", q => q.eq("docId", (p as any).docId))
        .first();
      if (!existing) {
        const newId = await ctx.db.insert("documentPages", {
          documentId: p.documentId,
          parentPageId: undefined,
          docId: (p as any).docId,
          title: (p as any).title,
          icon: (p as any).icon,
          order: (p as any).order,
          createdAt: (p as any).createdAt,
        } as any);
        docIdToNewId[(p as any).docId] = String(newId);
        inserted++;
      }
    }

    // Second pass: patch parentPageId in new table using docId mapping
    let patchedParents = 0;
    for (const p of legacyPages) {
      const newId = docIdToNewId[(p as any).docId];
      const parentOldId = (p as any).parentPageId as string | undefined;
      if (!newId || !parentOldId) continue;
      const parentLegacy = legacyPages.find(lp => String((lp as any)._id) === String(parentOldId));
      if (!parentLegacy) continue;
      const parentNewId = docIdToNewId[(parentLegacy as any).docId];
      if (!parentNewId) continue;
      await ctx.db.patch(newId as any, { parentPageId: parentNewId as any });
      patchedParents++;
    }

    return { migrated: inserted, patchedParents, skipped: false } as const;
  },
});



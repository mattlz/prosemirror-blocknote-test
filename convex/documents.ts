import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { components } from "./_generated/api";
import { ProsemirrorSync } from "@convex-dev/prosemirror-sync";
import { createDocumentFromTemplateInternal, getOrCreateBlankTemplate } from "./templates";

const prosemirrorSync = new ProsemirrorSync(components.prosemirrorSync);

function randomId(): string {
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const list = query({
    args: {
        status: v.optional(v.union(
          v.literal("draft"),
          v.literal("published"),
          v.literal("archived")
        )),
        documentType: v.optional(v.union(
          v.literal("project_brief"),
          v.literal("meeting_notes"),
          v.literal("wiki_article"),
          v.literal("resource_doc"),
          v.literal("retrospective"),
          v.literal("blank")
        )),
    },
    handler: async (ctx, args) => {
        const base = ctx.db.query("documents");
        if (args.status) {
          return base
            .withIndex("by_status", qi => qi.eq("status", args.status))
            .order("desc")
            .collect();
        }
        if (args.documentType) {
          return base
            .withIndex("by_type", qi => qi.eq("documentType", args.documentType))
            .order("desc")
            .collect();
        }
        return base
          .withIndex("by_created", qi => qi.gt("createdAt", 0))
          .order("desc")
          .collect();
    },
});

export const create = mutation({
  args: { title: v.string(), templateKey: v.optional(v.string()), documentType: v.optional(v.string()), projectId: v.optional(v.id("projects")) },
  handler: async (ctx, { title, templateKey, documentType, projectId }) => {
    // Default to blank template if none provided
    const tplKey = templateKey ?? "blank";
    // Ensure the template exists (creates 'blank' if missing)
    if (tplKey === "blank") {
      await getOrCreateBlankTemplate(ctx);
    }
    const { documentId } = await createDocumentFromTemplateInternal(ctx, {
      title,
      templateKey: tplKey,
      documentType: (documentType as any) ?? (tplKey === "blank" ? "blank" : undefined),
      projectId: projectId as any,
    });
    return { documentId };
  },
});

export const rename = mutation({
    args: { documentId: v.id("documents"), title: v.string() },
    handler: async (ctx, { documentId, title }) => {
        await ctx.db.patch(documentId, { title });
    },
});

export const remove = mutation({
    args: { documentId: v.id("documents") },
    handler: async (ctx, { documentId }) => {
        await ctx.db.delete(documentId);
        // Optional: also cascade delete pages; left as a follow-up
    },
});

export const publish = mutation({
    args: { documentId: v.id("documents") },
    handler: async (ctx, { documentId }) => {
        const doc = await ctx.db.get(documentId);
        if (!doc) throw new Error("Document not found");
        const shareId = (doc as any).shareId ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
        await ctx.db.patch(documentId, { shareId, publishedAt: Date.now() });
        return { shareId };
    },
});

export const getByShareId = query({
    args: { shareId: v.string() },
    handler: async (ctx, { shareId }) => {
        const [d] = await ctx.db.query("documents").withIndex("by_shareId", q => q.eq("shareId", shareId)).collect();
        return d ?? null;
    },
});


// Weekly updates API
export const listWeeklyUpdates = query({
    args: { docId: v.string() },
    handler: async (ctx, { docId }) => {
        return ctx.db.query("weeklyUpdates").withIndex("by_doc", q => q.eq("docId", docId)).order("desc").collect();
    },
});

export const createWeeklyUpdate = mutation({
    args: { docId: v.string(), accomplished: v.string(), focus: v.string(), blockers: v.string(), authorId: v.optional(v.string()) },
    handler: async (ctx, { docId, accomplished, focus, blockers, authorId }) => {
        const now = Date.now();
        const id = await ctx.db.insert("weeklyUpdates", {
            docId,
            accomplished,
            focus,
            blockers,
            createdAt: now,
            updatedAt: now,
            authorId,
        });
        return id;
    },
});

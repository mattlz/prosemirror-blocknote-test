import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { components } from "./_generated/api";
import { ProsemirrorSync } from "@convex-dev/prosemirror-sync";

const prosemirrorSync = new ProsemirrorSync(components.prosemirrorSync);

function randomId(): string {
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const list = query({
    args: {},
    handler: async (ctx) => {
        return ctx.db.query("documents").withIndex("by_created", q => q.gt("createdAt", 0)).order("desc").collect();
    },
});

export const create = mutation({
    args: { title: v.string() },
    handler: async (ctx, { title }) => {
        console.log("🆕 CREATING DOCUMENT:", {
            title,
            timestamp: new Date().toISOString()
        });
        
        const now = Date.now();
        const id = await ctx.db.insert("documents", {
            title,
            createdAt: now,
        });
        
        console.log("✅ DOCUMENT CREATED:", {
            documentId: id,
            title,
            timestamp: new Date().toISOString()
        });

        // Create a default page for this document
        const pageId = await ctx.db.insert("pages", {
            title,
            documentId: id,
            order: 0,
            parentPageId: undefined,
            docId: "", // Will be updated after ProseMirror doc creation
            createdAt: now,
        });
        
        console.log("✅ DEFAULT PAGE CREATED:", {
            pageId,
            documentId: id,
            title,
            timestamp: new Date().toISOString()
        });

        // Create a ProseMirror document for this page
        const docId = randomId();
        await prosemirrorSync.create(ctx, docId, { type: "doc", content: [] });
        
        console.log("✅ PROSEMIRROR DOC CREATED:", {
            docId,
            pageId,
            documentId: id,
            timestamp: new Date().toISOString()
        });

        // Update the page with the docId
        await ctx.db.patch(pageId, { docId });
        
        console.log("✅ PAGE UPDATED WITH DOCID:", {
            pageId,
            docId,
            documentId: id,
            timestamp: new Date().toISOString()
        });

        return { documentId: id, pageId, docId };
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



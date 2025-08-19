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
        const now = Date.now();
        const id = await ctx.db.insert("documents", { title, createdAt: now });
        
        // Automatically create a default page when document is created
        const docId = randomId();
        const pageId = await ctx.db.insert("pages", { 
            documentId: id, 
            parentPageId: undefined, 
            docId, 
            title, 
            order: 1, 
            createdAt: now 
        });
        
        // Create an empty doc server-side so clients can open immediately without calling sync.create
        await prosemirrorSync.create(ctx, docId, { type: "doc", content: [] });
        
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



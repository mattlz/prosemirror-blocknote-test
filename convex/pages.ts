import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { components } from "./_generated/api";
import { ProsemirrorSync } from "@convex-dev/prosemirror-sync";

const prosemirrorSync = new ProsemirrorSync(components.prosemirrorSync);

function randomId(): string {
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const list = query({
	args: { documentId: v.id("documents"), parentPageId: v.optional(v.union(v.id("documentPages"), v.id("pages"))) },
	handler: async (ctx, { documentId, parentPageId }) => {
		// Prefer new table if it has rows for this document; otherwise fall back to legacy table.
		const hasNew = await ctx.db
			.query("documentPages")
			.withIndex("by_document", x => x.eq("documentId", documentId))
			.first();
		if (hasNew) {
			let q = ctx.db.query("documentPages").withIndex("by_document", x => x.eq("documentId", documentId));
			if (parentPageId !== undefined) {
				q = ctx.db
					.query("documentPages")
					.withIndex("by_document_parent", x => x.eq("documentId", documentId).eq("parentPageId", parentPageId as any));
			}
			const pages = await q.collect();
			return pages.sort((a, b) => a.order - b.order);
		}
		let q = ctx.db.query("pages").withIndex("by_document", x => x.eq("documentId", documentId));
		if (parentPageId !== undefined) {
			q = ctx.db
				.query("pages")
				.withIndex("by_document_parent", x => x.eq("documentId", documentId).eq("parentPageId", parentPageId as any));
		}
		const pages = await q.collect();
		return pages.sort((a, b) => a.order - b.order);
	},
});

export const create = mutation({
	args: { documentId: v.id("documents"), title: v.string(), parentPageId: v.optional(v.union(v.id("documentPages"), v.id("pages"))) },
	handler: async (ctx, { documentId, title, parentPageId }) => {
		const now = Date.now();
		const hasNew = await ctx.db
			.query("documentPages")
			.withIndex("by_document", q => q.eq("documentId", documentId))
			.first();
		const target = hasNew ? "documentPages" : "pages";
		const last = await ctx.db
			.query(target)
			.withIndex("by_document_order", q => q.eq("documentId", documentId))
			.order("desc")
			.first();
		const order = (last?.order ?? 0) + 1;
		const docId = randomId();
		const pageId = await ctx.db.insert(target as any, { documentId, parentPageId, docId, title, order, createdAt: now } as any);
		// Create an empty doc server-side so clients can open immediately without calling sync.create
		await prosemirrorSync.create(ctx, docId, { type: "doc", content: [] });
		return { pageId, docId };
	},
});

// Create a subpage beneath a specific parent page. This mirrors `create` but
// requires a `parentPageId` argument for clarity from the client.

export const createSubpage = mutation({
	args: { documentId: v.id("documents"), parentPageId: v.union(v.id("documentPages"), v.id("pages")), title: v.string() },
	handler: async (ctx, { documentId, parentPageId, title }) => {
		const parent = await ctx.db.get(parentPageId);
		if (!parent) throw new Error("Parent page not found");
		if (parent.parentPageId) throw new Error("Subpages cannot have their own subpages");
		const now = Date.now();
		const target = (String((parentPageId as any).tableName ?? "").includes("pages") && !(String((parentPageId as any).tableName ?? "").includes("documentPages"))) ? "pages" : "documentPages";
		const last = await ctx.db
			.query(target)
			.withIndex("by_document_order", q => q.eq("documentId", documentId))
			.order("desc")
			.first();
		const order = (last?.order ?? 0) + 1;
		const docId = randomId();
		const pageId = await ctx.db.insert(target as any, { documentId, parentPageId, docId, title, order, createdAt: now } as any);
		await prosemirrorSync.create(ctx, docId, { type: "doc", content: [] });
		return { pageId, docId };
	},
});

export const rename = mutation({
	args: { pageId: v.union(v.id("documentPages"), v.id("pages")), title: v.string() },
	handler: async (ctx, { pageId, title }) => {
		await ctx.db.patch(pageId, { title });
	},
});

export const setIcon = mutation({
	args: { pageId: v.union(v.id("documentPages"), v.id("pages")), icon: v.optional(v.string()) },
	handler: async (ctx, { pageId, icon }) => {
		await ctx.db.patch(pageId, { icon });
	},
});

export const remove = mutation({
	args: { pageId: v.union(v.id("documentPages"), v.id("pages")) },
	handler: async (ctx, { pageId }) => {
		const page = await ctx.db.get(pageId);
		if (!page) return;
		await ctx.db.delete(pageId);
		// Optionally: delete PM history via component lib in a follow-up
	},
});

export const reorder = mutation({
	args: { pageId: v.union(v.id("documentPages"), v.id("pages")), beforePageId: v.optional(v.union(v.id("documentPages"), v.id("pages"))) },
	handler: async (ctx, { pageId, beforePageId }) => {
		if (!beforePageId) {
			const page = await ctx.db.get(pageId);
			if (!page) return;
			// Use table that currently has rows for this document
			const hasNew = await ctx.db
				.query("documentPages")
				.withIndex("by_document", q => q.eq("documentId", page.documentId))
				.first();
			const target = hasNew ? "documentPages" : "pages";
			const last = await ctx.db
				.query(target)
				.withIndex("by_document_order", q => q.eq("documentId", page.documentId))
				.order("desc")
				.first();
			await ctx.db.patch(pageId, { order: (last?.order ?? 0) + 1 });
			return;
		}
		const before = await ctx.db.get(beforePageId);
		if (!before) return;
		const hasNew = await ctx.db
			.query("documentPages")
			.withIndex("by_document", q => q.eq("documentId", before.documentId))
			.first();
		const target = hasNew ? "documentPages" : "pages";
		const prev = await ctx.db
			.query(target)
			.withIndex("by_document_order", q => q.eq("documentId", before.documentId).lt("order", before.order))
			.order("desc")
			.first();
		const newOrder = prev ? (prev.order + before.order) / 2 : before.order - 1;
		await ctx.db.patch(pageId, { order: newOrder });
	},
});

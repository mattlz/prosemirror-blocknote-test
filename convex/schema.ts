import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
	...authTables,
	documents: defineTable({
		title: v.string(),
		createdAt: v.number(),
		ownerId: v.optional(v.string()),
		archivedAt: v.optional(v.number()),
	}).index("by_owner", ["ownerId"]).index("by_created", ["createdAt"]),

	pages: defineTable({
		documentId: v.id("documents"),
		parentPageId: v.optional(v.id("pages")),
		docId: v.string(),
		title: v.string(),
		icon: v.optional(v.string()),
		order: v.number(),
		createdAt: v.number(),
	})
		.index("by_document", ["documentId"]) 
		.index("by_document_parent", ["documentId", "parentPageId"]) 
		.index("by_document_order", ["documentId", "order"]) 
		.index("by_docId", ["docId"]),
	presence: defineTable({
		docId: v.string(),
		userId: v.string(),
		name: v.string(),
		color: v.string(),
		cursor: v.string(),
		updatedAt: v.number(),
	})
		.index("by_doc", ["docId"]) 
		.index("by_doc_user", ["docId", "userId"]),
});

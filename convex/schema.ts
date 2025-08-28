import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
	...authTables,

	users: defineTable({
		email: v.string(),
		name: v.optional(v.string()),
		role: v.optional(v.union(v.literal("admin"), v.literal("user"))),
		status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("invited"))),
		createdAt: v.optional(v.number()),
		updatedAt: v.optional(v.number()),
	}).index("by_email", ["email"]),
	documents: defineTable({
		title: v.string(),
		createdAt: v.number(),
		ownerId: v.optional(v.string()),
		archivedAt: v.optional(v.number()),
		shareId: v.optional(v.string()),
		publishedAt: v.optional(v.number()),
        // NEW template references
        templateId: v.optional(v.id("documentTemplates")),
        templateKey: v.optional(v.string()),
	}).index("by_owner", ["ownerId"]).index("by_created", ["createdAt"]).index("by_shareId", ["shareId"]).index("by_template", ["templateKey"]),

	// Document templates
	documentTemplates: defineTable({
		key: v.string(), // e.g. "blank"
		name: v.string(), // e.g. "Blank"
		description: v.optional(v.string()),
		structure: v.optional(v.any()), // reserved for future template page tree
		initialSnapshot: v.optional(v.string()), // JSON string of PM doc
		createdAt: v.number(),
		updatedAt: v.number(),
	}).index("by_key", ["key"]),

	// Table for document page hierarchy (replaces legacy `pages`)
	documentPages: defineTable({
		documentId: v.id("documents"),
		parentPageId: v.optional(v.id("documentPages")),
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
	comments: defineTable({
		docId: v.string(),
		blockId: v.string(),
		threadId: v.string(),
		content: v.string(),
		authorId: v.string(),
		createdAt: v.number(),
		updatedAt: v.number(),
		resolved: v.optional(v.boolean()),
		parentCommentId: v.optional(v.id("comments")),
		// NEW fields for cross-context support:
		targetType: v.optional(v.string()),
		targetId: v.optional(v.string()),
	})
		.index("by_doc", ["docId"])
		.index("by_thread", ["threadId"])
		.index("by_block", ["blockId"])
		.index("by_doc_resolved", ["docId", "resolved"]) 
		// NEW index
		.index("by_target", ["targetType", "targetId"]),
	commentThreads: defineTable({
		id: v.string(),
		docId: v.string(),
		blockId: v.string(),
		createdAt: v.number(),
		resolved: v.optional(v.boolean()),
		creatorId: v.optional(v.string()),
		// NEW fields for cross-context support:
		targetType: v.optional(v.string()),
		targetId: v.optional(v.string()),
	})
		.index("by_doc", ["docId"]) 
		.index("by_block", ["blockId"]) 
		// NEW index to look up by external thread id (avoid reserved names)
		.index("by_public_id", ["id"]) 
		// NEW index
		.index("by_target", ["targetType", "targetId"]),

	weeklyUpdates: defineTable({
		docId: v.string(),
		accomplished: v.string(),
		focus: v.string(),
		blockers: v.string(),
		createdAt: v.number(),
		updatedAt: v.number(),
		authorId: v.optional(v.string()),
	})
		.index("by_doc", ["docId"]),
});

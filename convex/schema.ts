import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
	...authTables,
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

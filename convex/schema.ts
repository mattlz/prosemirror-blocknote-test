import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
	...authTables,

	// Custom users table that extends Convex Auth's base users table
	users: defineTable({
		// Convex Auth base fields (optional)
		name: v.optional(v.string()),
		image: v.optional(v.string()),
		email: v.optional(v.string()),
		emailVerificationTime: v.optional(v.number()),
		phone: v.optional(v.string()),
		phoneVerificationTime: v.optional(v.number()),
		isAnonymous: v.optional(v.boolean()),
		
		// Custom application fields
		role: v.optional(v.union(
			v.literal("admin"),
			v.literal("pm"),
			v.literal("task_owner"),
			v.literal("client")
		)),
		status: v.optional(v.union(
			v.literal("active"),
			v.literal("inactive"),
			v.literal("invited")
		)),
		
		// Organization relationship
		organizationId: v.optional(v.id("organizations")), // Optional during migration
		
		// Assignment fields
		clientId: v.optional(v.id("clients")),
		departmentIds: v.optional(v.array(v.id("departments"))),
		
		// User profile fields
		jobTitle: v.optional(v.string()),
		bio: v.optional(v.string()),
		timezone: v.optional(v.string()),
		preferredLanguage: v.optional(v.string()),
		themePreference: v.optional(v.union(
			v.literal("system"),
			v.literal("light"),
			v.literal("dark")
		)),
		
		// Invitation fields
		invitedBy: v.optional(v.id("users")),
		invitedAt: v.optional(v.number()),
		invitationToken: v.optional(v.string()),
		
		// Real-time presence fields
		lastActive: v.optional(v.number()),
		currentPage: v.optional(v.string()),
		
		// Audit fields
		createdAt: v.optional(v.number()),
		updatedAt: v.optional(v.number()),
	})
		.index("by_email", ["email"])
		.index("by_status", ["status"])
		.index("by_role", ["role"])
		.index("by_organization", ["organizationId"]),
	
	// Organization table for global settings and multi-tenant architecture
	organizations: defineTable({
		// Basic Information
		name: v.string(),
		slug: v.string(), // URL-friendly identifier
		logo: v.optional(v.id("_storage")),
		website: v.optional(v.string()),
		timezone: v.string(),
		
		// Default Settings (for sprints/capacity)
		defaultWorkstreamCapacity: v.number(), // Hours per workstream per sprint
		defaultSprintDuration: v.number(), // Sprint length in weeks
		
		// Email Configuration
		emailFromAddress: v.string(),
		emailFromName: v.string(),
		primaryColor: v.string(), // Hex color for email templates/branding
		
		// Feature Flags
		features: v.object({
			emailInvitations: v.boolean(),
			slackIntegration: v.boolean(),
			clientPortal: v.boolean(),
		}),
		
		// Audit Fields
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_slug", ["slug"]),
	
	// Password reset tokens for email-based authentication
	passwordResets: defineTable({
		userId: v.id("users"),
		token: v.string(),
		expiresAt: v.number(),
		used: v.boolean(),
		createdAt: v.number(),
	})
		.index("by_token", ["token"])
		.index("by_user", ["userId"]),

	// DOCUMENTS (ensure fields + indexes)
	documents: defineTable({
		title: v.string(),
		createdAt: v.number(),
		ownerId: v.optional(v.string()),
		archivedAt: v.optional(v.number()),
		shareId: v.optional(v.string()),
		publishedAt: v.optional(v.number()),
		// Legacy template references for back-compat during migration
		templateId: v.optional(v.id("documentTemplates")),
		templateKey: v.optional(v.string()),
		projectId: v.optional(v.id("projects")),
		clientId: v.optional(v.id("clients")),
		departmentId: v.optional(v.id("departments")),
		documentType: v.optional(v.union(
			v.literal("project_brief"),
			v.literal("meeting_notes"),
			v.literal("wiki_article"),
			v.literal("resource_doc"),
			v.literal("retrospective"),
			v.literal("blank")
		)),
		status: v.optional(v.union(v.literal("draft"), v.literal("published"), v.literal("archived"))),
		metadata: v.optional(v.any()),
		createdBy: v.optional(v.id("users")),
	})
	.index("by_owner", ["ownerId"]) 
	.index("by_created", ["createdAt"]) 
	.index("by_shareId", ["shareId"]) 
	.index("by_status", ["status"]) 
	.index("by_type", ["documentType"]) 
	.index("by_project", ["projectId"]),

	// DOCUMENT TEMPLATES (align with main app; keep key for 'blank')
	documentTemplates: defineTable({
		key: v.optional(v.string()), // back-compat (e.g., "blank")
		name: v.string(),
		description: v.optional(v.string()),
		category: v.optional(v.union(
			v.literal("project_brief"),
			v.literal("meeting_notes"),
			v.literal("wiki_article"),
			v.literal("resource_doc"),
			v.literal("retrospective"),
			v.literal("general"),
			v.literal("user_created")
		)),
		snapshot: v.optional(v.object({
			documentTitle: v.string(),
			documentMetadata: v.optional(v.any()),
			pages: v.array(v.object({
				title: v.string(),
				icon: v.optional(v.string()),
				order: v.number(),
				content: v.string(), // PM JSON string
				subpages: v.optional(v.array(v.object({
					title: v.string(),
					icon: v.optional(v.string()),
					order: v.number(),
					content: v.string(),
				}))),
			})),
		})),
		// Legacy fields to allow migration to run
		initialSnapshot: v.optional(v.string()),
		structure: v.optional(v.any()),
		thumbnailUrl: v.optional(v.string()),
		usageCount: v.optional(v.number()),
		isPublic: v.optional(v.boolean()),
		isActive: v.optional(v.boolean()),
		createdBy: v.optional(v.id("users")),
		createdAt: v.number(),
		updatedAt: v.optional(v.number()),
		lastUsedAt: v.optional(v.number()),
	})
	.index("by_key", ["key"]) 
	.index("by_category", ["category"]) 
	.index("by_active", ["isActive"]) 
	.index("by_public", ["isPublic"]) 
	.index("by_created_by", ["createdBy"]),

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

	// Presence tracking
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

	// COMMENTS (merge doc + task flows)
	comments: defineTable({
		// Document-block context
		docId: v.optional(v.string()),
		blockId: v.optional(v.string()),
		// Cross-entity
		taskId: v.optional(v.id("tasks")),
		projectId: v.optional(v.id("projects")),
		sprintId: v.optional(v.id("sprints")),
		entityType: v.optional(v.union(
			v.literal("document_block"),
			v.literal("task"),
			v.literal("project"),
			v.literal("sprint")
		)),
		// Threading
		threadId: v.optional(v.string()),
		parentCommentId: v.optional(v.id("comments")),
		// Legacy fields for back-compat (will be migrated away)
		targetType: v.optional(v.string()),
		targetId: v.optional(v.string()),
		// Content + mentions
		content: v.string(),
		authorId: v.optional(v.id("users")),
		mentions: v.optional(v.array(v.object({
			userId: v.string(),
			position: v.number(),
			length: v.number(),
		}))),
		// Status
		resolved: v.optional(v.boolean()),
		resolvedBy: v.optional(v.string()),
		resolvedAt: v.optional(v.number()),
		editedAt: v.optional(v.number()),
		deleted: v.optional(v.boolean()),
		// Audit
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_doc", ["docId"]) 
		.index("by_thread", ["threadId"]) 
		.index("by_block", ["blockId"]) 
		.index("by_task", ["taskId"]) 
		.index("by_doc_resolved", ["docId", "resolved"]),

	// COMMENT THREADS (doc + task)
	commentThreads: defineTable({
		id: v.string(), // public thread id
		docId: v.optional(v.string()),
		blockId: v.optional(v.string()),
		taskId: v.optional(v.id("tasks")),
		projectId: v.optional(v.id("projects")),
		sprintId: v.optional(v.id("sprints")),
		entityType: v.optional(v.union(
			v.literal("document_block"),
			v.literal("task"),
			v.literal("project"),
			v.literal("sprint")
		)),
		createdAt: v.number(),
		resolved: v.optional(v.boolean()),
		creatorId: v.optional(v.string()),
		// Legacy fields for back-compat (will be migrated away)
		targetType: v.optional(v.string()),
		targetId: v.optional(v.string()),
	})
		.index("by_doc", ["docId"]) 
		.index("by_block", ["blockId"]) 
		.index("by_task", ["taskId"]) 
		.index("by_public_id", ["id"]),

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

	// NOTIFICATIONS (required by mentions/activity)
	notifications: defineTable({
		type: v.union(
			v.literal("comment_created"),
			v.literal("task_assigned"),
			v.literal("task_status_changed"),
			v.literal("document_updated"),
			v.literal("sprint_started"),
			v.literal("sprint_completed"),
			v.literal("mention"),
			v.literal("general"),
			v.literal("task_comment_mention"),
			v.literal("task_comment_activity"),
			v.literal("project_created")
		),
		title: v.string(),
		message: v.string(),
		userId: v.id("users"),
		isRead: v.boolean(),
		priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
		relatedCommentId: v.optional(v.id("comments")),
		relatedTaskId: v.optional(v.id("tasks")),
		relatedDocumentId: v.optional(v.id("documents")),
		actionUrl: v.optional(v.string()),
		actionText: v.optional(v.string()),
		createdAt: v.number(),
		readAt: v.optional(v.number()),
  })
		.index("by_user", ["userId"]) 
		.index("by_user_unread", ["userId", "isRead"]) 
		.index("by_type", ["type"]) 
		.index("by_created_at", ["createdAt"]) 
		.index("by_related_document", ["relatedDocumentId"]) 
		.index("by_related_task", ["relatedTaskId"]),

	// MINIMAL TASKS & PROJECTS (for task comments + project brief linking)
	tasks: defineTable({
		title: v.string(),
		projectId: v.optional(v.id("projects")),
		assigneeId: v.optional(v.id("users")),
		status: v.union(v.literal("todo"), v.literal("in_progress"), v.literal("review"), v.literal("done"), v.literal("archived")),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_project", ["projectId"]),

	projects: defineTable({
		title: v.string(),
		clientId: v.optional(v.id("clients")),
		departmentId: v.optional(v.id("departments")),
		visibility: v.union(v.literal("private"), v.literal("department"), v.literal("client"), v.literal("organization")),
		documentId: v.optional(v.id("documents")), // linked doc
		projectManagerId: v.optional(v.id("users")),
		teamMemberIds: v.optional(v.array(v.id("users"))),
		createdBy: v.optional(v.id("users")),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_client", ["clientId"]) 
		.index("by_department", ["departmentId"]) 
		.index("by_status", ["visibility"]),

	clients: defineTable({
		name: v.string(),
		createdAt: v.number(),
	}),

	departments: defineTable({
		name: v.string(),
		createdAt: v.number(),
	}),
	
	// Sprints table for sprint management
	sprints: defineTable({
		title: v.string(),
		startDate: v.number(),
		endDate: v.number(),
		status: v.union(
			v.literal("planning"),
			v.literal("active"),
			v.literal("completed"),
			v.literal("archived")
		),
		organizationId: v.optional(v.id("organizations")),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_status", ["status"])
		.index("by_organization", ["organizationId"]),
});

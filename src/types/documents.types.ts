import type { Id } from '@/convex/_generated/dataModel';

export interface Document {
	_id: Id<"documents">;
	title: string;
	createdAt: number;
	ownerId?: string;
	archivedAt?: number;
	shareId?: string;
	publishedAt?: number;
	// NEW
	templateId?: Id<"documentTemplates">;
	templateKey?: string;

	// NEW optional alignment fields
	projectId?: Id<"projects">;
	clientId?: Id<"clients">;
	departmentId?: Id<"departments">;
	documentType?:
		| "project_brief"
		| "meeting_notes"
		| "wiki_article"
		| "resource_doc"
		| "retrospective"
		| "blank";
	status?: "draft" | "published" | "archived";
	metadata?: unknown;
	createdBy?: Id<"users">;
}

export interface DocumentTemplate {
	_id: Id<"documentTemplates">;
	key: string;
	name: string;
	description?: string;
	structure?: unknown;
	initialSnapshot?: string;
	createdAt: number;
	updatedAt: number;
}

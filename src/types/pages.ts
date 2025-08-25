import type { Id } from '@/convex/_generated/dataModel';

export interface Page {
	_id: Id<"pages">;
	documentId: Id<"documents">;
	parentPageId?: Id<"pages">;
	docId: string;
	title: string;
	icon?: string;
	order: number;
	createdAt: number;
}

export interface PageOperations {
	renamePage: (pageId: Id<"pages">, title: string) => Promise<void>;
	reorderPage: (pageId: Id<"pages">, beforePageId?: Id<"pages">) => Promise<void>;
	removePage: (pageId: Id<"pages">) => Promise<void>;
	createSubpage: (parentPageId: Id<"pages">, title: string) => Promise<{ pageId: Id<"pages">; docId: string }>;
}

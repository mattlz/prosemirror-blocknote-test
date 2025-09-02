import type { Id } from '@/convex/_generated/dataModel';

export interface Page {
	_id: Id<"documentPages">;
	documentId: Id<"documents">;
	parentPageId?: Id<"documentPages">;
	docId: string;
	title: string;
	icon?: string;
	order: number;
	createdAt: number;
}

export interface PageOperations {
	renamePage: (pageId: Id<"documentPages">, title: string) => Promise<void>;
	reorderPage: (pageId: Id<"documentPages">, beforePageId?: Id<"documentPages">) => Promise<void>;
	removePage: (pageId: Id<"documentPages">) => Promise<void>;
	createSubpage: (parentPageId: Id<"documentPages">, title: string) => Promise<{ pageId: Id<"documentPages">; docId: string }>;
}

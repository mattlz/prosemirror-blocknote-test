import type { Id } from '@/convex/_generated/dataModel';

export interface Document {
	_id: Id<"documents">;
	title: string;
	createdAt: number;
	ownerId?: string;
	archivedAt?: number;
	shareId?: string;
	publishedAt?: number;
}

export interface Comment {
	_id: string;
	docId: string;
	blockId: string;
	threadId: string;
	content: string;
	authorId: string;
	createdAt: number;
	updatedAt: number;
	// NEW optional fields for generic targets
	targetType?: string; // e.g., "doc", "task", etc.
	targetId?: string; // ID of the target entity
  resolved?: boolean; // keep parity with backend optional field
  parentCommentId?: string; // if present locally
}

export interface Thread {
	_id?: string;
	id?: string;
	docId: string;
	blockId: string;
	createdAt: number;
	resolved?: boolean;
	creatorId?: string;
	// NEW optional fields for generic targets
	targetType?: string; // e.g., "doc", "task", etc.
	targetId?: string; // ID of the target entity
}

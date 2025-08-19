export interface Comment {
	_id: string;
	docId: string;
	blockId: string;
	threadId: string;
	content: string;
	authorId: string;
	createdAt: number;
	updatedAt: number;
}

export interface Thread {
	_id?: string;
	id?: string;
	docId: string;
	blockId: string;
	createdAt: number;
	resolved?: boolean;
	creatorId?: string;
}

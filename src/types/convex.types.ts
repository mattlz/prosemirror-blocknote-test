import type { Id, Doc } from '@/convex/_generated/dataModel';

// User types
export interface UserData extends Doc<"users"> {
  _id: Id<"users">;
  email: string;
  name?: string;
  role?: 'admin' | 'user';
  status?: 'active' | 'inactive' | 'invited';
  createdAt?: number;
  updatedAt?: number;
}

// Document types
export interface DocumentData extends Doc<"documents"> {
  _id: Id<"documents">;
  title: string;
  createdAt: number;
  ownerId?: string;
  archivedAt?: number;
  shareId?: string;
  publishedAt?: number;
}

// Page types
export interface PageData extends Doc<"pages"> {
  _id: Id<"pages">;
  documentId: Id<"documents">;
  parentPageId?: Id<"pages">;
  docId: string;
  title: string;
  icon?: string;
  order: number;
  createdAt: number;
}

// Comment types
export interface CommentData extends Doc<"comments"> {
  _id: Id<"comments">;
  docId: string;
  blockId: string;
  threadId: string; // Changed from Id<"commentThreads"> to string to match schema
  content: string;
  authorId: string;
  createdAt: number;
  updatedAt: number;
  resolved?: boolean;
  parentCommentId?: Id<"comments">;
}

// Thread types
export interface ThreadData {
  _id: Id<"commentThreads">;
  id: string; // Added to match Convex schema
  docId: string;
  blockId: string;
  createdAt: number;
  resolved?: boolean;
  creatorId?: string;
}

// Comment with thread data for display
export interface CommentWithThread {
  thread: ThreadData;
  comments: CommentData[];
}

// Presence types
export interface PresenceData extends Doc<"presence"> {
  _id: Id<"presence">;
  docId: string;
  userId: string;
  name: string;
  color: string;
  cursor: string;
  updatedAt: number;
}

// Weekly update types
export interface WeeklyUpdateData extends Doc<"weeklyUpdates"> {
  _id: Id<"weeklyUpdates">;
  docId: string;
  accomplished: string;
  focus: string;
  blockers: string;
  createdAt: number;
  updatedAt: number;
  authorId?: string;
}

// Convex query result types
export interface DocumentsListResult {
  documents: DocumentData[];
}

export interface PagesListResult {
  pages: PageData[];
}

export interface CommentsListResult {
  comments: CommentData[];
}

export interface ThreadsListResult {
  threads: ThreadData[];
}

// Editor types - using a more flexible interface that works with BlockNote
export interface EditorInstance {
  manualSave?: () => Promise<void>;
  getJSON?: () => unknown;
  getHTML?: () => string;
  destroy?: () => void;
  focus?: () => void;
  options?: {
    comments?: {
      threadStore?: {
        docId?: string;
      };
    };
  };
  // BlockNote specific methods and properties
  pmSchema?: unknown;
  extensions?: unknown[];
  headless?: boolean;
  _tiptapEditor?: unknown;
  _headless?: boolean;
  [key: string]: unknown; // Allow additional properties for BlockNote compatibility
}

// ProseMirror node types
export interface ProseMirrorNode {
  type: {
    name: string;
  };
  attrs?: Record<string, unknown>;
  content?: ProseMirrorNode[];
  text?: string;
  firstChild?: ProseMirrorNode;
  descendants?: (node: ProseMirrorNode) => void;
}

// Transaction types
export interface ProseMirrorTransaction {
  steps: Array<{
    stepType: string;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

// BlockNote render props
export interface BlockNoteRenderProps {
  block: {
    id: string;
    type: string;
    props: Record<string, unknown>;
  };
  contentRef: React.RefObject<HTMLDivElement>;
  [key: string]: unknown;
}

// Error types
export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

// Generic result types
export interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

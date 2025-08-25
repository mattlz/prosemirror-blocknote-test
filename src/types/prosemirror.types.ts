/**
 * ProseMirror and BlockNote internal types
 * These are simplified interfaces for the complex internal types
 */

/**
 * ProseMirror node structure
 */
export interface PMNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: PMNode[];
  marks?: PMMarks[];
  text?: string;
}

/**
 * ProseMirror mark structure  
 */
export interface PMMarks {
  type: string;
  attrs?: Record<string, unknown>;
}

/**
 * ProseMirror document structure
 */
export interface PMDocument {
  type: 'doc';
  content: PMNode[];
}

/**
 * BlockNote block structure
 */
export interface BlockNoteBlock {
  id: string;
  type: string;
  props: Record<string, unknown>;
  content?: BlockNoteBlock[];
  children?: BlockNoteBlock[];
}

/**
 * Remote cursor position
 */
export interface RemoteCursorPosition {
  userId: string;
  name: string;
  color: string;
  position: number;
}
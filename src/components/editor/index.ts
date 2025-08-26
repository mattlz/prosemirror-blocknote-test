export { BlockNoteEditor, BlockNoteEditorComponent } from "./block-note-editor";

// Export manager components for advanced usage
export { EditorSyncManager, useEditorSyncEvents } from "./editor-sync-manager";
export { EditorPresenceManager, usePresenceDisplay } from "./editor-presence-manager";
export { EditorCommentManager, useCommentStyles, useCommentOperations } from "./editor-comment-manager";
export { EditorDevLogger, useDevLogger, usePerformanceMonitor } from "./editor-dev-logger";
export { PresenceAvatars } from "./presence-avatars";
export { createRemoteCursorPlugin } from "./remote-cursor-plugin";
export { default as Editor } from "./editor-body";
export { EditorBody } from "./editor-body";
export { EditorShell } from "./editor-shell";

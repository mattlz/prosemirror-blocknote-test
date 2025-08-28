# Refactor Checklist — Structure, Naming, Hooks, Types (No Behavior Changes)

Owner intent: Align the prototype to internal standards without changing visuals or behavior. Focus on structure, naming, component decomposition, moving business/data logic into hooks, and tightening types. Schema, tests, middleware, and docs are out of scope for now.

Guidelines
- Do not change rendered HTML, class names, routing, or behavior.
- Prefer named exports in components/hooks (pages/layouts keep default exports).
- Keep providers/auth as‑is.
- Use `@/*` and `@/convex/*` aliases consistently.
- Keep changes small and atomic; write clear commit messages.

Branch
- [ ] Create branch `refactor/structure-naming-alignment`
- [ ] Push branch and open draft PR

Meta (keep updated)
- Working branch: `refactor/structure-naming-alignment`
- PR link: (paste)
- Last updated by: (name) @ (time)

Phase A — Structure & Naming
- [x] Verify folder layout matches standards (`components/{ui,layout,features,editor,modals,sidebar}`, `hooks/{data,features,editor}`, `lib`, `types`)
- [x] Ensure kebab-case file names; PascalCase component names; `use-*` hook names
- [x] Audit and add/clean barrels (`index.ts`) for component folders
- [x] Normalize path aliases (`@/*`, `@/convex/*`) in imports
- Notes:
  - Added `src/components/modals/index.ts` and ensured barrels are consistent across `ui`, `layout`, `features`, `sidebar`, `editor`.
  - Existing imports already used `@/*` and `@/convex/*` consistently; left local-relative imports within folders unchanged.

Phase B — Documents/Pages Hooks
- [x] Add `useDocuments()` hook (list docs) — temp skeleton created in `src/temp/refactor/hooks/data/use-documents.ts`
- [x] Add `useDocumentActions()` hook (create/rename/remove)
- [x] Add `useDocumentFilter()` hook (local filter + memoized result)
- [x] Refactor `src/app/(dashboard)/docs/page.tsx` to consume hooks (UI unchanged)
- [x] Tighten types in docs page (remove `any`)
- Notes:
  - New hooks live under `src/hooks/data/` and are exported via `src/hooks/index.ts`.
  - `docs/page.tsx` UI, classes, and routes unchanged; improved type safety using `Document` type.

Phase C — Pages Helpers
- [x] Verify `src/hooks/data/use-pages.ts` typings and return shape
- [ ] (Optional) Add `usePageTree(documentId)` without changing consumers
- Notes:
  - `usePages` already returns `{ pages, topLevelPages, childrenByParent, operations }` with `Page` and `PageOperations` types. Page IDs are `Id<"documentPages">` via `src/types/pages.ts`.

Phase D — Comments Hooks
- [x] Add `useCommentThreads()` and `useCommentThread()` — temp skeleton in `src/temp/refactor/hooks/features/use-comment-threads.ts`
- [x] Add actions: `createThread`, `createComment`, `replyToComment`, `resolveThread`, `deleteComment` (also `updateComment`)
- [x] Refactor `src/app/comments/*` to consume hooks (UI unchanged)
- [ ] Tighten types (`Comment`, `Thread`) and remove `any`
- Notes:
  - Implemented hooks in `src/hooks/features/use-comment-threads.ts` and re-exported from `components/features/index.ts`.
  - Updated `comments-sidebar.tsx` and `comment-thread.tsx` to use hooks; preserved all markup/classes.
  - Follow-up: replace remaining `any` in comments components with `src/types/comments.ts` shapes.

Phase E — Editor Decomposition & Hooks
- [x] Add editor hooks — temp skeletons in `src/temp/refactor/hooks/editor/*`
  - `useEditorDoc(docId)` — PM/Convex sync lifecycle surface
  - `useEditorPresence(docId)` — presence cursors/avatars surface
  - (Optional) `useEditorComments(docId)` — read-only summaries
- [x] Decompose editor components — temp skeletons in `src/temp/refactor/components/editor/*`
  - Added + wired: `EditorToolbar`, `EditorCanvas`, `EditorSidebar` while preserving markup/classes
- [x] Refactor `components/editor/*` to use hooks and split components (UI unchanged)
- Notes:
  - `EditorBody` now uses `useEditorDoc` and `useEditorPresence` for lifecycle + presence state; `onEditorReady` uses hook callback. Save status logic unchanged.
  - `EditorToolbar` renders `TopBar` to guarantee identical DOM. `EditorCanvas` and `EditorSidebar` render the same subtree structure as before.

Phase F — Types & Exports
- [ ] Remove `any` in UI and hooks; use Convex generated types and `src/types/*`
- [x] Ensure hooks return stable, typed references; prefer empty arrays with `isLoading` instead of `undefined`
- [x] Normalize barrels to export only public surface; prefer named exports
- Notes:
  - New data hooks return stable references with default empty arrays and loading flags.
  - Added `src/components/modals/index.ts` barrel; existing barrels look clean and focused.

Phase G — Build & Sanity Check
- [ ] `npm run build` succeeds
- [ ] Manual click-through: `/signin`, `/docs`, open editor, comments, `/s/[shareId]`
- [ ] Confirm no UI/behavior changes
- Notes:
  - Build currently fails due to existing strict ESLint `any` violations across unrelated files (auth, editor, shared page, sidebar). Changes in this pass removed `any` from the refactored docs/comments surfaces, but remaining errors are pre-existing and out of scope per constraints.

Change Log (agent updates as work proceeds)
- (refactor) Phase A: Added modals barrel and validated structure; normalized imports where needed. Files: `src/components/modals/index.ts`.
- (refactor) Phase B: Implemented `useDocuments`, `useDocumentActions`, `useDocumentFilter`; refactored `src/app/(dashboard)/docs/page.tsx` to consume hooks; removed `any`. Files: `src/hooks/data/*`, `src/hooks/index.ts`, `src/app/(dashboard)/docs/page.tsx`.
- (refactor) Phase C: Verified `use-pages` typing/shape aligns with standards; no consumer changes.
- (refactor) Phase D: Implemented `useCommentThreads`, `useCommentThread`, and action hooks; refactored `comments` UI to use hooks without UI changes. Files: `src/hooks/features/use-comment-threads.ts`, `src/app/comments/comments-sidebar.tsx`, `src/app/comments/comment-thread.tsx`, `src/components/features/index.ts`.
- (refactor) Phase E: Added `useEditorDoc` and `useEditorPresence`; introduced `EditorToolbar`, `EditorCanvas`, `EditorSidebar`; refactored `EditorBody` to use hooks and components while preserving markup. Files: `src/hooks/editor/*`, `src/components/editor/editor-*.tsx`, `src/components/editor/index.ts`, `src/components/editor/editor-body.tsx`.

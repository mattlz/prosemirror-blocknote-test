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
- [ ] Verify folder layout matches standards (`components/{ui,layout,features,editor,modals,sidebar}`, `hooks/{data,features,editor}`, `lib`, `types`)
- [ ] Ensure kebab-case file names; PascalCase component names; `use-*` hook names
- [ ] Audit and add/clean barrels (`index.ts`) for component folders
- [ ] Normalize path aliases (`@/*`, `@/convex/*`) in imports
- Notes:

Phase B — Documents/Pages Hooks
- [ ] Add `useDocuments()` hook (list docs) — temp skeleton created in `src/temp/refactor/hooks/data/use-documents.ts`
- [ ] Add `useDocumentActions()` hook (create/rename/remove)
- [ ] Add `useDocumentFilter()` hook (local filter + memoized result)
- [ ] Refactor `src/app/(dashboard)/docs/page.tsx` to consume hooks (UI unchanged)
- [ ] Tighten types in docs page (remove `any`)
- Notes:

Phase C — Pages Helpers
- [ ] Verify `src/hooks/data/use-pages.ts` typings and return shape
- [ ] (Optional) Add `usePageTree(documentId)` without changing consumers
- Notes:

Phase D — Comments Hooks
- [ ] Add `useCommentThreads()` and `useCommentThread()` — temp skeleton in `src/temp/refactor/hooks/features/use-comment-threads.ts`
- [ ] Add actions: `createThread`, `createComment`, `replyToComment`, `resolveThread`, `deleteComment`
- [ ] Refactor `src/app/comments/*` to consume hooks (UI unchanged)
- [ ] Tighten types (`Comment`, `Thread`) and remove `any`
- Notes:

Phase E — Editor Decomposition & Hooks
- [ ] Add editor hooks — temp skeletons in `src/temp/refactor/hooks/editor/*`
  - `useEditorDoc(docId)` — PM/Convex sync lifecycle surface
  - `useEditorPresence(docId)` — presence cursors/avatars surface
  - (Optional) `useEditorComments(docId)` — read-only summaries
- [ ] Decompose editor components — temp skeletons in `src/temp/refactor/components/editor/*`
  - `EditorToolbar`, `EditorCanvas`, `EditorSidebar` (keep `editor-shell.tsx` as orchestrator)
- [ ] Refactor `components/editor/*` to use hooks and split components (UI unchanged)
- Notes:

Phase F — Types & Exports
- [ ] Remove `any` in UI and hooks; use Convex generated types and `src/types/*`
- [ ] Ensure hooks return stable, typed references; prefer empty arrays with `isLoading` instead of `undefined`
- [ ] Normalize barrels to export only public surface; prefer named exports
- Notes:

Phase G — Build & Sanity Check
- [ ] `npm run build` succeeds
- [ ] Manual click-through: `/signin`, `/docs`, open editor, comments, `/s/[shareId]`
- [ ] Confirm no UI/behavior changes
- Notes:

Change Log (agent updates as work proceeds)
- (commit) — summary, files touched, rationale
- ...


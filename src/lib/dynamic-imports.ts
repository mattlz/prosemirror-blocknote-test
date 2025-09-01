import { lazy } from "react";

export const LazyEditorShell = lazy(() =>
  import("@/components/editor/editor-shell").then(mod => ({ default: mod.EditorShell }))
);


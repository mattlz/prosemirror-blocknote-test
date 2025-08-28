"use client";
import { useMemo, useState } from "react";

/**
 * useEditorPresence — Manage presence-related UI state (e.g., cursor labels toggle).
 */
export function useEditorPresence(initialShowLabels = true) {
  const [showCursorLabels, setShowCursorLabels] = useState<boolean>(initialShowLabels);

  return useMemo(() => ({ showCursorLabels, setShowCursorLabels }), [showCursorLabels]);
}


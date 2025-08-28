"use client";
import { useMemo, useState } from "react";
import type { Document } from "@/types";

/**
 * useDocuments — lists documents.
 * Skeleton implementation for refactor; replace with Convex integration.
 */
export function useDocuments(): { docs: Document[]; isLoading: boolean } {
  // Placeholder: return empty docs with loading=false to avoid side effects.
  return { docs: [], isLoading: false };
}

/**
 * useDocumentActions — create/rename/remove documents.
 * Skeleton implementation; replace with Convex mutations.
 */
export function useDocumentActions() {
  return {
    async create(_title: string): Promise<void> {
      throw new Error("useDocumentActions.create: skeleton not implemented");
    },
    async rename(_id: string, _title: string): Promise<void> {
      throw new Error("useDocumentActions.rename: skeleton not implemented");
    },
    async remove(_id: string): Promise<void> {
      throw new Error("useDocumentActions.remove: skeleton not implemented");
    },
  } as const;
}

/**
 * useDocumentFilter — local filter with memoized result.
 */
export function useDocumentFilter(docs: Document[]) {
  const [filter, setFilter] = useState("");
  const filtered = useMemo(
    () => docs.filter(d => d.title.toLowerCase().includes(filter.toLowerCase())),
    [docs, filter]
  );
  return { filter, setFilter, filtered } as const;
}


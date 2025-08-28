import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Document } from "@/types/documents";

/**
 * useDocuments — Fetch list of documents.
 * Returns a stable empty array until data loads.
 */
export function useDocuments(): { documents: Document[]; isLoading: boolean } {
  const docs = useQuery(api.documents.list, {}) as Document[] | undefined;
  const documents: Document[] = docs ?? [];
  return { documents, isLoading: docs === undefined };
}


import { useMemo, useState } from "react";
import type { Document } from "@/types/documents.types";

/**
 * useDocumentFilter — Local filter state + memoized filtered list.
 */
export function useDocumentFilter(documents: Document[]) {
  const [filter, setFilter] = useState<string>("");

  const filtered = useMemo(() => {
    const term = filter.trim().toLowerCase();
    if (!term) return documents;
    return documents.filter((d) => d.title.toLowerCase().includes(term));
  }, [documents, filter]);

  return { filter, setFilter, filtered };
}


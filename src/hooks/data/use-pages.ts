import { useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { Page, PageOperations } from "@/types";

export function usePages(documentId: Id<"documents"> | null) {
  const pages = useQuery(
    api.pages.list,
    documentId ? { documentId } : "skip"
  ) as Page[] | undefined;
  
  const renamePage = useMutation(api.pages.rename);
  const reorderPage = useMutation(api.pages.reorder);
  const removePage = useMutation(api.pages.remove);
  const createSubpage = useMutation(api.pages.createSubpage);
  
  const safePages = useMemo(() => pages ?? [], [pages]);
  
  const topLevelPages = useMemo(() => 
    safePages.filter(p => !p.parentPageId).sort((a, b) => a.order - b.order), 
    [safePages]
  );
  
  const childrenByParent = useMemo(() => {
    const map: Record<string, Page[]> = {};
    for (const p of safePages) {
      if (p.parentPageId) {
        const key = String(p.parentPageId);
        if (!map[key]) map[key] = [];
        map[key].push(p);
      }
    }
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => a.order - b.order);
    }
    return map;
  }, [safePages]);
  
  const operations: PageOperations = {
    renamePage: async (pageId, title) => {
      await renamePage({ pageId, title });
    },
    reorderPage: async (pageId, beforePageId) => {
      await reorderPage({ pageId, beforePageId });
    },
    removePage: async (pageId) => {
      await removePage({ pageId });
    },
    createSubpage: async (parentPageId, title) => {
      if (!documentId) {
        throw new Error("Cannot create subpage without documentId");
      }
      return await createSubpage({ documentId, parentPageId, title });
    },
  };
  
  return { 
    pages: safePages, 
    topLevelPages, 
    childrenByParent, 
    operations 
  };
}

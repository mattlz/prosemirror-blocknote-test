import { useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Page, PageOperations } from "@/types";
export function usePages(documentId: string | null){
  const raw = useQuery(documentId ? api.pages.list : (api.documents.list as any), documentId ? ({ documentId: documentId as any } as any) : ({} as any));
  const pages = (Array.isArray(raw) ? raw : []) as unknown as Page[];
  const renamePage = useMutation(api.pages.rename);
  const reorderPage = useMutation(api.pages.reorder);
  const removePage = useMutation(api.pages.remove);
  const createSubpage = useMutation(api.pages.createSubpage as any);
  const topLevelPages = useMemo(()=> pages.filter(p=>!p.parentPageId).sort((a,b)=>a.order-b.order), [pages]);
  const childrenByParent = useMemo(()=>{
    const map: Record<string, Page[]> = {};
    for (const p of pages){
      const parentPageId = (p as any).parentPageId as any;
      if (parentPageId){
        const key = String(parentPageId);
        if(!map[key]) map[key] = [];
        map[key].push(p);
      }
    }
    for(const k of Object.keys(map)) map[k].sort((a,b)=>a.order-b.order);
    return map;
  }, [pages]);
  const operations: PageOperations = {
    renamePage: async (pageId, title)=>{ await renamePage({ pageId: pageId as any, title }); },
    reorderPage: async (pageId, beforePageId)=>{ await reorderPage({ pageId: pageId as any, beforePageId: beforePageId as any }); },
    removePage: async (pageId)=>{ await removePage({ pageId: pageId as any }); },
    createSubpage: async (parentPageId, title)=>{ return await createSubpage({ documentId: (pages[0]?.documentId as any) ?? undefined, parentPageId: parentPageId as any, title }) as any; },
  };
  return { pages, topLevelPages, childrenByParent, operations };
}


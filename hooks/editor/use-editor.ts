import { useMemo } from "react";
import { useTiptapSync } from "@convex-dev/prosemirror-sync/tiptap";
import { BlockNoteEditor, nodeToBlock } from "@blocknote/core";
import { api } from "@/convex/_generated/api";
export function useBlockNoteEditor(docId: string, resolveUsers: (ids: string[]) => Promise<any>, threadStore: any){
  const tiptapSync = useTiptapSync(api.example, docId, { snapshotDebounceMs: 1000 });
  const editor = useMemo(()=>{
    if (tiptapSync.initialContent === null) return null;
    const headless = BlockNoteEditor.create({ resolveUsers, _headless: true });
    const blocks: any[] = [];
    const pmNode = headless.pmSchema.nodeFromJSON(tiptapSync.initialContent as any);
    if ((pmNode as any).firstChild){
      (pmNode as any).firstChild.descendants((node: any)=>{ blocks.push(nodeToBlock(node, headless.pmSchema)); return false; });
    }
    return BlockNoteEditor.create({
      resolveUsers,
      comments: { threadStore: threadStore as any },
      _tiptapOptions: { extensions: [tiptapSync.extension] },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiptapSync.initialContent, resolveUsers, threadStore]);
  return { editor, isLoading: tiptapSync.isLoading };
}


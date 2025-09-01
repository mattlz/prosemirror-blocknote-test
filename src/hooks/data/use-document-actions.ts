import { useCallback, useMemo } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type CreateArgs = { title: string; templateKey?: string; documentType?: string; projectId?: Id<"projects"> };
type CreateResult = { documentId: Id<"documents"> };

/**
 * useDocumentActions — Stable wrappers around Convex document mutations.
 */
export function useDocumentActions() {
  const createMutation = useMutation(api.documents.create);
  const renameMutation = useMutation(api.documents.rename);
  const removeMutation = useMutation(api.documents.remove);

  const create = useCallback(async (args: CreateArgs): Promise<CreateResult> => {
    return await createMutation(args);
  }, [createMutation]);

  const rename = useCallback(async (documentId: Id<"documents">, title: string): Promise<void> => {
    await renameMutation({ documentId, title });
  }, [renameMutation]);

  const remove = useCallback(async (documentId: Id<"documents">): Promise<void> => {
    await removeMutation({ documentId });
  }, [removeMutation]);

  return useMemo(() => ({ create, rename, remove }), [create, rename, remove]);
}

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Document } from "@/types";
export function useDocuments(){
  const documents = (useQuery(api.documents.list, {}) ?? []) as unknown as Document[];
  const create = useMutation(api.documents.create);
  const rename = useMutation(api.documents.rename);
  const remove = useMutation(api.documents.remove);
  return { documents, create, rename, remove };
}


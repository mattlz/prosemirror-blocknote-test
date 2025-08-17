import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
export function usePresence(docId: string){
  const presence = useQuery(api.presence.list, { docId }) ?? [];
  const heartbeat = useMutation(api.presence.heartbeat);
  return { presence, heartbeat };
}


import type { Id } from '@/convex/_generated/dataModel';

export interface PresenceData {
  _id: Id<"presence">;
  docId: string;
  userId: string;
  name: string;
  color: string;
  cursor: string;
  updatedAt: number;
}

export interface UserPresence {
  userId: string;
  name: string;
  color: string;
}

export interface PresenceAvatarsProps {
  docId?: string;
  className?: string;
}
"use client";
import type { ReactElement } from "react";
import { memo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { PresenceData, AuthUser } from "@/types";

interface PresenceAvatarsProps {
	docId?: string;
	className?: string;
}

/**
 * PresenceAvatars - Shows avatars of users currently viewing the document
 * 
 * @param props - Component props
 * @returns JSX element showing user avatars
 */
export const PresenceAvatars = memo(function PresenceAvatars({ 
	docId, 
	className 
}: PresenceAvatarsProps): ReactElement {
	if (!docId) {
		return <div style={{ height: 0 }} />;
	}
	return <PresenceAvatarsInner docId={docId} className={className} />;
});

interface PresenceAvatarsInnerProps {
	docId: string;
	className?: string;
}

function PresenceAvatarsInner({ docId, className }: PresenceAvatarsInnerProps): ReactElement {
	const presence = (useQuery(api.presence.list, { docId }) ?? []) as PresenceData[];
	const me = useQuery(api.comments.me, {}) as AuthUser | null;
	const currentUserId = me?.userId ?? null;
	
	// Filter out current user from presence display
	const otherUsers = presence.filter(p => p.userId !== currentUserId);
	
	return (
		<div className={["flex items-center -space-x-2", className].filter(Boolean).join(" ")}> 
			{otherUsers.map((p, idx) => (
				<div
					key={p.userId ?? idx}
					title={p.name}
					className="relative inline-flex h-7 w-7 items-center justify-center rounded-full ring-2 ring-white text-[11px] font-medium text-white"
					style={{ background: p.color }}
				>
					{p.name.slice(0, 1).toUpperCase()}
				</div>
			))}
		</div>
	);
}

"use client";
import type { ReactElement } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface PresenceAvatarsProps {
	docId: string | null;
	className?: string;
}

export function PresenceAvatars(props: PresenceAvatarsProps): ReactElement {
	if (!props.docId) return <div style={{ height: 0 }} /> as any;
	return <PresenceAvatarsInner docId={props.docId} className={props.className} /> as any;
}

function PresenceAvatarsInner({ docId, className }: { docId: string; className?: string }): ReactElement {
	const presence = useQuery(api.presence.list, { docId }) ?? [];
	return (
		<div className={["flex items-center -space-x-2", className].filter(Boolean).join(" ")}> 
			{presence.map((p, idx) => (
				<div
					key={(p as any).userId ?? idx}
					title={(p as any).name}
					className="relative inline-flex h-7 w-7 items-center justify-center rounded-full ring-2 ring-white text-[11px] font-medium text-white"
					style={{ background: (p as any).color as any }}
				>
					{(p as any).name.slice(0, 1).toUpperCase()}
				</div>
			))}
		</div>
	);
}

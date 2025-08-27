"use client";
import { ReactNode, type ReactElement, useMemo } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";

const DEFAULT_CONVEX_URL: string = "http://localhost:3210";

export function Providers({ children }: { children: ReactNode }): ReactElement {
	const url: string = process.env.NEXT_PUBLIC_CONVEX_URL || DEFAULT_CONVEX_URL;
	const client: ConvexReactClient = useMemo(() => new ConvexReactClient(url), [url]);
	return (
		<ConvexAuthProvider client={client}>
			{children}
		</ConvexAuthProvider>
	);
}



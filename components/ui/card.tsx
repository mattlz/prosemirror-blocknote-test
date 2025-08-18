import * as React from "react";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): React.ReactElement {
	return <div className={["rounded-xl border bg-white shadow-sm", className].filter(Boolean).join(" ")} {...props} />;
}
export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): React.ReactElement {
	return <div className={["border-b px-4 py-3", className].filter(Boolean).join(" ")} {...props} />;
}
export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): React.ReactElement {
	return <div className={["px-4 py-3", className].filter(Boolean).join(" ")} {...props} />;
}

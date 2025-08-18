"use client";
import * as React from "react";

export type ButtonVariant = "default" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	size?: ButtonSize;
}

function classNames(classes: Array<string | false | null | undefined>): string {
	return classes.filter(Boolean).join(" ");
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
	{ className, variant = "default", size = "md", ...props },
	ref
) {
	const base = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 disabled:opacity-50 disabled:pointer-events-none";
	const variants: Record<ButtonVariant, string> = {
		default: "bg-black text-white hover:bg-neutral-800",
		outline: "border border-neutral-200 bg-white hover:bg-neutral-50",
		ghost: "hover:bg-neutral-50",
	};
	const sizes: Record<ButtonSize, string> = {
		sm: "h-8 px-2 text-sm",
		md: "h-9 px-3 text-sm",
		lg: "h-10 px-4",
	};
	return (
		<button ref={ref} className={classNames([base, variants[variant], sizes[size], className])} {...props} />
	);
});

export default Button;

"use client";
import * as React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
	{ className, ...props },
	ref
) {
	return <input ref={ref} className={["h-9 w-full rounded-md border px-3 text-sm", className].filter(Boolean).join(" ")} {...props} />;
});

export default Input;

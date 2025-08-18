"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactElement } from "react";
import { SignUpForm } from "@/components/auth";

export default function SignUpPage(): ReactElement {
	const router = useRouter();
	return (
		<div className="grid min-h-dvh place-items-center p-6">
			<div className="w-full max-w-sm rounded-xl border bg-white p-6 shadow-sm">
				<h1 className="text-xl font-semibold">Create account</h1>
				<p className="mt-1 text-sm text-neutral-600">Sign up with email and password</p>
				<SignUpForm onSuccess={() => router.replace("/docs")} />
				<p className="mt-3 text-sm text-neutral-600">
					Already have an account? <Link className="underline" href="/signin">Sign in</Link>
				</p>
			</div>
		</div>
	);
}


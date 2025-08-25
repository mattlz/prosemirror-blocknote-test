"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactElement } from "react";
import { SignInForm } from "@/components/auth";

export default function SignInPage(): ReactElement {
	const router = useRouter();
	
	const handleSignInSuccess = () => {
		router.replace("/docs");
	};
	
	return (
		<div className="grid min-h-dvh place-items-center p-6">
			<div className="w-full max-w-sm rounded-xl border bg-white p-6 shadow-sm">
				<h1 className="text-xl font-semibold">Sign in</h1>
				<p className="mt-1 text-sm text-neutral-600">Use your email and password</p>
				<SignInForm onSuccess={handleSignInSuccess} />
				<p className="mt-3 text-sm text-neutral-600">
					No account? <Link className="underline" href="/signup">Create one</Link>
				</p>
			</div>
		</div>
	);
}


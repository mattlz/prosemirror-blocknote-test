"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (pathname !== "/") return; // only act on root
    try {
      const last = localStorage.getItem("lastDocId");
      if (last) {
        router.replace(`/docs/${last}`);
      } else {
        router.replace("/docs");
      }
    } catch {
      router.replace("/docs");
    }
  }, [router, pathname]);
  return (
    <div className="grid min-h-dvh place-items-center p-6">
      <div className="w-full max-w-sm rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Welcome</h1>
        <p className="mt-1 text-sm text-neutral-600">Sign in to continue</p>
        <div className="mt-4">
          <Link className="inline-flex h-9 items-center rounded-md bg-black px-3 text-white" href="/signin">Sign in</Link>
        </div>
      </div>
    </div>
  );
}

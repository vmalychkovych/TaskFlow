"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/components/providers/auth-provider";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, status } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status === "ready" && !session) {
      const nextPath = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${nextPath}`);
    }
  }, [pathname, router, session, status]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="glass-panel rounded-[1.5rem] px-6 py-5 text-sm text-slate-600">
          Checking your session...
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="glass-panel rounded-[1.5rem] px-6 py-5 text-sm text-slate-600">
          Redirecting to login...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

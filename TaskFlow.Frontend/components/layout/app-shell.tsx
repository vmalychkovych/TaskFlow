"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FolderKanban,
  ListChecks,
  LogOut,
  Orbit,
  PanelsTopLeft,
  Rows3,
} from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/cn";

const navigation = [
  { href: "/workspaces", label: "Workspaces", icon: PanelsTopLeft, match: "section" },
  { href: "/projects", label: "Projects", icon: FolderKanban, match: "section" },
  { href: "/tasks", label: "All Tasks", icon: Rows3, match: "exact" },
  { href: "/tasks/my", label: "My Tasks", icon: ListChecks, match: "section" },
  { href: "/tasks/unassigned", label: "Unassigned", icon: Orbit, match: "section" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, session, signOut, status } = useAuth();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  if (status === "loading" || !session) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div className="app-grid">
      <aside className="border-r border-white/50 bg-slate-950 px-5 py-6 text-white">
        <div className="mb-8 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <p className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
            TaskFlow
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Workspace-first task management on top of your .NET API.
          </p>
        </div>

        <nav className="space-y-2">
          {navigation.map(({ href, icon: Icon, label, match }) => {
            const active =
              match === "exact"
                ? pathname === href
                : pathname === href || pathname.startsWith(`${href}/`);

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                  active
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-300 hover:bg-white/8 hover:text-white",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Signed in</p>
          <p className="mt-3 font-medium text-white">
            {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "Authenticated user"}
          </p>
          <p className="mt-1 text-sm text-slate-300">
            {currentUser?.email ?? session.email}
          </p>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/12 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="min-w-0 px-5 py-5 md:px-7 md:py-6">{children}</div>
    </div>
  );
}

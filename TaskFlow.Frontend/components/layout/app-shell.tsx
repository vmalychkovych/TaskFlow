"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ListChecks,
  LogOut,
  Orbit,
  Plus,
  PanelsTopLeft,
  Rows3,
  Sparkles,
} from "lucide-react";

import { TaskFlowBrand } from "@/components/branding/taskflow-brand";
import {
  QuickCreateHub,
} from "@/components/forms/quick-create-hub";
import { useAuth } from "@/components/providers/auth-provider";
import { useApiList } from "@/hooks/use-api-list";
import { cn } from "@/lib/cn";
import { getWorkspaces } from "@/lib/api";
import { QUICK_CREATE_EVENT, type QuickCreateRequest } from "@/lib/quick-create-events";
import type { Workspace } from "@/lib/types";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, session, signOut, status } = useAuth();
  const workspaceState = useApiList<Workspace>(getWorkspaces);
  const [createRequest, setCreateRequest] = useState<QuickCreateRequest | null>(null);

  const activeWorkspaceId = useMemo(() => {
    const match = pathname.match(/^\/workspaces\/([^/]+)/);
    return match?.[1] ?? null;
  }, [pathname]);

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  useEffect(() => {
    function handleQuickCreate(event: Event) {
      const customEvent = event as CustomEvent<QuickCreateRequest>;
      setCreateRequest(customEvent.detail);
    }

    window.addEventListener(QUICK_CREATE_EVENT, handleQuickCreate as EventListener);
    return () => window.removeEventListener(QUICK_CREATE_EVENT, handleQuickCreate as EventListener);
  }, []);

  if (status === "loading" || !session) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div className="app-grid">
      <aside className="border-r border-white/8 bg-[linear-gradient(180deg,#080c1d_0%,#090f24_100%)] px-5 py-6 text-white">
        <div className="mb-8 rounded-[1.8rem] border border-white/10 bg-white/5 p-5 shadow-[0_22px_50px_rgba(3,7,18,0.35)]">
          <TaskFlowBrand compact />
          <p className="mt-4 text-sm leading-6 text-slate-300">
            Modern task control with quick-create actions, a deeper contrast system, and a cleaner product feel.
          </p>
        </div>

        <nav className="space-y-6">
          <SidebarGroup
            title="Workspaces"
            onCreate={() => setCreateRequest({ target: "workspace" })}
          >
            <SidebarLink
              href="/workspaces"
              label="All workspaces"
              icon={PanelsTopLeft}
              active={pathname === "/workspaces"}
            />

            <div className="space-y-2 pt-2">
              {workspaceState.loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-10 rounded-2xl bg-white/6" />
                ))
              ) : workspaceState.items.length > 0 ? (
                workspaceState.items.map((workspace) => (
                  <SidebarWorkspaceLink
                    key={workspace.id}
                    workspace={workspace}
                    active={activeWorkspaceId === workspace.id}
                  />
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-400">
                  Create your first workspace to anchor the whole app flow.
                </div>
              )}
            </div>
          </SidebarGroup>

          <SidebarGroup
            title="Tasks"
            onCreate={() => setCreateRequest({ target: "task" })}
          >
            <SidebarLink
              href="/tasks"
              label="All tasks"
              icon={Rows3}
              active={pathname === "/tasks"}
            />
            <SidebarLink
              href="/tasks/my"
              label="My tasks"
              icon={ListChecks}
              active={pathname === "/tasks/my" || pathname.startsWith("/tasks/my/")}
            />
            <SidebarLink
              href="/tasks/unassigned"
              label="Unassigned"
              icon={Orbit}
              active={pathname === "/tasks/unassigned" || pathname.startsWith("/tasks/unassigned/")}
            />
          </SidebarGroup>
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
            className="button-secondary mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="min-w-0 px-5 py-5 md:px-7 md:py-6">{children}</div>
      <QuickCreateHub request={createRequest ? { ...createRequest, target: createRequest.target } : null} onClose={() => setCreateRequest(null)} />
    </div>
  );
}

function SidebarGroup({
  title,
  onCreate,
  children,
}: {
  title: string;
  onCreate: () => void;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between px-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
          {title}
        </p>
        <button
          type="button"
          onClick={onCreate}
          aria-label={`Create ${title.toLowerCase()}`}
          className="button-secondary inline-flex h-8 w-8 items-center justify-center rounded-full"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function SidebarLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
        active
          ? "bg-[linear-gradient(135deg,rgba(124,92,255,0.98),rgba(82,208,255,0.95))] text-white shadow-[0_16px_32px_rgba(76,91,255,0.26)]"
          : "text-slate-300 hover:bg-white/8 hover:text-white",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

function SidebarWorkspaceLink({
  workspace,
  active,
}: {
  workspace: Workspace;
  active: boolean;
}) {
  return (
    <Link
      href={`/workspaces/${workspace.id}`}
      className={cn(
        "group flex items-start gap-3 rounded-2xl px-4 py-3 transition",
        active
          ? "bg-[linear-gradient(135deg,rgba(124,92,255,0.25),rgba(82,208,255,0.18))] text-white shadow-[0_16px_32px_rgba(24,33,76,0.28)]"
          : "text-slate-300 hover:bg-white/6 hover:text-white",
      )}
    >
      <div className={cn(
        "mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition",
        active
          ? "border-cyan-300/30 bg-cyan-400/12 text-cyan-200"
          : "border-white/10 bg-white/5 text-slate-400 group-hover:text-cyan-200",
      )}>
        <Sparkles className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{workspace.name}</p>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400 group-hover:text-slate-300">
          {workspace.description || "Open the workspace hub and start shaping projects."}
        </p>
      </div>
    </Link>
  );
}

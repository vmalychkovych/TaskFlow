"use client";

import Link from "next/link";
import { Building2, Sparkles } from "lucide-react";

import { AuthGate } from "@/components/auth/auth-gate";
import { DashboardPage } from "@/components/layout/dashboard-page";
import { EmptyState } from "@/components/ui/empty-state";
import { ResourceGrid } from "@/components/ui/resource-grid";
import { SectionCard } from "@/components/ui/section-card";
import { useApiList } from "@/hooks/use-api-list";
import { getWorkspaces } from "@/lib/api";
import type { Workspace } from "@/lib/types";

export default function WorkspacesPage() {
  const state = useApiList<Workspace>(getWorkspaces);

  return (
    <AuthGate>
      <DashboardPage
        eyebrow="Workspaces"
        title="All workspaces"
        description="Your workspace layer is now cleaner: creation lives in the left sidebar modal, while this page stays focused on browsing and drilling into details."
      >
        <SectionCard
          title="Create from the sidebar"
          description="Use the plus button next to Workspaces on the left whenever you want to add a new team space. It keeps creation fast without pushing huge forms into the page body."
          icon={Sparkles}
        >
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="chip-accent rounded-full px-3 py-2 font-medium">
              Workspace +
            </span>
            <span className="chip-neutral rounded-full px-3 py-2">
              Open details
            </span>
            <span className="chip-neutral rounded-full px-3 py-2">
              Manage members
            </span>
          </div>
        </SectionCard>

        <ResourceGrid
          loading={state.loading}
          error={state.error}
          items={state.items}
          emptyState={
            <EmptyState
              title="No workspaces yet"
              description="Create your first workspace from the plus button in the left sidebar."
              icon={Building2}
            />
          }
          renderItem={(workspace) => (
            <article
              key={workspace.id}
              className="surface-card rounded-[1.75rem] p-6 transition duration-200 hover:-translate-y-1 hover:shadow-[0_26px_60px_rgba(4,9,25,0.38)]"
            >
              <p className="chip-accent mb-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
                Workspace
              </p>
              <h2 className="text-gradient-soft font-[family-name:var(--font-heading)] text-3xl font-semibold">
                {workspace.name}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                {workspace.description || "No description yet."}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href={`/workspaces/${workspace.id}`}
                  className="button-primary inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em]"
                >
                  Open workspace
                </Link>
                <Link
                  href={`/workspaces/${workspace.id}/members`}
                  className="button-secondary inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em]"
                >
                  Members
                </Link>
              </div>
            </article>
          )}
        />
      </DashboardPage>
    </AuthGate>
  );
}

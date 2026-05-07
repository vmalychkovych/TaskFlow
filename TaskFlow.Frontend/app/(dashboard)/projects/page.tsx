"use client";

import { useMemo } from "react";
import Link from "next/link";
import { FolderKanban, Sparkles } from "lucide-react";

import { AuthGate } from "@/components/auth/auth-gate";
import { DashboardPage } from "@/components/layout/dashboard-page";
import { EmptyState } from "@/components/ui/empty-state";
import { ResourceGrid } from "@/components/ui/resource-grid";
import { SectionCard } from "@/components/ui/section-card";
import { useApiList } from "@/hooks/use-api-list";
import { getProjects, getWorkspaces } from "@/lib/api";
import type { Project, Workspace } from "@/lib/types";

export default function ProjectsPage() {
  const state = useApiList<Project>(getProjects);
  const workspaceState = useApiList<Workspace>(getWorkspaces);
  const workspaceNames = useMemo(
    () => new Map(workspaceState.items.map((workspace) => [workspace.id, workspace.name])),
    [workspaceState.items],
  );

  return (
    <AuthGate>
      <DashboardPage
        eyebrow="Projects"
        title="Project inventory"
        description="Projects now stay cleaner too: create them from the sidebar modal, then use this page for browsing, member management, and Discord wiring."
      >
        <SectionCard
          title="Create from the sidebar"
          description="Use the plus button next to Projects on the left. The modal already asks for the parent workspace, so project creation stays quick and structured."
          icon={Sparkles}
        >
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="chip-accent rounded-full px-3 py-2 font-medium">
              Projects +
            </span>
            <span className="chip-neutral rounded-full px-3 py-2">
              Open project
            </span>
            <span className="chip-neutral rounded-full px-3 py-2">
              Members
            </span>
            <span className="chip-neutral rounded-full px-3 py-2">
              Discord settings
            </span>
          </div>
        </SectionCard>

        <ResourceGrid
          loading={state.loading}
          error={state.error}
          items={state.items}
          emptyState={
            <EmptyState
              title="No projects found"
              description="Create your first project from the plus button in the left sidebar."
              icon={FolderKanban}
            />
          }
          renderItem={(project) => (
            <article
              key={project.id}
              className="surface-card rounded-[1.75rem] p-6 transition duration-200 hover:-translate-y-1 hover:shadow-[0_26px_60px_rgba(4,9,25,0.38)]"
            >
              <p className="chip-accent mb-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
                Project
              </p>
              <h2 className="font-[family-name:var(--font-heading)] text-gradient-soft text-3xl font-semibold">
                {project.name}
              </h2>
              <p className="mt-3 min-h-14 text-sm leading-7 text-slate-300">
                {project.description || "No description yet."}
              </p>
              <p className="mt-5 text-xs uppercase tracking-[0.22em] text-slate-400">
                Workspace
              </p>
              <p className="mt-2 text-sm font-medium text-slate-200">
                {workspaceNames.get(project.workspaceId) ?? project.workspaceId}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={`/projects/${project.id}`}
                  className="button-primary inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em]"
                >
                  Open project
                </Link>
                <Link
                  href={`/projects/${project.id}/members`}
                  className="button-secondary inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em]"
                >
                  Members
                </Link>
                <Link
                  href={`/projects/${project.id}/discord`}
                  className="button-secondary inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em]"
                >
                  Discord settings
                </Link>
              </div>
            </article>
          )}
        />
      </DashboardPage>
    </AuthGate>
  );
}

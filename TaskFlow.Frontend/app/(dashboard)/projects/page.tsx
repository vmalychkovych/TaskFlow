"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FolderKanban } from "lucide-react";

import { AuthGate } from "@/components/auth/auth-gate";
import { CreateResourceCard } from "@/components/forms/create-resource-card";
import { DashboardPage } from "@/components/layout/dashboard-page";
import { useAuth } from "@/components/providers/auth-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { ResourceGrid } from "@/components/ui/resource-grid";
import { useApiList } from "@/hooks/use-api-list";
import { createProject, getProjects, getWorkspaces } from "@/lib/api";
import type { Project, Workspace } from "@/lib/types";

export default function ProjectsPage() {
  const { session } = useAuth();
  const state = useApiList<Project>(getProjects);
  const workspaceState = useApiList<Workspace>(getWorkspaces);
  const [createError, setCreateError] = useState<string | null>(null);

  const workspaceOptions = useMemo(
    () =>
      workspaceState.items.length > 0
        ? workspaceState.items.map((workspace) => ({
            label: workspace.name,
            value: workspace.id,
          }))
        : [{ label: "Load workspaces first", value: "" }],
    [workspaceState.items],
  );

  async function handleCreate(values: Record<string, string>) {
    if (!session) {
      return;
    }

    setCreateError(null);

    try {
      await createProject(session, {
        name: values.name.trim(),
        description: values.description.trim(),
        workspaceId: values.workspaceId,
      });
      await state.reload();
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Unable to create project.");
    }
  }

  return (
    <AuthGate>
      <DashboardPage
        eyebrow="Projects"
        title="Project inventory"
        description="This list is already wired to your project access rules and gives you a natural home for member management and Discord settings."
      >
        <CreateResourceCard
          title="Create a project"
          description="Attach a new project to one of your workspaces so tasks, members, and Discord routing have a proper home."
          submitLabel="Create project"
          savingLabel="Creating..."
          textFields={[
            { id: "name", label: "Project name", placeholder: "Launch Sprint Alpha" },
            {
              id: "description",
              label: "Description",
              placeholder: "What this project is trying to achieve",
              type: "textarea",
            },
          ]}
          selectFields={[
            {
              id: "workspaceId",
              label: "Workspace",
              options: workspaceOptions,
            },
          ]}
          initialValues={{
            name: "",
            description: "",
            workspaceId: workspaceOptions[0]?.value ?? "",
          }}
          error={createError ?? workspaceState.error}
          onSubmit={handleCreate}
        />

        <ResourceGrid
          loading={state.loading}
          error={state.error}
          items={state.items}
          emptyState={
            <EmptyState
              title="No projects found"
              description="Once projects exist in the API, this grid will fill automatically."
              icon={FolderKanban}
            />
          }
          renderItem={(project) => (
            <article
              key={project.id}
              className="rounded-[1.5rem] border border-white/70 bg-white/90 p-5 shadow-sm"
            >
              <p className="mb-3 inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                Project
              </p>
              <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-slate-950">
                {project.name}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {project.description || "No description yet."}
              </p>
              <p className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-400">
                Workspace: {project.workspaceId}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href={`/projects/${project.id}`}
                  className="inline-flex rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Open project
                </Link>
                <Link
                  href={`/projects/${project.id}/members`}
                  className="inline-flex rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Members
                </Link>
                <Link
                  href={`/projects/${project.id}/discord`}
                  className="inline-flex rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
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

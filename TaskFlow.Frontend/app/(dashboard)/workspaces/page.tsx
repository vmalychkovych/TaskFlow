"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2 } from "lucide-react";

import { AuthGate } from "@/components/auth/auth-gate";
import { CreateResourceCard } from "@/components/forms/create-resource-card";
import { DashboardPage } from "@/components/layout/dashboard-page";
import { useAuth } from "@/components/providers/auth-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { ResourceGrid } from "@/components/ui/resource-grid";
import { useApiList } from "@/hooks/use-api-list";
import { createWorkspace, getWorkspaces } from "@/lib/api";
import type { Workspace } from "@/lib/types";

export default function WorkspacesPage() {
  const { session } = useAuth();
  const state = useApiList<Workspace>(getWorkspaces);
  const [createError, setCreateError] = useState<string | null>(null);

  async function handleCreate(values: Record<string, string>) {
    if (!session) {
      return;
    }

    setCreateError(null);

    try {
      await createWorkspace(session, {
        name: values.name.trim(),
        description: values.description.trim(),
      });
      await state.reload();
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Unable to create workspace.");
    }
  }

  return (
    <AuthGate>
      <DashboardPage
        eyebrow="Workspaces"
        title="All workspaces"
        description="This list is now wired for create plus drill-down into workspace details and membership flows."
      >
        <CreateResourceCard
          title="Create a workspace"
          description="Spin up a new team space before inviting members or creating projects inside it."
          submitLabel="Create workspace"
          savingLabel="Creating..."
          textFields={[
            { id: "name", label: "Workspace name", placeholder: "Growth Ops" },
            {
              id: "description",
              label: "Description",
              placeholder: "What this workspace is for",
              type: "textarea",
            },
          ]}
          initialValues={{ name: "", description: "" }}
          error={createError}
          onSubmit={handleCreate}
        />

        <ResourceGrid
          loading={state.loading}
          error={state.error}
          items={state.items}
          emptyState={
            <EmptyState
              title="No workspaces yet"
              description="Create your first workspace on the backend or connect this view to a creation dialog next."
              icon={Building2}
            />
          }
          renderItem={(workspace) => (
            <article
              key={workspace.id}
              className="rounded-[1.5rem] border border-white/70 bg-white/90 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="mb-3 inline-flex rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
                Workspace
              </p>
              <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-slate-950">
                {workspace.name}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {workspace.description || "No description yet."}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href={`/workspaces/${workspace.id}`}
                  className="inline-flex rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Open workspace
                </Link>
                <Link
                  href={`/workspaces/${workspace.id}/members`}
                  className="inline-flex rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
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

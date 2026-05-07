"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Building2, FolderKanban, Plus, Save, Trash2, Users } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import { AuthGate } from "@/components/auth/auth-gate";
import { DashboardPage } from "@/components/layout/dashboard-page";
import { useAuth } from "@/components/providers/auth-provider";
import { SectionCard } from "@/components/ui/section-card";
import { useApiResource } from "@/hooks/use-api-resource";
import { emitQuickCreate } from "@/lib/quick-create-events";
import {
  deleteWorkspace,
  getWorkspaceDetails,
  updateWorkspace,
} from "@/lib/api";

export default function WorkspaceDetailsPage() {
  const params = useParams<{ workspaceId: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const state = useApiResource(getWorkspaceDetails, params.workspaceId);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!state.item) {
      return;
    }

    setName(state.item.name);
    setDescription(state.item.description ?? "");
  }, [state.item]);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session) {
      return;
    }

    setSaving(true);
    setMessage(null);
    setActionError(null);

    try {
      await updateWorkspace(session, params.workspaceId, {
        name: name.trim(),
        description: description.trim(),
      });
      await state.reload();
      setMessage("Workspace updated.");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to update workspace.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!session) {
      return;
    }

    setDeleting(true);
    setMessage(null);
    setActionError(null);

    try {
      await deleteWorkspace(session, params.workspaceId);
      router.push("/workspaces");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to delete workspace.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AuthGate>
      <DashboardPage
        eyebrow="Workspace Details"
        title={state.item?.name ?? "Workspace"}
        description="This page sits directly on top of your workspace details, update, delete, and membership endpoints."
      >
        {state.item ? (
          <section className="grid gap-4 md:grid-cols-3">
            <MetricCard label="Projects" value={state.item.projects.length} icon={FolderKanban} />
            <MetricCard
              label="Tasks inside"
              value={state.item.projects.reduce((sum, project) => sum + project.tasks.length, 0)}
              icon={ArrowRight}
            />
            <MetricCard label="Members" value="Manage" icon={Users} />
          </section>
        ) : null}

        <SectionCard
          title="Workspace settings"
          description="Rename the workspace, tighten the description, or remove it entirely if the space is no longer needed."
          icon={Building2}
        >
          {state.loading ? (
            <div className="space-y-4">
              <div className="h-14 animate-pulse rounded-2xl bg-white/8" />
              <div className="h-36 animate-pulse rounded-2xl bg-white/8" />
            </div>
          ) : state.error ? (
            <div className="status-message status-message--error">
              {state.error}
            </div>
          ) : (
            <form onSubmit={handleSave} className="grid gap-4 lg:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-300">Workspace name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="dashboard-input w-full rounded-2xl px-4 py-3"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-300">Description</span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={4}
                  className="dashboard-input w-full rounded-2xl px-4 py-3"
                />
              </label>

              {message ? (
                <div className="status-message status-message--success lg:col-span-2">
                  {message}
                </div>
              ) : null}

              {actionError ? (
                <div className="status-message status-message--error lg:col-span-2">
                  {actionError}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3 lg:col-span-2">
                <button
                  type="submit"
                  disabled={saving || deleting || !name.trim()}
                  className="button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save workspace"}
                </button>

                <Link
                  href={`/workspaces/${params.workspaceId}/members`}
                  className="button-secondary rounded-full px-5 py-3 text-sm font-semibold"
                >
                  Manage members
                </Link>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving || deleting}
                  className="inline-flex items-center gap-2 rounded-full border border-rose-400/24 bg-rose-500/6 px-5 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/12 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                  {deleting ? "Deleting..." : "Delete workspace"}
                </button>
              </div>
            </form>
          )}
        </SectionCard>

        <SectionCard
          title="Projects in this workspace"
          description="Use this workspace as the main hub: create projects here, open them, and then work inside their kanban boards."
          icon={FolderKanban}
        >
          <div className="mb-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => emitQuickCreate({ target: "project", workspaceId: params.workspaceId })}
              className="button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
            >
              <Plus className="h-4 w-4" />
              Add project
            </button>
            <Link
              href={`/workspaces/${params.workspaceId}/members`}
              className="button-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
            >
              <Users className="h-4 w-4" />
              Workspace members
            </Link>
          </div>

          {state.item && state.item.projects.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {state.item.projects.map((project) => (
                <article
                  key={project.id}
                  className="surface-card rounded-[1.75rem] p-5"
                >
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className="chip-neutral rounded-full px-2.5 py-1 text-xs">
                      {project.tasks.length} task{project.tasks.length === 1 ? "" : "s"}
                    </span>
                    <span className="chip-accent rounded-full px-2.5 py-1 text-xs">
                      {project.tasks.filter((task) => task.status.toLowerCase().includes("done")).length} done
                    </span>
                  </div>
                  <h3 className="text-gradient-soft font-[family-name:var(--font-heading)] text-2xl font-semibold">
                    {project.name}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    {project.description || "No description yet."}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link
                      href={`/projects/${project.id}`}
                      className="button-primary rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em]"
                    >
                      Open board
                    </Link>
                    <Link
                      href={`/projects/${project.id}/members`}
                      className="button-secondary rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em]"
                    >
                      Members
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-white/5 px-5 py-8 text-sm text-slate-300">
              No projects connected to this workspace yet.
            </div>
          )}
        </SectionCard>
      </DashboardPage>
    </AuthGate>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="surface-card rounded-[1.5rem] p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{label}</p>
        <Icon className="h-4 w-4 text-cyan-300" />
      </div>
      <p className="mt-4 font-[family-name:var(--font-heading)] text-4xl font-semibold text-white">
        {value}
      </p>
    </div>
  );
}

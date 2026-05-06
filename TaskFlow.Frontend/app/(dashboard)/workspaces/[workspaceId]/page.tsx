"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, FolderKanban, Save, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import { AuthGate } from "@/components/auth/auth-gate";
import { DashboardPage } from "@/components/layout/dashboard-page";
import { useAuth } from "@/components/providers/auth-provider";
import { SectionCard } from "@/components/ui/section-card";
import { useApiResource } from "@/hooks/use-api-resource";
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
        <SectionCard
          title="Workspace settings"
          description="Rename the workspace, tighten the description, or remove it entirely if the space is no longer needed."
          icon={Building2}
        >
          {state.loading ? (
            <div className="space-y-4">
              <div className="h-14 animate-pulse rounded-2xl bg-white/70" />
              <div className="h-36 animate-pulse rounded-2xl bg-white/70" />
            </div>
          ) : state.error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {state.error}
            </div>
          ) : (
            <form onSubmit={handleSave} className="grid gap-4 lg:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Workspace name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Description</span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                />
              </label>

              {message ? (
                <div className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800 lg:col-span-2">
                  {message}
                </div>
              ) : null}

              {actionError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 lg:col-span-2">
                  {actionError}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3 lg:col-span-2">
                <button
                  type="submit"
                  disabled={saving || deleting || !name.trim()}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save workspace"}
                </button>

                <Link
                  href={`/workspaces/${params.workspaceId}/members`}
                  className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Manage members
                </Link>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving || deleting}
                  className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
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
          description="The details endpoint already returns nested projects, so this screen can branch directly into project-level work."
          icon={FolderKanban}
        >
          {state.item && state.item.projects.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {state.item.projects.map((project) => (
                <article
                  key={project.id}
                  className="rounded-[1.5rem] border border-white/70 bg-white/90 p-5 shadow-sm"
                >
                  <h3 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-slate-950">
                    {project.name}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {project.description || "No description yet."}
                  </p>
                  <p className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-400">
                    {project.tasks.length} task{project.tasks.length === 1 ? "" : "s"}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link
                      href={`/projects/${project.id}`}
                      className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      Open project
                    </Link>
                    <Link
                      href={`/projects/${project.id}/members`}
                      className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      Members
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-white/70 px-5 py-8 text-sm text-slate-600">
              No projects connected to this workspace yet.
            </div>
          )}
        </SectionCard>
      </DashboardPage>
    </AuthGate>
  );
}

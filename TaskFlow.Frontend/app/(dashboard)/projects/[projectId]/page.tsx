"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  FolderKanban,
  MessageSquareMore,
  Save,
  Rows3,
  Trash2,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import { AuthGate } from "@/components/auth/auth-gate";
import { DashboardPage } from "@/components/layout/dashboard-page";
import { useAuth } from "@/components/providers/auth-provider";
import { SectionCard } from "@/components/ui/section-card";
import { useApiResource } from "@/hooks/use-api-resource";
import { deleteProject, getProjectDetails, updateProject } from "@/lib/api";

export default function ProjectDetailsPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const state = useApiResource(getProjectDetails, params.projectId);
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

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session) {
      return;
    }

    setSaving(true);
    setDeleting(false);
    setMessage(null);
    setActionError(null);

    try {
      await updateProject(session, params.projectId, {
        name: name.trim(),
        description: description.trim(),
      });
      await state.reload();
      setMessage("Project updated.");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to update project.");
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
      await deleteProject(session, params.projectId);
      router.push("/projects");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to delete project.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AuthGate>
      <DashboardPage
        eyebrow="Project Details"
        title={state.item?.name ?? "Project"}
        description="This screen is bound to the project details, update, delete, member, and Discord integration endpoints."
      >
        <SectionCard
          title="Project settings"
          description="Keep the project definition tight, then jump from here into members, Discord routing, and task execution."
          icon={FolderKanban}
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
                <span className="text-sm font-medium text-slate-700">Project name</span>
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
                  {saving ? "Saving..." : "Save project"}
                </button>

                <Link
                  href={`/projects/${params.projectId}/members`}
                  className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Manage members
                </Link>

                <Link
                  href={`/projects/${params.projectId}/discord`}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <MessageSquareMore className="h-4 w-4" />
                  Discord settings
                </Link>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving || deleting}
                  className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                  {deleting ? "Deleting..." : "Delete project"}
                </button>
              </div>
            </form>
          )}
        </SectionCard>

        <SectionCard
          title="Project tasks"
          description="The details endpoint already includes task DTOs, so you can branch into task-level work without an extra round trip."
          icon={Rows3}
        >
          {state.item && state.item.tasks.length > 0 ? (
            <div className="space-y-4">
              {state.item.tasks.map((task) => (
                <article
                  key={task.id}
                  className="rounded-[1.5rem] border border-white/70 bg-white/90 p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em] text-slate-400">
                    <span>{task.priority}</span>
                    <span>{task.status}</span>
                    <span>{task.assigneeUserId ?? "Unassigned"}</span>
                  </div>
                  <h3 className="mt-3 font-[family-name:var(--font-heading)] text-2xl font-semibold text-slate-950">
                    {task.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {task.description || "No description yet."}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link
                      href={`/tasks/${task.id}`}
                      className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      Open task
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-white/70 px-5 py-8 text-sm text-slate-600">
              No tasks in this project yet.
            </div>
          )}
        </SectionCard>
      </DashboardPage>
    </AuthGate>
  );
}

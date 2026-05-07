"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  FolderKanban,
  GripVertical,
  ListChecks,
  MessageSquareMore,
  Plus,
  Save,
  Trash2,
  Users,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import { AuthGate } from "@/components/auth/auth-gate";
import { DashboardPage } from "@/components/layout/dashboard-page";
import { useAuth } from "@/components/providers/auth-provider";
import { SectionCard } from "@/components/ui/section-card";
import { useApiResource } from "@/hooks/use-api-resource";
import { deleteProject, getProjectDetails, updateProject, updateTask } from "@/lib/api";
import { cn } from "@/lib/cn";
import { emitQuickCreate } from "@/lib/quick-create-events";
import type { TaskItem } from "@/lib/types";

const BOARD_COLUMNS = [
  { key: "ToDo", label: "To do", hint: "Fresh work waiting for pickup." },
  { key: "InProgress", label: "In progress", hint: "Execution is happening right now." },
  { key: "Done", label: "Done", hint: "Shipped or fully wrapped." },
] as const;

export default function ProjectDetailsPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const projectState = useApiResource(getProjectDetails, params.projectId);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [boardTasks, setBoardTasks] = useState<TaskItem[]>([]);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [boardSaving, setBoardSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectState.item) {
      return;
    }

    setName(projectState.item.name);
    setDescription(projectState.item.description ?? "");
    setBoardTasks(projectState.item.tasks);
  }, [projectState.item]);

  const boardStats = useMemo(
    () => ({
      total: boardTasks.length,
      inProgress: boardTasks.filter((task) => task.status === "InProgress").length,
      done: boardTasks.filter((task) => task.status === "Done").length,
      unassigned: boardTasks.filter((task) => !task.assigneeUserId).length,
    }),
    [boardTasks],
  );

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session) {
      return;
    }

    setSaving(true);
    setMessage(null);
    setActionError(null);

    try {
      await updateProject(session, params.projectId, {
        name: name.trim(),
        description: description.trim(),
      });
      await projectState.reload();
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

  async function handleDrop(nextStatus: (typeof BOARD_COLUMNS)[number]["key"]) {
    if (!session || !draggedTaskId) {
      return;
    }

    const task = boardTasks.find((item) => item.id === draggedTaskId);
    if (!task || task.status === nextStatus) {
      setDraggedTaskId(null);
      setDragOverStatus(null);
      return;
    }

    const previousTasks = boardTasks;
    const optimisticTasks = boardTasks.map((item) =>
      item.id === task.id ? { ...item, status: nextStatus } : item,
    );

    setBoardSaving(true);
    setActionError(null);
    setBoardTasks(optimisticTasks);
    setDraggedTaskId(null);
    setDragOverStatus(null);

    try {
      await updateTask(session, task.id, {
        title: task.title,
        description: task.description ?? "",
        priority: task.priority,
        status: nextStatus,
        assigneeUserId: task.assigneeUserId,
      });
      await projectState.reload();
    } catch (error) {
      setBoardTasks(previousTasks);
      setActionError(
        error instanceof Error ? error.message : "Unable to move the task between columns.",
      );
    } finally {
      setBoardSaving(false);
    }
  }

  return (
    <AuthGate>
      <DashboardPage
        eyebrow="Project Board"
        title={projectState.item?.name ?? "Project"}
        description="This project now behaves like a real delivery board: browse the work by status, move tasks across columns, and keep settings close by without losing flow."
      >
        {projectState.item ? (
          <section className="grid gap-4 md:grid-cols-4">
            <MetricCard label="Total tasks" value={boardStats.total} icon={FolderKanban} />
            <MetricCard label="In progress" value={boardStats.inProgress} icon={ArrowRight} />
            <MetricCard label="Done" value={boardStats.done} icon={ListChecks} />
            <MetricCard label="Unassigned" value={boardStats.unassigned} icon={Users} />
          </section>
        ) : null}

        <SectionCard
          title="Kanban board"
          description="Drag tasks between columns to update status. This turns the project page into the main work surface instead of just another details form."
          icon={FolderKanban}
        >
          <div className="mb-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => emitQuickCreate({ target: "task", projectId: params.projectId })}
              className="button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
            >
              <Plus className="h-4 w-4" />
              Add task
            </button>
            <Link
              href={`/projects/${params.projectId}/members`}
              className="button-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
            >
              <Users className="h-4 w-4" />
              Members
            </Link>
            <Link
              href={`/projects/${params.projectId}/discord`}
              className="button-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
            >
              <MessageSquareMore className="h-4 w-4" />
              Discord
            </Link>
            {boardSaving ? (
              <span className="chip-neutral inline-flex rounded-full px-3 py-2 text-sm">
                Updating board...
              </span>
            ) : null}
          </div>

          {actionError ? (
            <div className="status-message status-message--error mb-5">
              {actionError}
            </div>
          ) : null}

          {projectState.loading ? (
            <div className="grid gap-4 xl:grid-cols-3">
              {BOARD_COLUMNS.map((column) => (
                <div key={column.key} className="surface-card rounded-[1.75rem] p-4">
                  <div className="h-10 animate-pulse rounded-2xl bg-white/8" />
                  <div className="mt-4 h-40 animate-pulse rounded-2xl bg-white/6" />
                </div>
              ))}
            </div>
          ) : projectState.error ? (
            <div className="status-message status-message--error">{projectState.error}</div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-3">
              {BOARD_COLUMNS.map((column) => {
                const tasks = boardTasks.filter((task) => task.status === column.key);

                return (
                  <div
                    key={column.key}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDragOverStatus(column.key);
                    }}
                    onDragLeave={() => {
                      if (dragOverStatus === column.key) {
                        setDragOverStatus(null);
                      }
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      void handleDrop(column.key);
                    }}
                    className={cn(
                      "surface-card min-h-[24rem] rounded-[1.75rem] p-4 transition",
                      dragOverStatus === column.key && "ring-2 ring-cyan-300/50 ring-offset-2 ring-offset-transparent",
                    )}
                  >
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">
                          {column.label}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">{column.hint}</p>
                      </div>
                      <span className="chip-neutral rounded-full px-3 py-1 text-xs">{tasks.length}</span>
                    </div>

                    <div className="space-y-3">
                      {tasks.length === 0 ? (
                        <div className="rounded-[1.4rem] border border-dashed border-white/10 bg-white/5 px-4 py-8 text-sm text-slate-400">
                          Drop a task here or create a new one for this column.
                        </div>
                      ) : (
                        tasks.map((task) => (
                          <article
                            key={task.id}
                            draggable
                            onDragStart={() => setDraggedTaskId(task.id)}
                            onDragEnd={() => {
                              setDraggedTaskId(null);
                              setDragOverStatus(null);
                            }}
                            className={cn(
                              "rounded-[1.4rem] border border-white/8 bg-white/5 p-4 transition hover:bg-white/[0.08]",
                              draggedTaskId === task.id && "opacity-60",
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-3">
                                <div className="flex flex-wrap gap-2">
                                  <span className="chip-accent rounded-full px-2.5 py-1 text-[11px] uppercase">
                                    {formatToken(task.priority)}
                                  </span>
                                  <span className="chip-neutral rounded-full px-2.5 py-1 text-[11px]">
                                    {task.assigneeUserId ? formatAssignee(task.assigneeUserId) : "Unassigned"}
                                  </span>
                                </div>
                                <div>
                                  <h3 className="font-[family-name:var(--font-heading)] text-xl font-semibold text-white">
                                    {task.title}
                                  </h3>
                                  <p className="mt-2 text-sm leading-6 text-slate-300">
                                    {task.description || "No description yet."}
                                  </p>
                                </div>
                              </div>
                              <GripVertical className="mt-1 h-4 w-4 shrink-0 text-slate-500" />
                            </div>

                            <div className="mt-4 flex items-center justify-between gap-3">
                              <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                                {new Date(task.createdAt).toLocaleDateString()}
                              </span>
                              <Link
                                href={`/tasks/${task.id}`}
                                className="button-secondary rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em]"
                              >
                                Open
                              </Link>
                            </div>
                          </article>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Project settings"
          description="Keep the project definition tidy while the board above stays your main work surface."
          icon={Save}
        >
          <form onSubmit={handleSave} className="grid gap-4 lg:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-300">Project name</span>
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

            <div className="flex flex-wrap gap-3 lg:col-span-2">
              <button
                type="submit"
                disabled={saving || deleting || !name.trim()}
                className="button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save project"}
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={saving || deleting}
                className="inline-flex items-center gap-2 rounded-full border border-rose-400/24 bg-rose-500/6 px-5 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/12 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                {deleting ? "Deleting..." : "Delete project"}
              </button>
            </div>
          </form>
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
  value: number;
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

function formatToken(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();
}

function formatAssignee(value: string) {
  return value.length > 18 ? `${value.slice(0, 8)}...${value.slice(-4)}` : value;
}

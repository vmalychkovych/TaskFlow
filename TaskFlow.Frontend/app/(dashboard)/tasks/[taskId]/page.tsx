"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Save, SquareCheckBig, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import { AuthGate } from "@/components/auth/auth-gate";
import { DashboardPage } from "@/components/layout/dashboard-page";
import { useAuth } from "@/components/providers/auth-provider";
import { TaskAttachmentsPanel } from "@/components/tasks/task-attachments-panel";
import { TaskCommentsPanel } from "@/components/tasks/task-comments-panel";
import { SectionCard } from "@/components/ui/section-card";
import { useApiResource } from "@/hooks/use-api-resource";
import {
  createTaskComment,
  deleteTask,
  getTaskAttachments,
  getTaskById,
  getTaskComments,
  updateTask,
  uploadTaskAttachment,
} from "@/lib/api";
import type { TaskAttachment, TaskComment } from "@/lib/types";

const priorityOptions = ["Low", "Medium", "High"];
const statusOptions = ["ToDo", "InProgress", "Done"];

export default function TaskDetailsPage() {
  const params = useParams<{ taskId: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const taskState = useApiResource(getTaskById, params.taskId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [status, setStatus] = useState("ToDo");
  const [assigneeUserId, setAssigneeUserId] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [commentSaving, setCommentSaving] = useState(false);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(true);
  const [attachmentsError, setAttachmentsError] = useState<string | null>(null);
  const [attachmentUploading, setAttachmentUploading] = useState(false);

  useEffect(() => {
    if (!taskState.item) {
      return;
    }

    setTitle(taskState.item.title);
    setDescription(taskState.item.description ?? "");
    setPriority(taskState.item.priority || "Medium");
    setStatus(taskState.item.status || "ToDo");
    setAssigneeUserId(taskState.item.assigneeUserId ?? "");
  }, [taskState.item]);

  const loadComments = useCallback(async () => {
    if (!session) {
      setComments([]);
      setCommentsLoading(false);
      return;
    }

    setCommentsLoading(true);
    setCommentsError(null);

    try {
      const items = await getTaskComments(session, params.taskId);
      setComments(items);
    } catch (error) {
      setCommentsError(error instanceof Error ? error.message : "Unable to load comments.");
    } finally {
      setCommentsLoading(false);
    }
  }, [params.taskId, session]);

  const loadAttachments = useCallback(async () => {
    if (!session) {
      setAttachments([]);
      setAttachmentsLoading(false);
      return;
    }

    setAttachmentsLoading(true);
    setAttachmentsError(null);

    try {
      const items = await getTaskAttachments(session, params.taskId);
      setAttachments(items);
    } catch (error) {
      setAttachmentsError(error instanceof Error ? error.message : "Unable to load attachments.");
    } finally {
      setAttachmentsLoading(false);
    }
  }, [params.taskId, session]);

  useEffect(() => {
    void loadComments();
    void loadAttachments();
  }, [loadAttachments, loadComments]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session) {
      return;
    }

    setSaving(true);
    setMessage(null);
    setActionError(null);

    try {
      await updateTask(session, params.taskId, {
        title: title.trim(),
        description: description.trim(),
        priority,
        status,
        assigneeUserId: assigneeUserId.trim() || null,
      });
      await taskState.reload();
      setMessage("Task updated.");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to update task.");
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
      await deleteTask(session, params.taskId);
      router.push("/tasks");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to delete task.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleCreateComment(content: string) {
    if (!session) {
      return;
    }

    setCommentSaving(true);
    setCommentsError(null);

    try {
      await createTaskComment(session, {
        taskItemId: params.taskId,
        content,
      });
      await loadComments();
    } catch (error) {
      setCommentsError(error instanceof Error ? error.message : "Unable to create comment.");
    } finally {
      setCommentSaving(false);
    }
  }

  async function handleUploadAttachment(file: File) {
    if (!session) {
      return;
    }

    setAttachmentUploading(true);
    setAttachmentsError(null);

    try {
      await uploadTaskAttachment(session, params.taskId, file);
      await loadAttachments();
    } catch (error) {
      setAttachmentsError(error instanceof Error ? error.message : "Unable to upload attachment.");
    } finally {
      setAttachmentUploading(false);
    }
  }

  return (
    <AuthGate>
      <DashboardPage
        eyebrow="Task Details"
        title={taskState.item?.title ?? "Task"}
        description="This page covers the task read, update, delete, comment, and attachment endpoints in one place."
      >
        <SectionCard
          title="Task settings"
          description="Edit the task body, status, priority, and assignee directly against your task endpoints."
          icon={SquareCheckBig}
        >
          {taskState.loading ? (
            <div className="space-y-4">
              <div className="h-14 animate-pulse rounded-2xl bg-white/70" />
              <div className="h-36 animate-pulse rounded-2xl bg-white/70" />
            </div>
          ) : taskState.error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {taskState.error}
            </div>
          ) : (
            <form onSubmit={handleSave} className="grid gap-4 lg:grid-cols-2">
              <label className="block space-y-2 lg:col-span-2">
                <span className="text-sm font-medium text-slate-700">Task title</span>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                />
              </label>

              <label className="block space-y-2 lg:col-span-2">
                <span className="text-sm font-medium text-slate-700">Description</span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={5}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Priority</span>
                <select
                  value={priority}
                  onChange={(event) => setPriority(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                >
                  {priorityOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Status</span>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                >
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-2 lg:col-span-2">
                <span className="text-sm font-medium text-slate-700">Assignee user id</span>
                <input
                  type="text"
                  value={assigneeUserId}
                  onChange={(event) => setAssigneeUserId(event.target.value)}
                  placeholder="Leave empty to keep the task unassigned"
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
                  disabled={saving || deleting || !title.trim()}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save task"}
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving || deleting}
                  className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                  {deleting ? "Deleting..." : "Delete task"}
                </button>
              </div>
            </form>
          )}
        </SectionCard>

        <TaskCommentsPanel
          comments={comments}
          loading={commentsLoading}
          error={commentsError}
          saving={commentSaving}
          onCreate={handleCreateComment}
        />

        <TaskAttachmentsPanel
          attachments={attachments}
          loading={attachmentsLoading}
          error={attachmentsError}
          uploading={attachmentUploading}
          onUpload={handleUploadAttachment}
        />
      </DashboardPage>
    </AuthGate>
  );
}

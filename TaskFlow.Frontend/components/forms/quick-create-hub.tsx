"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { useApiList } from "@/hooks/use-api-list";
import {
  createProject,
  createTask,
  createWorkspace,
  getProjectMembers,
  getProjects,
  getWorkspaces,
} from "@/lib/api";
import { emitResourceCreated } from "@/lib/resource-events";
import type { Project, ProjectMember, Workspace } from "@/lib/types";
import { Modal } from "@/components/ui/modal";
import type { QuickCreateRequest } from "@/lib/quick-create-events";

export type QuickCreateTarget = "workspace" | "project" | "task" | null;

type QuickCreateHubProps = {
  request: (QuickCreateRequest & { target: Exclude<QuickCreateTarget, null> }) | null;
  onClose: () => void;
};

export function QuickCreateHub({ request, onClose }: QuickCreateHubProps) {
  const { session } = useAuth();
  const workspaceState = useApiList<Workspace>(getWorkspaces);
  const projectState = useApiList<Project>(getProjects);

  if (!session || !request) {
    return null;
  }

  return (
    <>
      <WorkspaceCreateModal
        open={request.target === "workspace"}
        onClose={onClose}
      />
      <ProjectCreateModal
        open={request.target === "project"}
        onClose={onClose}
        workspaces={workspaceState.items}
        loading={workspaceState.loading}
        defaultWorkspaceId={request.workspaceId}
      />
      <TaskCreateModal
        open={request.target === "task"}
        onClose={onClose}
        projects={projectState.items}
        loading={projectState.loading}
        defaultProjectId={request.projectId}
      />
    </>
  );
}

function WorkspaceCreateModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { session } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setName("");
    setDescription("");
    setError(null);
  }, [open]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await createWorkspace(session, {
        name: name.trim(),
        description: description.trim(),
      });
      emitResourceCreated();
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create workspace.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create a workspace"
      description="Spin up a new team space without leaving the page you are on."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Workspace name">
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Growth Ops"
            className="modal-field w-full rounded-2xl px-4 py-3 outline-none transition"
          />
        </FormField>

        <FormField label="Description">
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What this workspace is for"
            rows={4}
            className="modal-field w-full rounded-2xl px-4 py-3 outline-none transition"
          />
        </FormField>

        <FormError error={error} />

        <ModalActions
          saving={saving}
          submitLabel="Create workspace"
          savingLabel="Creating..."
          onClose={onClose}
        />
      </form>
    </Modal>
  );
}

function ProjectCreateModal({
  open,
  onClose,
  workspaces,
  loading,
  defaultWorkspaceId,
}: {
  open: boolean;
  onClose: () => void;
  workspaces: Workspace[];
  loading: boolean;
  defaultWorkspaceId?: string;
}) {
  const { session } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setName("");
    setDescription("");
    setWorkspaceId(defaultWorkspaceId && workspaces.some((workspace) => workspace.id === defaultWorkspaceId)
      ? defaultWorkspaceId
      : workspaces[0]?.id ?? "");
    setError(null);
  }, [defaultWorkspaceId, open, workspaces]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session || !workspaceId) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await createProject(session, {
        name: name.trim(),
        description: description.trim(),
        workspaceId,
      });
      emitResourceCreated();
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create project.");
    } finally {
      setSaving(false);
    }
  }

  const disabled = loading || workspaces.length === 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create a project"
      description="Attach the project to a workspace so members, tasks, and Discord routing all stay organized."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Workspace">
          <select
            value={workspaceId}
            onChange={(event) => setWorkspaceId(event.target.value)}
            disabled={disabled}
            className="modal-field w-full rounded-2xl px-4 py-3 outline-none transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {workspaces.length === 0 ? (
              <option value="">
                {loading ? "Loading workspaces..." : "Create a workspace first"}
              </option>
            ) : null}
            {workspaces.map((workspace) => (
              <option key={workspace.id} value={workspace.id}>
                {workspace.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Project name">
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Launch Sprint Alpha"
            className="modal-field w-full rounded-2xl px-4 py-3 outline-none transition"
          />
        </FormField>

        <FormField label="Description">
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What this project is trying to achieve"
            rows={4}
            className="modal-field w-full rounded-2xl px-4 py-3 outline-none transition"
          />
        </FormField>

        {disabled ? (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Create at least one workspace before adding projects.
          </p>
        ) : null}

        <FormError error={error} />

        <ModalActions
          saving={saving}
          submitLabel="Create project"
          savingLabel="Creating..."
          onClose={onClose}
          disabled={disabled}
        />
      </form>
    </Modal>
  );
}

function TaskCreateModal({
  open,
  onClose,
  projects,
  loading,
  defaultProjectId,
}: {
  open: boolean;
  onClose: () => void;
  projects: Project[];
  loading: boolean;
  defaultProjectId?: string;
}) {
  const { session } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [assigneeUserId, setAssigneeUserId] = useState("");
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setTitle("");
    setDescription("");
    setProjectId(defaultProjectId && projects.some((project) => project.id === defaultProjectId)
      ? defaultProjectId
      : projects[0]?.id ?? "");
    setAssigneeUserId("");
    setProjectMembers([]);
    setMemberError(null);
    setError(null);
  }, [defaultProjectId, open, projects]);

  useEffect(() => {
    if (!open || !session || !projectId) {
      setProjectMembers([]);
      setAssigneeUserId("");
      return;
    }

    let cancelled = false;
    setMembersLoading(true);
    setMemberError(null);

    getProjectMembers(session, projectId)
      .then((members) => {
        if (cancelled) {
          return;
        }

        setProjectMembers(members);
        setAssigneeUserId((current) =>
          members.some((member) => member.userId === current) ? current : "",
        );
      })
      .catch((loadError) => {
        if (cancelled) {
          return;
        }

        setProjectMembers([]);
        setAssigneeUserId("");
        setMemberError(loadError instanceof Error ? loadError.message : "Unable to load project members.");
      })
      .finally(() => {
        if (!cancelled) {
          setMembersLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, projectId, session]);

  const assigneeOptions = useMemo(
    () => [
      { label: "Unassigned", value: "" },
      ...projectMembers.map((member) => ({
        label: formatUserId(member.userId),
        value: member.userId,
      })),
    ],
    [projectMembers],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session || !projectId) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await createTask(session, {
        title: title.trim(),
        description: description.trim(),
        projectId,
        assigneeUserId: assigneeUserId || null,
      });
      emitResourceCreated();
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create task.");
    } finally {
      setSaving(false);
    }
  }

  const disabled = loading || projects.length === 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create a task"
      description="Drop a task into a project from anywhere in the app, then optionally assign it right away."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Project">
          <select
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
            disabled={disabled}
            className="modal-field w-full rounded-2xl px-4 py-3 outline-none transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {projects.length === 0 ? (
              <option value="">
                {loading ? "Loading projects..." : "Create a project first"}
              </option>
            ) : null}
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Task title">
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Prepare launch checklist"
            className="modal-field w-full rounded-2xl px-4 py-3 outline-none transition"
          />
        </FormField>

        <FormField label="Description">
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Add context, acceptance criteria, or notes"
            rows={4}
            className="modal-field w-full rounded-2xl px-4 py-3 outline-none transition"
          />
        </FormField>

        <FormField label="Assignee">
          <select
            value={assigneeUserId}
            onChange={(event) => setAssigneeUserId(event.target.value)}
            disabled={disabled || membersLoading}
            className="modal-field w-full rounded-2xl px-4 py-3 outline-none transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {assigneeOptions.map((option) => (
              <option key={option.value || "unassigned"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>

        {disabled ? (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Create a project before adding tasks.
          </p>
        ) : null}

        {memberError ? (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {memberError}
          </p>
        ) : null}

        <FormError error={error} />

        <ModalActions
          saving={saving}
          submitLabel="Create task"
          savingLabel="Creating..."
          onClose={onClose}
          disabled={disabled}
        />
      </form>
    </Modal>
  );
}

function ModalActions({
  saving,
  submitLabel,
  savingLabel,
  onClose,
  disabled = false,
}: {
  saving: boolean;
  submitLabel: string;
  savingLabel: string;
  onClose: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap justify-end gap-3 pt-2">
      <button
        type="button"
        onClick={onClose}
        className="button-secondary rounded-full px-5 py-3 text-sm font-semibold"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={saving || disabled}
        className="button-primary rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? savingLabel : submitLabel}
      </button>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-200">{label}</span>
      {children}
    </label>
  );
}

function FormError({ error }: { error: string | null }) {
  if (!error) {
    return null;
  }

  return (
    <div className="status-message status-message--error">
      {error}
    </div>
  );
}

function formatUserId(userId: string) {
  return userId.length > 18 ? `${userId.slice(0, 8)}...${userId.slice(-4)}` : userId;
}

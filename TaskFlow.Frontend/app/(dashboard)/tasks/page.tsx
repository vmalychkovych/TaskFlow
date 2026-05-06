"use client";

import { useMemo, useState } from "react";
import { Filter } from "lucide-react";

import { AuthGate } from "@/components/auth/auth-gate";
import { CreateResourceCard } from "@/components/forms/create-resource-card";
import { DashboardPage } from "@/components/layout/dashboard-page";
import { useAuth } from "@/components/providers/auth-provider";
import { TaskTable } from "@/components/ui/task-table";
import { useApiList } from "@/hooks/use-api-list";
import { useTaskList } from "@/hooks/use-task-list";
import { createTask, getProjects, getTasks } from "@/lib/api";
import type { Project } from "@/lib/types";

const priorityOptions = ["", "Low", "Medium", "High"];
const statusOptions = ["", "ToDo", "InProgress", "Done"];

export default function AllTasksPage() {
  const { session } = useAuth();
  const [search, setSearch] = useState("");
  const [projectId, setProjectId] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const projectState = useApiList<Project>(getProjects);

  const query = useMemo(
    () => ({
      search,
      projectId,
      priority,
      status,
      page: 1,
      pageSize: 25,
      sortBy: "CreatedAt",
      sortOrder: "desc" as const,
    }),
    [priority, projectId, search, status],
  );

  const state = useTaskList(getTasks, query);
  const projectOptions = useMemo(
    () =>
      projectState.items.length > 0
        ? projectState.items.map((project) => ({
            label: project.name,
            value: project.id,
          }))
        : [{ label: "Load projects first", value: "" }],
    [projectState.items],
  );

  async function handleCreate(values: Record<string, string>) {
    if (!session) {
      return;
    }

    setCreateError(null);

    try {
      await createTask(session, {
        title: values.title.trim(),
        description: values.description.trim(),
        projectId: values.projectId,
        assigneeUserId: values.assigneeUserId.trim() || null,
      });
      await state.reload();
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Unable to create task.");
    }
  }

  return (
    <AuthGate>
      <DashboardPage
        eyebrow="All Tasks"
        title="Cross-project task explorer"
        description="Use this screen when you need the whole board surface, not just your own queue. It maps directly to the general `/api/tasks` endpoint."
      >
        <CreateResourceCard
          title="Create a task"
          description="Drop a new task into an existing project and optionally pre-assign it to a project member."
          submitLabel="Create task"
          savingLabel="Creating..."
          textFields={[
            { id: "title", label: "Task title", placeholder: "Prepare launch checklist" },
            {
              id: "description",
              label: "Description",
              placeholder: "Add context, acceptance criteria, or notes",
              type: "textarea",
            },
            {
              id: "assigneeUserId",
              label: "Assignee user id",
              placeholder: "Optional project member user id",
            },
          ]}
          selectFields={[
            {
              id: "projectId",
              label: "Project",
              options: projectOptions,
            },
          ]}
          initialValues={{
            title: "",
            description: "",
            assigneeUserId: "",
            projectId: projectOptions[0]?.value ?? "",
          }}
          error={createError ?? projectState.error}
          onSubmit={handleCreate}
        />

        <section className="glass-panel rounded-[1.75rem] p-6 md:p-8">
          <div className="mb-5 flex items-start gap-4">
            <div className="inline-flex rounded-[1.25rem] bg-slate-100 p-4">
              <Filter className="h-6 w-6 text-slate-800" />
            </div>
            <div>
              <h2 className="font-[family-name:var(--font-heading)] text-3xl font-semibold text-slate-950">
                Filter tasks
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Search by text, narrow to a project, or slice the list by status and priority.
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-4">
            <FilterField label="Search">
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Find tasks by title or description"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              />
            </FilterField>

            <FilterField label="Project ID">
              <select
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              >
                <option value="">All projects</option>
                {projectState.items.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </FilterField>

            <FilterField label="Priority">
              <select
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              >
                {priorityOptions.map((option) => (
                  <option key={option || "all"} value={option}>
                    {option || "All priorities"}
                  </option>
                ))}
              </select>
            </FilterField>

            <FilterField label="Status">
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              >
                {statusOptions.map((option) => (
                  <option key={option || "all"} value={option}>
                    {option || "All statuses"}
                  </option>
                ))}
              </select>
            </FilterField>
          </div>
        </section>

        <TaskTable {...state} />
      </DashboardPage>
    </AuthGate>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

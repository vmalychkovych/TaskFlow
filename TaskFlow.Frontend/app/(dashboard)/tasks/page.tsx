"use client";

import { useMemo, useState } from "react";
import { Filter, Sparkles } from "lucide-react";

import { AuthGate } from "@/components/auth/auth-gate";
import { DashboardPage } from "@/components/layout/dashboard-page";
import { SectionCard } from "@/components/ui/section-card";
import { TaskTable } from "@/components/ui/task-table";
import { useApiList } from "@/hooks/use-api-list";
import { useTaskList } from "@/hooks/use-task-list";
import { getProjects, getTasks } from "@/lib/api";
import type { Project } from "@/lib/types";

const priorityOptions = ["", "Low", "Medium", "High"];
const statusOptions = ["", "ToDo", "InProgress", "Done"];

export default function AllTasksPage() {
  const [search, setSearch] = useState("");
  const [projectId, setProjectId] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");
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

  return (
    <AuthGate>
      <DashboardPage
        eyebrow="All Tasks"
        title="Cross-project task explorer"
        description="Use this screen when you need the whole board surface, not just your own queue. New tasks now come from the sidebar modal instead of a full-page create form."
      >
        <SectionCard
          title="Create from the sidebar"
          description="Use the plus button next to Tasks on the left. The modal lets you pick a project, add the task, and assign it immediately without pushing the filters down."
          icon={Sparkles}
        >
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="chip-accent rounded-full px-3 py-2 font-medium">
              Tasks +
            </span>
            <span className="chip-neutral rounded-full px-3 py-2">
              Filter all tasks
            </span>
            <span className="chip-neutral rounded-full px-3 py-2">
              Jump to my queue
            </span>
            <span className="chip-neutral rounded-full px-3 py-2">
              Triage unassigned work
            </span>
          </div>
        </SectionCard>

        <section className="surface-card rounded-[1.75rem] p-6 md:p-8">
          <div className="mb-5 flex items-start gap-4">
            <div className="inline-flex rounded-[1.25rem] bg-white/8 p-4">
              <Filter className="h-6 w-6 text-cyan-300" />
            </div>
            <div>
              <h2 className="font-[family-name:var(--font-heading)] text-3xl font-semibold text-white">
                Filter tasks
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-300">
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
                className="dashboard-input w-full rounded-2xl px-4 py-3"
              />
            </FilterField>

            <FilterField label="Project">
              <select
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
                className="dashboard-input w-full rounded-2xl px-4 py-3"
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
                className="dashboard-input w-full rounded-2xl px-4 py-3"
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
                className="dashboard-input w-full rounded-2xl px-4 py-3"
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
      <span className="text-sm font-medium text-slate-300">{label}</span>
      {children}
    </label>
  );
}

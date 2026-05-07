"use client";

import { CheckCircle2, ListTodo, Sparkles, Timer } from "lucide-react";

import { AuthGate } from "@/components/auth/auth-gate";
import { DashboardPage } from "@/components/layout/dashboard-page";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionCard } from "@/components/ui/section-card";
import { TaskTable } from "@/components/ui/task-table";
import { useTaskList } from "@/hooks/use-task-list";
import { getMyTasks } from "@/lib/api";

export default function MyTasksPage() {
  const state = useTaskList(getMyTasks);

  return (
    <AuthGate>
      <DashboardPage
        eyebrow="My Tasks"
        title="Assigned to me"
        description="This page is built directly on top of your new `/api/tasks/my` endpoint."
      >
        <SectionCard
          title="My queue"
          description="A focused view of the work already assigned to you, with a quick feel for volume and progress."
          icon={Sparkles}
        >
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard label="Assigned now" value={state.items.length} icon={ListTodo} />
            <MetricCard
              label="In progress"
              value={state.items.filter((task) => task.status.toLowerCase().includes("progress")).length}
              icon={Timer}
            />
            <MetricCard
              label="Done"
              value={state.items.filter((task) => task.status.toLowerCase().includes("done")).length}
              icon={CheckCircle2}
            />
          </div>
        </SectionCard>

        {state.items.length === 0 && !state.loading && !state.error ? (
          <EmptyState
            title="No assigned tasks"
            description="When a project task is assigned to you, it will show up here."
            icon={ListTodo}
          />
        ) : (
          <TaskTable {...state} />
        )}
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
    <div className="rounded-[1.5rem] border border-white/8 bg-white/6 p-5">
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

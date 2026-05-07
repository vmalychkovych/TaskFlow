"use client";

import { Clock3, Layers3, Orbit, Sparkles } from "lucide-react";

import { AuthGate } from "@/components/auth/auth-gate";
import { DashboardPage } from "@/components/layout/dashboard-page";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionCard } from "@/components/ui/section-card";
import { TaskTable } from "@/components/ui/task-table";
import { useTaskList } from "@/hooks/use-task-list";
import { getUnassignedTasks } from "@/lib/api";

export default function UnassignedTasksPage() {
  const state = useTaskList(getUnassignedTasks);

  return (
    <AuthGate>
      <DashboardPage
        eyebrow="Unassigned"
        title="Tasks waiting for an owner"
        description="This screen rides on your `/api/tasks/unassigned` endpoint, which makes triage much easier on the frontend."
      >
        <SectionCard
          title="Triage lane"
          description="Use this surface to spot work that has slipped out of ownership and pull it back into a clear queue."
          icon={Sparkles}
        >
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard label="Waiting now" value={state.items.length} icon={Orbit} />
            <MetricCard
              label="Todo"
              value={state.items.filter((task) => task.status.toLowerCase().includes("todo")).length}
              icon={Layers3}
            />
            <MetricCard
              label="In progress"
              value={state.items.filter((task) => task.status.toLowerCase().includes("progress")).length}
              icon={Clock3}
            />
          </div>
        </SectionCard>

        {state.items.length === 0 && !state.loading && !state.error ? (
          <EmptyState
            title="No unassigned tasks"
            description="Looks clean right now. If anything drops out of ownership, it will appear here."
            icon={Orbit}
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

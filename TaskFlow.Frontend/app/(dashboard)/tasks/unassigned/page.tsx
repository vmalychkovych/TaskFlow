"use client";

import { Orbit } from "lucide-react";

import { AuthGate } from "@/components/auth/auth-gate";
import { DashboardPage } from "@/components/layout/dashboard-page";
import { EmptyState } from "@/components/ui/empty-state";
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

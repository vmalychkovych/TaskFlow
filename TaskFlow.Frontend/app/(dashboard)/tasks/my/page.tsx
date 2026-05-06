"use client";

import { ListTodo } from "lucide-react";

import { AuthGate } from "@/components/auth/auth-gate";
import { DashboardPage } from "@/components/layout/dashboard-page";
import { EmptyState } from "@/components/ui/empty-state";
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

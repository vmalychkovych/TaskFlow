import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { cn } from "@/lib/cn";
import type { TaskItem } from "@/lib/types";

export function TaskTable({
  items,
  loading,
  error,
}: {
  items: TaskItem[];
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return (
      <div className="glass-panel overflow-hidden rounded-[1.75rem]">
        <div className="animate-pulse space-y-3 p-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-14 rounded-2xl bg-white/60" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel rounded-[1.5rem] px-5 py-4 text-sm text-rose-700">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel overflow-hidden rounded-[1.75rem]">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="border-b border-white/80 bg-white/70 text-left text-xs uppercase tracking-[0.22em] text-slate-500">
            <tr>
              <th className="px-5 py-4">Task</th>
              <th className="px-5 py-4">Priority</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Assignee</th>
              <th className="px-5 py-4">Created</th>
            </tr>
          </thead>
          <tbody>
            {items.map((task) => (
              <tr key={task.id} className="border-b border-white/70 last:border-b-0">
                <td className="px-5 py-4">
                  <Link
                    href={`/tasks/${task.id}`}
                    className="font-medium text-slate-950 transition hover:text-teal-700"
                  >
                    {task.title}
                  </Link>
                  <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">
                    {task.description}
                  </p>
                </td>
                <td className="px-5 py-4">
                  <StatusPill tone="amber">{task.priority}</StatusPill>
                </td>
                <td className="px-5 py-4">
                  <StatusPill tone="teal">{task.status}</StatusPill>
                </td>
                <td className="px-5 py-4 text-sm text-slate-600">
                  {task.assigneeUserId ?? "Unassigned"}
                </td>
                <td className="px-5 py-4 text-sm text-slate-600">
                  {new Date(task.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusPill({
  children,
  tone,
}: {
  children: string;
  tone: "amber" | "teal";
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
        tone === "amber"
          ? "bg-amber-50 text-amber-700"
          : "bg-teal-50 text-teal-700",
      )}
    >
      {children}
    </span>
  );
}

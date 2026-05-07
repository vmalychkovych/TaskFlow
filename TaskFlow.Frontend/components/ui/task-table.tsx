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
      <div className="surface-card overflow-hidden rounded-[1.75rem]">
        <div className="animate-pulse space-y-3 p-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-14 rounded-2xl bg-white/6" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="surface-card rounded-[1.5rem] px-5 py-4 text-sm text-rose-300">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="surface-card overflow-hidden rounded-[1.75rem]">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="border-b border-white/8 bg-white/6 text-left text-xs uppercase tracking-[0.22em] text-slate-400">
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
              <tr
                key={task.id}
                className="border-b border-white/8 transition hover:bg-white/[0.03] last:border-b-0"
              >
                <td className="px-5 py-4">
                  <Link
                    href={`/tasks/${task.id}`}
                    className="font-medium text-white transition hover:text-cyan-300"
                  >
                    {task.title}
                  </Link>
                  <p className="mt-1 max-w-xl text-sm leading-6 text-slate-300">
                    {task.description || "No description yet."}
                  </p>
                </td>
                <td className="px-5 py-4">
                  <StatusPill tone={getPriorityTone(task.priority)}>
                    {formatToken(task.priority)}
                  </StatusPill>
                </td>
                <td className="px-5 py-4">
                  <StatusPill tone={getStatusTone(task.status)}>
                    {formatToken(task.status)}
                  </StatusPill>
                </td>
                <td className="px-5 py-4 text-sm text-slate-300">
                  {task.assigneeUserId ? (
                    <span className="chip-neutral rounded-full px-2.5 py-1 text-xs">
                      {formatAssignee(task.assigneeUserId)}
                    </span>
                  ) : (
                    <span className="chip-neutral rounded-full px-2.5 py-1 text-xs">
                      Unassigned
                    </span>
                  )}
                </td>
                <td className="px-5 py-4 text-sm text-slate-300">
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
  tone: "amber" | "teal" | "violet" | "emerald";
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
        tone === "amber"
          ? "bg-amber-500/14 text-amber-200"
          : tone === "violet"
            ? "bg-violet-500/14 text-violet-200"
            : tone === "emerald"
              ? "bg-emerald-500/14 text-emerald-200"
              : "bg-cyan-500/14 text-cyan-200",
      )}
    >
      {children}
    </span>
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

function getPriorityTone(priority: string): "amber" | "violet" | "teal" {
  const normalized = priority.toLowerCase();

  if (normalized.includes("high")) {
    return "violet";
  }

  if (normalized.includes("low")) {
    return "teal";
  }

  return "amber";
}

function getStatusTone(status: string): "teal" | "emerald" | "violet" {
  const normalized = status.toLowerCase();

  if (normalized.includes("done")) {
    return "emerald";
  }

  if (normalized.includes("progress")) {
    return "violet";
  }

  return "teal";
}

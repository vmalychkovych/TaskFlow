"use client";

import { FormEvent, useState } from "react";
import { AlertTriangle, Trash2, UserPlus2 } from "lucide-react";

type MemberRecord = {
  userId: string;
  role: string | number;
  status: string | number;
};

export function MemberManager<TMember extends MemberRecord>({
  title,
  description,
  dateLabel,
  items,
  loading,
  error,
  saving,
  roleOptions,
  getDate,
  onAdd,
  onRemove,
}: {
  title: string;
  description: string;
  dateLabel: string;
  items: TMember[];
  loading: boolean;
  error: string | null;
  saving: boolean;
  roleOptions: Array<{ label: string; value: number }>;
  getDate: (member: TMember) => string;
  onAdd: (userId: string, role: number) => Promise<void>;
  onRemove: (userId: string) => Promise<void>;
}) {
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<number>(roleOptions[0]?.value ?? 0);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!userId.trim() || !role) {
      return;
    }

    await onAdd(userId.trim(), role);
    setUserId("");
  }

  return (
    <section className="space-y-6">
      <div className="surface-card rounded-[1.75rem] p-6 md:p-8">
        <div className="mb-6 flex items-start gap-4">
          <div className="inline-flex rounded-[1.25rem] bg-white/8 p-4">
            <UserPlus2 className="h-6 w-6 text-cyan-300" />
          </div>
          <div>
            <h2 className="font-[family-name:var(--font-heading)] text-3xl font-semibold text-white">
              {title}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
              {description}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-[1fr_220px_auto]">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-300">User ID</span>
            <input
              type="text"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              placeholder="Paste user id from your auth system"
              className="dashboard-input w-full rounded-2xl px-4 py-3.5"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-300">Role</span>
            <select
              value={String(role)}
              onChange={(event) => setRole(Number(event.target.value))}
              className="dashboard-input w-full rounded-2xl px-4 py-3.5"
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={saving || !userId.trim()}
              className="button-primary w-full rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Add member"}
            </button>
          </div>
        </form>
      </div>

      <div className="surface-card overflow-hidden rounded-[1.75rem]">
        {loading ? (
          <div className="animate-pulse space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-14 rounded-2xl bg-white/8" />
            ))}
          </div>
        ) : error ? (
          <div className="px-5 py-4 text-sm text-rose-200">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-300">
            No members found yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-white/8 bg-white/6 text-left text-xs uppercase tracking-[0.22em] text-slate-400">
                <tr>
                  <th className="px-5 py-4">User ID</th>
                  <th className="px-5 py-4">Role</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">{dateLabel}</th>
                  <th className="px-5 py-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((member) => (
                  <tr key={member.userId} className="border-b border-white/8 last:border-b-0">
                    <td className="px-5 py-4 font-medium text-white">{member.userId}</td>
                    <td className="px-5 py-4 text-sm text-slate-300">
                      <span className="chip-accent rounded-full px-2.5 py-1 text-xs">
                        {formatRole(member.role, roleOptions)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-300">
                      <span className="chip-neutral rounded-full px-2.5 py-1 text-xs">
                        {formatStatus(member.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-300">{getDate(member)}</td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => onRemove(member.userId)}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-full border border-rose-400/24 bg-rose-500/6 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-rose-200 transition hover:bg-rose-500/12 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function formatRole(
  role: string | number,
  roleOptions: Array<{ label: string; value: number }>,
) {
  if (typeof role === "number") {
    const match = roleOptions.find((option) => option.value === role);
    return match?.label ?? `Role ${role}`;
  }

  return prettifyToken(role);
}

function formatStatus(status: string | number) {
  if (typeof status === "number") {
    if (status === 0) return "Pending";
    if (status === 1) return "Active";
    if (status === 2) return "Removed";
    return `Status ${status}`;
  }

  return prettifyToken(status);
}

function prettifyToken(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();
}

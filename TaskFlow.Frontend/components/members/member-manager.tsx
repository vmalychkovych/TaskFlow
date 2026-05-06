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
      <div className="glass-panel rounded-[1.75rem] p-6 md:p-8">
        <div className="mb-6 flex items-start gap-4">
          <div className="inline-flex rounded-[1.25rem] bg-slate-100 p-4">
            <UserPlus2 className="h-6 w-6 text-slate-800" />
          </div>
          <div>
            <h2 className="font-[family-name:var(--font-heading)] text-3xl font-semibold text-slate-950">
              {title}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
              {description}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-[1fr_220px_auto]">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">User ID</span>
            <input
              type="text"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              placeholder="Paste user id from your auth system"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Role</span>
            <select
              value={String(role)}
              onChange={(event) => setRole(Number(event.target.value))}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
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
              className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Add member"}
            </button>
          </div>
        </form>
      </div>

      <div className="glass-panel overflow-hidden rounded-[1.75rem]">
        {loading ? (
          <div className="animate-pulse space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-14 rounded-2xl bg-white/70" />
            ))}
          </div>
        ) : error ? (
          <div className="px-5 py-4 text-sm text-rose-700">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-600">
            No members found yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-white/80 bg-white/70 text-left text-xs uppercase tracking-[0.22em] text-slate-500">
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
                  <tr key={member.userId} className="border-b border-white/70 last:border-b-0">
                    <td className="px-5 py-4 font-medium text-slate-950">{member.userId}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{String(member.role)}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{String(member.status)}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{getDate(member)}</td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => onRemove(member.userId)}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
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

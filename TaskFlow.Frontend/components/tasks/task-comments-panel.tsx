"use client";

import { FormEvent, useState } from "react";
import { MessageSquareText } from "lucide-react";

import { SectionCard } from "@/components/ui/section-card";
import type { TaskComment } from "@/lib/types";

export function TaskCommentsPanel({
  comments,
  loading,
  error,
  saving,
  onCreate,
}: {
  comments: TaskComment[];
  loading: boolean;
  error: string | null;
  saving: boolean;
  onCreate: (content: string) => Promise<void>;
}) {
  const [content, setContent] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!content.trim()) {
      return;
    }

    await onCreate(content.trim());
    setContent("");
  }

  return (
    <SectionCard
      title="Comments"
      description="This block is wired to the task comments endpoints so discussion stays next to the task."
      icon={MessageSquareText}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Add context, unblockers, or review notes"
          rows={4}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
        />

        <button
          type="submit"
          disabled={saving || !content.trim()}
          className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Posting..." : "Post comment"}
        </button>
      </form>

      {error ? (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="mt-6 space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-[1.5rem] bg-white/70" />
          ))
        ) : comments.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-white/70 px-5 py-8 text-sm text-slate-600">
            No comments yet.
          </div>
        ) : (
          comments.map((comment) => (
            <article
              key={comment.id}
              className="rounded-[1.5rem] border border-white/70 bg-white/90 p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em] text-slate-400">
                <span>{comment.authorEmail}</span>
                <span>{new Date(comment.createdAt).toLocaleString()}</span>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                {comment.content}
              </p>
            </article>
          ))
        )}
      </div>
    </SectionCard>
  );
}

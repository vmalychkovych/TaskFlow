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
          className="dashboard-input w-full rounded-2xl px-4 py-3"
        />

        <button
          type="submit"
          disabled={saving || !content.trim()}
          className="button-primary rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Posting..." : "Post comment"}
        </button>
      </form>

      {error ? (
        <div className="status-message status-message--error mt-5">
          {error}
        </div>
      ) : null}

      <div className="mt-6 space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-[1.5rem] bg-white/8" />
          ))
        ) : comments.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-white/5 px-5 py-8 text-sm text-slate-300">
            No comments yet.
          </div>
        ) : (
          comments.map((comment) => (
            <article
              key={comment.id}
              className="surface-card rounded-[1.5rem] p-5"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                <span className="chip-neutral rounded-full px-2.5 py-1">{comment.authorEmail}</span>
                <span className="chip-neutral rounded-full px-2.5 py-1">{new Date(comment.createdAt).toLocaleString()}</span>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-300">
                {comment.content}
              </p>
            </article>
          ))
        )}
      </div>
    </SectionCard>
  );
}

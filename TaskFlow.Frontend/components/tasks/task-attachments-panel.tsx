"use client";

import { ChangeEvent, useState } from "react";
import { Paperclip } from "lucide-react";

import { SectionCard } from "@/components/ui/section-card";
import type { TaskAttachment } from "@/lib/types";

export function TaskAttachmentsPanel({
  attachments,
  loading,
  error,
  uploading,
  onUpload,
}: {
  attachments: TaskAttachment[];
  loading: boolean;
  error: string | null;
  uploading: boolean;
  onUpload: (file: File) => Promise<void>;
}) {
  const [selectedFileName, setSelectedFileName] = useState("");

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setSelectedFileName(file.name);

    try {
      await onUpload(file);
    } finally {
      event.target.value = "";
      setSelectedFileName("");
    }
  }

  return (
    <SectionCard
      title="Attachments"
      description="Upload files with the multipart attachment endpoint and keep the task history in one place."
      icon={Paperclip}
    >
      <label className="inline-flex cursor-pointer items-center gap-3 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
        <input
          type="file"
          className="hidden"
          onChange={handleChange}
          disabled={uploading}
        />
        {uploading ? "Uploading..." : "Upload file"}
      </label>

      {selectedFileName ? (
        <p className="mt-3 text-sm text-slate-500">{selectedFileName}</p>
      ) : null}

      {error ? (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-[1.5rem] bg-white/70" />
          ))
        ) : attachments.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-white/70 px-5 py-8 text-sm text-slate-600">
            No attachments yet.
          </div>
        ) : (
          attachments.map((attachment) => (
            <article
              key={attachment.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] border border-white/70 bg-white/90 p-5 shadow-sm"
            >
              <div>
                <p className="font-medium text-slate-950">{attachment.fileName}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {attachment.contentType} · {new Date(attachment.uploadedAt).toLocaleString()}
                </p>
              </div>
              <a
                href={attachment.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Open file
              </a>
            </article>
          ))
        )}
      </div>
    </SectionCard>
  );
}

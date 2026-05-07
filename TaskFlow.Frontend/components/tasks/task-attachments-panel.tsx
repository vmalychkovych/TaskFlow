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
      <label className="button-primary inline-flex cursor-pointer items-center gap-3 rounded-full px-5 py-3 text-sm font-semibold">
        <input
          type="file"
          className="hidden"
          onChange={handleChange}
          disabled={uploading}
        />
        {uploading ? "Uploading..." : "Upload file"}
      </label>

      {selectedFileName ? (
        <p className="mt-3 text-sm text-slate-300">{selectedFileName}</p>
      ) : null}

      {error ? (
        <div className="status-message status-message--error mt-5">
          {error}
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-[1.5rem] bg-white/8" />
          ))
        ) : attachments.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-white/5 px-5 py-8 text-sm text-slate-300">
            No attachments yet.
          </div>
        ) : (
          attachments.map((attachment) => (
            <article
              key={attachment.id}
              className="surface-card flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] p-5"
            >
              <div>
                <p className="font-medium text-white">{attachment.fileName}</p>
                <p className="mt-1 text-sm text-slate-400">
                  {attachment.contentType} - {new Date(attachment.uploadedAt).toLocaleString()}
                </p>
              </div>
              <a
                href={attachment.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="button-secondary rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em]"
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

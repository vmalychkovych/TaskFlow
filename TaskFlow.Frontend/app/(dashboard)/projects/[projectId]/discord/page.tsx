"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, MessageSquareMore, Trash2, Zap } from "lucide-react";

import { AuthGate } from "@/components/auth/auth-gate";
import { useAuth } from "@/components/providers/auth-provider";
import { DashboardPage } from "@/components/layout/dashboard-page";
import {
  deleteProjectDiscordIntegration,
  getProjectDetails,
  getProjectDiscordIntegration,
  upsertProjectDiscordIntegration,
} from "@/lib/api";

export default function ProjectDiscordPage() {
  const params = useParams<{ projectId: string }>();
  const { session } = useAuth();
  const [projectName, setProjectName] = useState("Project Discord");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    Promise.all([
      getProjectDetails(session, params.projectId).catch(() => null),
      getProjectDiscordIntegration(session, params.projectId),
    ])
      .then(([project, integration]) => {
        if (project?.name) {
          setProjectName(project.name);
        }

        if (!integration) {
          setWebhookUrl("");
          setIsEnabled(true);
          return;
        }

        setProjectName(integration.projectName);
        setWebhookUrl(integration.webhookUrl);
        setIsEnabled(integration.isEnabled);
      })
      .catch((loadError) => {
        setError(
          loadError instanceof Error
            ? formatDiscordErrorMessage(loadError.message)
            : "Unable to load integration.",
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [params.projectId, session]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session) {
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      await upsertProjectDiscordIntegration(session, params.projectId, {
        webhookUrl,
        isEnabled,
      });
      setMessage("Discord integration saved.");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? formatDiscordErrorMessage(submitError.message)
          : "Unable to save integration.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!session) {
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      await deleteProjectDiscordIntegration(session, params.projectId);
      setWebhookUrl("");
      setIsEnabled(true);
      setMessage("Discord integration removed.");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? formatDiscordErrorMessage(deleteError.message)
          : "Unable to remove integration.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthGate>
      <DashboardPage
        eyebrow="Project Discord"
        title="Discord delivery settings"
        description="Wire a project directly to its own Discord webhook so only the right task events land in the right place."
      >
        <section className="surface-card max-w-4xl rounded-[1.9rem] p-6 md:p-8">
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-6 w-40 rounded-full bg-white/8" />
              <div className="h-14 rounded-2xl bg-white/6" />
              <div className="h-14 rounded-2xl bg-white/6" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <aside className="auth-shell rounded-[1.6rem] border border-white/8 px-6 py-6 text-white">
                  <div className="inline-flex rounded-[1.25rem] bg-white/8 p-4">
                    <MessageSquareMore className="h-6 w-6 text-cyan-300" />
                  </div>
                  <div className="mt-6 space-y-4">
                    <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-2 text-xs uppercase tracking-[0.22em] text-cyan-200">
                      <Zap className="h-3.5 w-3.5" />
                      Project channel
                    </p>
                    <h2 className="font-[family-name:var(--font-heading)] text-3xl font-semibold leading-tight text-white">
                      {projectName}
                    </h2>
                    <p className="text-sm leading-7 text-slate-300">
                      Route task create and update signals into one dedicated Discord stream, instead of mixing all projects together.
                    </p>
                  </div>

                  <div className="mt-8 space-y-3 rounded-[1.4rem] border border-white/8 bg-white/6 p-4 text-sm text-slate-300">
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-cyan-300" />
                      Webhook-based delivery
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-cyan-300" />
                      Project-scoped notifications
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-cyan-300" />
                      Toggle on or off anytime
                    </p>
                  </div>
                </aside>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                      Integration
                    </p>
                    <p className="text-sm leading-7 text-slate-300">
                      Use the project-specific endpoints you already built to keep Discord routing isolated.
                    </p>
                  </div>

                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-300">Webhook URL</span>
                    <input
                      type="url"
                      value={webhookUrl}
                      onChange={(event) => setWebhookUrl(event.target.value)}
                      placeholder="https://discord.com/api/webhooks/..."
                      className="dashboard-input w-full rounded-2xl px-4 py-3.5"
                    />
                  </label>

                  <label className="dashboard-input flex items-center justify-between rounded-2xl px-4 py-4">
                    <div>
                      <p className="font-medium text-white">Enable webhook delivery</p>
                      <p className="mt-1 text-sm text-slate-400">
                        When enabled, task create and update events can flow to this project channel.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={(event) => setIsEnabled(event.target.checked)}
                      className="h-5 w-5 rounded border-slate-300 bg-transparent text-cyan-400 focus:ring-cyan-400"
                    />
                  </label>

                  {message ? (
                    <div className="status-message status-message--success">
                      {message}
                    </div>
                  ) : null}

                  {error ? (
                    <div className="status-message status-message--error">
                      {error}
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={saving || !webhookUrl.trim()}
                      className="button-primary rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? "Saving..." : "Save integration"}
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-full border border-rose-400/24 bg-rose-500/6 px-5 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/12 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}
        </section>
      </DashboardPage>
    </AuthGate>
  );
}

function formatDiscordErrorMessage(message: string) {
  if (message.includes("remote webhook responded with 404")) {
    return "Discord повернув 404. Перевір, чи webhook URL правильний і ще існує.";
  }

  if (message.includes("Unable to save integration")) {
    return "Не вдалося зберегти Discord integration.";
  }

  return message;
}

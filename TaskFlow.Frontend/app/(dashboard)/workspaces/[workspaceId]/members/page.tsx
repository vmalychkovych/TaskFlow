"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { AuthGate } from "@/components/auth/auth-gate";
import { DashboardPage } from "@/components/layout/dashboard-page";
import { MemberManager } from "@/components/members/member-manager";
import { useAuth } from "@/components/providers/auth-provider";
import {
  addWorkspaceMember,
  getWorkspaceMembers,
  removeWorkspaceMember,
} from "@/lib/api";
import type { WorkspaceMember } from "@/lib/types";

const workspaceRoles = [
  { label: "Member", value: 3 },
  { label: "Admin", value: 2 },
];

export default function WorkspaceMembersPage() {
  const params = useParams<{ workspaceId: string }>();
  const { session } = useAuth();
  const [items, setItems] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    if (!session) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const members = await getWorkspaceMembers(session, params.workspaceId);
      setItems(members);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load members.");
    } finally {
      setLoading(false);
    }
  }, [params.workspaceId, session]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  async function handleAdd(userId: string, role: number) {
    if (!session) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await addWorkspaceMember(session, params.workspaceId, { userId, role });
      await loadMembers();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to add member.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(userId: string) {
    if (!session) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await removeWorkspaceMember(session, params.workspaceId, userId);
      await loadMembers();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Unable to remove member.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthGate>
      <DashboardPage
        eyebrow="Workspace Members"
        title="Manage workspace access"
        description="This screen plugs directly into your workspace member endpoints so you can shape the team before drilling down into project-level access."
      >
        <MemberManager
          title={`Workspace ${params.workspaceId}`}
          description="Add active users to the workspace and promote them to admin when they need broader control."
          dateLabel="Joined"
          items={items}
          loading={loading}
          error={error}
          saving={saving}
          roleOptions={workspaceRoles}
          getDate={(member) => new Date(member.joinedAt).toLocaleDateString()}
          onAdd={handleAdd}
          onRemove={handleRemove}
        />
      </DashboardPage>
    </AuthGate>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import type { AuthResponse, TaskItem, TaskQueryParams } from "@/lib/types";

type Loader = (session: AuthResponse, query?: TaskQueryParams) => Promise<TaskItem[]>;

export function useTaskList(loader: Loader, query?: TaskQueryParams) {
  const { session } = useAuth();
  const [items, setItems] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await loader(session, query);
      setItems(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  }, [loader, query, session]);

  useEffect(() => {
    void load();
  }, [load]);

  return { items, loading, error, reload: load };
}

"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import type { AuthResponse } from "@/lib/types";

type Loader<T> = (session: AuthResponse, id: string) => Promise<T>;

export function useApiResource<T>(loader: Loader<T>, id?: string) {
  const { session } = useAuth();
  const [item, setItem] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session || !id) {
      setItem(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await loader(session, id);
      setItem(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  }, [id, loader, session]);

  useEffect(() => {
    void load();
  }, [load]);

  return { item, setItem, loading, error, reload: load };
}

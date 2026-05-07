"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { RESOURCE_CREATED_EVENT } from "@/lib/resource-events";
import type { AuthResponse } from "@/lib/types";

type Loader<T> = (session: AuthResponse) => Promise<T[]>;

export function useApiList<T>(loader: Loader<T>) {
  const { session } = useAuth();
  const [items, setItems] = useState<T[]>([]);
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
      const data = await loader(session);
      setItems(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  }, [loader, session]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    function handleResourceCreated() {
      void load();
    }

    window.addEventListener(RESOURCE_CREATED_EVENT, handleResourceCreated);
    return () => window.removeEventListener(RESOURCE_CREATED_EVENT, handleResourceCreated);
  }, [load]);

  return { items, loading, error, reload: load };
}

// src/servers/hooks/useRefreshDocs.ts
"use client";

import { Task } from "@/src/types/task";
import { useCallback, useState } from "react";

export const useTasks = (initial: Task[] = []) => {
  const [tasks, setTasks] = useState<Task[]>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/getFiles", { cache: "no-store" });

      const ct = res.headers.get("content-type") ?? "";
      if (!res.ok || !ct.includes("application/json")) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
      }

      const body = (await res.json()) as { tasks: Task[] };
      setTasks(body.tasks);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { tasks, loading, error, fetchTasks };
};
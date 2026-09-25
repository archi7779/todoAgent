import { useCallback, useState } from "react";
import { appError, parseError } from "@/src/lib/error";
export type DisplayMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export const useAgentHistory = (threadId: string) => {
  const [history, setHistory] = useState<DisplayMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/getAgentHistory?threadId=${encodeURIComponent(threadId)}`,
        { cache: "no-store" },
      );

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw appError(
          "HTTP",
          `HTTP ${res.status}: ${body?.error ?? ""}`,
          "Не удалось загрузить историю",
        );
      }

      const data = await res.json();
      setHistory(data.history ?? []);
    } catch (e) {
      const parsed = parseError(e);
      setError(parsed.userMessage);
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  // БЕЗ useEffect — автозагрузки нет, дёргаем из ChatInner
  return { history, loading, error, fetchHistory };
};
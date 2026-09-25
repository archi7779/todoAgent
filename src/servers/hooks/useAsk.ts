"use client";

import { useCallback, useState } from "react";
import type { SSEEvent, Status, Interrupt } from "@/src/types/common";
import { useError } from "@/app/providers";
import { setAgentAnswer } from "../helpers/makeAgentAnswer";
import { appError } from "@/src/lib/error";

export const useASkAgent = (threadId: string) => {
  const { report } = useError();

  const [answ, setAnsw] = useState<string>("");
  const [interrupt, setInterrupt] = useState<Interrupt | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [toolName, setToolName] = useState<string | null>(null);

  const readSSE = async (response: Response) => {
    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        const line = part.trim();
        if (!line.startsWith("data:")) continue;

        const json = line.slice(5).trim();
        if (!json) continue;

        let event: SSEEvent;
        try {
          event = JSON.parse(json);
        } catch {
          continue;
        }

        setAgentAnswer(event, setAnsw, setStatus, setToolName, setInterrupt);

        if (event.type === "error") {
          report({
            code: event.error,                                   // "STREAM"
            message: event.message ?? "Агент не смог ответить",  // JSON-строка
          });
        }
      }
    }
  };

  const send = async (payload: Record<string, unknown>) => {
    setIsRunning(true);
    setAnsw("");
    setInterrupt(null);
    setStatus("thinking");
    setToolName(null);

    try {
      const res = await fetch("/api/askAgent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, threadId }),
      });

      if (!res.ok) {
          report({
            code: "HTTP",
            message: `HTTP ${res.status}`,
          });
          return;
        }

      await readSSE(res);
} catch (err) {
  report({
    code: "UNKNOWN",
    message: err instanceof Error ? err.message : String(err),
  });
} finally {
      setIsRunning(false);
      setStatus("idle");
      setToolName(null);
    }
  };

  const goFetch = (q: string) => send({ message: q });
  const resume = (decision: unknown) => send({ resume: decision });

  return {
    goFetch,
    resume,
    answ,
    interrupt,
    isRunning,
    status,
    toolName,
  };
};
import { Dispatch, SetStateAction } from "react";
import type { SSEEvent, Status, Interrupt } from "@/src/types/common";

export const setAgentAnswer = (
  event: SSEEvent,
  setAnsw: Dispatch<SetStateAction<string>>,
  setStatus: Dispatch<SetStateAction<Status>>,
  setToolName: Dispatch<SetStateAction<string | null>>,
  setInterrupt: Dispatch<SetStateAction<Interrupt | null>>,
) => {
  switch (event.type) {
    case "token":
      setAnsw((prev) => prev + event.content);
      setStatus("thinking");
      break;

    case "tool_call":
      setStatus("working");
      setToolName(event.tool);
      break;

    case "node_end":
      if (event.node === "tools") setToolName(null);
      break;

    case "interrupt":
      setInterrupt(event.interrupt as Interrupt);
      setStatus("idle");
      setToolName(null);
      break;

    case "done":
      setAnsw("");          // ← очищаем, история подтянется отдельно
      setInterrupt(null);
      setStatus("idle");
      setToolName(null);
      break;

    case "error": 
      setStatus("idle");
      setToolName(null);
      break;
  }
};
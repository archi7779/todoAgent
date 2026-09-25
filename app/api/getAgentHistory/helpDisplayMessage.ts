import { BaseMessage } from "@langchain/core/messages";

export type DisplayMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export function toDisplayMessage(m: BaseMessage): DisplayMessage | null {
  const type = m.type;
  if (type !== "human" && type !== "ai") return null;

  const content = typeof m.content === "string" ? m.content : "";
  if (!content.trim()) return null;

  return {
    id: m.id ?? crypto.randomUUID(),
    role: type === "human" ? "user" : "assistant",
    content,
  };
}
import type { AIMessageChunk, BaseMessage } from "@langchain/core/messages";
import type { SSEOutbound } from "@/src/lib/sse";
type RequestBody = {
  threadId?: string;
  message?: string;
  resume?:  Record<string, unknown>  // ← или конкретный тип, который ждёт Command
};

export function handleMessageChunk(
  chunk: AIMessageChunk,
  metadata: { langgraph_node?: string },
): SSEOutbound[] {
  if (metadata.langgraph_node !== "agent") return [];

  const out: SSEOutbound[] = [];
  const hasToolCalls = (chunk.tool_call_chunks?.length ?? 0) > 0;

  const reasoning = chunk.contentBlocks?.filter(b => b.type === "reasoning");
  if (reasoning?.length) {
    out.push({
      type: "reasoning",
      content: reasoning.map(b => b.reasoning).join(""),
    });
  }

  const text = chunk.contentBlocks?.filter(b => b.type === "text");
  if (text?.length && !hasToolCalls) {
    out.push({ type: "token", content: text.map(b => b.text).join("") });
  }

  return out;
}

export function handleUpdate(
  nodeName: string,
  update: unknown,
): SSEOutbound[] {
  const out: SSEOutbound[] = [];

  // сначала tool_calls (порядок исправлен!)
  const msgs = (update as { messages?: BaseMessage[] })?.messages ?? [];
  for (const m of msgs) {
    const toolCalls = (m as { tool_calls?: { name: string; args: unknown }[] }).tool_calls;
    if (!toolCalls?.length) continue;
    for (const c of toolCalls) {
      out.push({ type: "tool_call", node: nodeName, tool: c.name, args: c.args });
    }
  }

  // потом node_end
  out.push({ type: "node_end", node: nodeName });

  return out;
}


export function buildFinalEvent(finalState: unknown): SSEOutbound {
  const state = finalState as {
    values?: { messages?: BaseMessage[] };
    tasks?: { interrupts?: { value?: unknown }[] }[];
  };

  const interrupts = state.tasks?.flatMap(t => t.interrupts ?? []) ?? [];
  if (interrupts.length > 0) {
    const first = interrupts[0];
    return { type: "interrupt", interrupt: first.value ?? first };
  }

  const msgs = state.values?.messages ?? [];
  const last = msgs.at(-1)?.content ?? "NoMessage";
  return { type: "done", message: typeof last === "string" ? last : "NoMessage" };
}

export function parseRequestBody(raw: unknown): RequestBody  | null {
  if (typeof raw !== "object" || raw === null) return null;
  const b = raw as Record<string, unknown>;
  return {
    threadId: typeof b.threadId === "string" ? b.threadId : undefined,
    message: typeof b.message === "string" ? b.message : undefined,
    resume: b.resume as Record<string, unknown> | undefined,
  };
}
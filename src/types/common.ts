export type SSEEvent =
  | { type: "token"; node: string; content: string }
  | { type: "node_end"; node: string }
  | { type: "tool_call"; node: string; tool: string; args: any }
  | { type: "interrupt"; interrupt: any }
  | { type: "done"; message: string }
  | { type: "error"; error: string,message?: string };

export type Status = "idle" | "thinking" | "working";

export type Interrupt = {
  message?: string;
  taskId?: string;
  value?: unknown;
  [key: string]: unknown;
};
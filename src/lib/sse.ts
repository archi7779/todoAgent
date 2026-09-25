export type SSEOutbound =
  | { type: "token"; content: string }
  | { type: "reasoning"; content: string }
  | { type: "tool_call"; node: string; tool: string; args: unknown }
  | { type: "node_end"; node: string }
  | { type: "interrupt"; interrupt: unknown }
  | { type: "done"; message: string }
  | { type: "error"; error: string; message?: string };

export function makeSSESender(controller: ReadableStreamDefaultController<Uint8Array>) {
  const encoder = new TextEncoder();
  return (data: SSEOutbound) =>
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
}
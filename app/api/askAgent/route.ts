import { getApp } from "@/src/agent";
import { buildFinalEvent, handleMessageChunk, handleUpdate, parseRequestBody } from "@/src/agent/streamHandlers";
import { parseError } from "@/src/lib/error";
import { makeSSESender } from "@/src/lib/sse";
import { logger } from "@/src/logger/logger";
import { AIMessageChunk, BaseMessage, HumanMessage } from "@langchain/core/messages";
import { Command } from "@langchain/langgraph";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // 1. Парсинг body
  let raw: unknown;
  try { raw = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const body = parseRequestBody(raw);
   if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  // 2. thread_id
  const threadId = body.threadId ?? "default";
  const config = { configurable: { thread_id: threadId } };
  const message = typeof body.message === 'string' ? body.message : undefined;
  const resume = body.resume;
  // 3. Инициализация графа
  let app;
  try {
    app = await getApp();
  } catch (e) {
   const parsed = parseError(e);
    logger.error({ tool: "api", err: parsed.technicalMessage }, "app init failed");
    return NextResponse.json({ error: "Агент не доступен" }, { status: 503 });
  }

  // 4. Валидация
  if (resume === undefined && !message) {
    return NextResponse.json({ error: "Пользователь не передал сообщение" }, { status: 400 });
  }

  // 5. Формируем input
  const input = resume !== undefined
      ? new Command<unknown, Record<string, unknown>, "__start__" | "agent" | "tools">({ resume })
      : { messages: [new HumanMessage(message!)] };

  const t0 = performance.now();
  const stream = new ReadableStream({
  async start(controller) {
    const send = makeSSESender(controller);

    try {
      const eventStream = await app.stream(input, {
        ...config,
        streamMode: ["messages", "updates"],
      });
      //Обрабатываем поток Сообщений-------------------------------------------------------------------------------------------------
      for await (const event of eventStream) {
        const [mode, payload] = event as
          | ["messages", [AIMessageChunk, { langgraph_node?: string }]]
          | ["updates", Record<string, unknown>];      
                // --- токены ---
     if (mode === "messages") {
          const [chunk, metadata] = payload;
          for (const evt of handleMessageChunk(chunk, metadata)) {
            send(evt);
          }
        }
        // --- переходы узлов + tool_calls Для отображения на фронте какая нода работает----------------------------------------------------------------------------------------------------
        if (mode === "updates") {
          for (const [nodeName, update] of Object.entries(payload)) {
            for (const evt of handleUpdate(nodeName, update)) {
              send(evt);
            }
          }
        }
      }

      // 7. После стрима — финальный state и interrupt
      //TODO: ТИПИЗАЦИЯ!!!! finalState - any = bullshit
      const finalState = await app.getState(config);
      const values = finalState?.values ?? {};
      const interrupts = finalState?.tasks?.flatMap((t: any) => t.interrupts ?? []) ?? [];

      logger.info(
        {
          tool: "run",
          threadId,
          ms: Math.round(performance.now() - t0),
          llmCalls: values.llmCalls ?? 0,
          totalTokens: values.totalTokens ?? 0,
          hasInterrupt: interrupts.length > 0,
        },
        "run finished",
      );

      send(buildFinalEvent(finalState));
      } catch (e) {
          const parsed = parseError(e);
          logger.error(
            { tool: "run", threadId, code: parsed.code, err: parsed.technicalMessage },
            "stream failed",
          );
          send({ type: "error", error: parsed.code, message: parsed.userMessage });
        } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
import { getApp } from "@/src/agent";
import { parseError } from "@/src/lib/error";
import { logger } from "@/src/logger/logger";
import { BaseMessage } from "@langchain/core/messages";
import { NextResponse } from "next/server";
import { DisplayMessage, toDisplayMessage } from "./helpDisplayMessage";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const threadId = searchParams.get("threadId");
    if(!threadId){
         return NextResponse.json({ error: "Не передан айдиТреда" }, { status: 400 });
    }
  const config = { configurable: { thread_id: threadId } };
  let app;
    try {
      app = await getApp();
    } catch (e) {
     const parsed = parseError(e);
      logger.error({ tool: "api", err: parsed.technicalMessage }, "app init failed");
      return NextResponse.json({ error: "Агент не доступен" }, { status: 503 });
    }
      
        try {
        const state = await app.getState(config);
        const raw = (state?.values as { messages?: unknown } | undefined)?.messages;
        const messages: BaseMessage[] = Array.isArray(raw) ? (raw as BaseMessage[]) : [];

        const history: DisplayMessage[] = messages
            .map(toDisplayMessage)
            .filter((m): m is DisplayMessage => m !== null);
              console.log("messages",messages)

        return NextResponse.json({ history });
        } catch (e) {
        const parsed = parseError(e);
        logger.error(
            {
            tool: "history",
            threadId,
            code: parsed.code,
            err: parsed.technicalMessage,
            },
            "getState failed",
        );
        return NextResponse.json(
            { error: "Не удалось получить историю" },
            { status: 500 },
        );
        }
      
}

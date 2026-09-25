import { AIMessageChunk } from "@langchain/core/messages";
import type { UsageMetadata } from "@langchain/core/messages";
import type { Runnable } from "@langchain/core/runnables";
import { logger } from "@/src/logger/logger";
import { appError } from "@/src/lib/error";
import { AgentState } from "../graph/helpers/agentState";

type AgentNodeDeps = {
  model: Runnable;
};

export function makeAgentNode({ model }: AgentNodeDeps) {
  return async function agentNode(state: typeof AgentState.State) {
    const callNumber = (state.llmCalls ?? 0) + 1;
    const t0 = performance.now();

    const eventStream = await model.streamEvents(state.messages, { version: "v2" });

    let response: AIMessageChunk | null = null;
    let finalUsage: UsageMetadata | null = null;

    for await (const event of eventStream) {
      if (event.event === "on_chat_model_stream") {
        const chunk = (event.data as { chunk: AIMessageChunk }).chunk;
        response = response === null ? chunk : response.concat(chunk);
      }
      if (event.event === "on_chat_model_end") {
        const output = (event.data as { output?: { usage_metadata?: UsageMetadata } }).output;
        finalUsage = output?.usage_metadata ?? null;
      }
    }

    const elapsed = performance.now() - t0;

    if (!response) {
      logger.error({ tool: "agent", call: callNumber }, "model stream returned empty");
      throw appError(
        "STREAM",
        "model.streamEvents вернул пустой поток",
        "Агент не смог ответить",
      );
    }

    logger.info(
      {
        tool: "agent",
        call: callNumber,
        ms: Math.round(elapsed),
        ...(finalUsage && {
          tokens: {
            in: finalUsage.input_tokens,
            out: finalUsage.output_tokens,
            total: finalUsage.total_tokens,
          },
        }),
      },
      "llm call finished",
    );

    return {
      messages: [response],
      llmCalls: 1,
      totalTokens: finalUsage?.total_tokens ?? 0,
    };
  };
}
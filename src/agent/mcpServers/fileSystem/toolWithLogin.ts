import { logger } from "@/src/logger/logger";

// Проверка: это interrupt или реальная ошибка?
function isGraphInterrupt(err: unknown): boolean {
  return (
    err instanceof Error &&
    (err.name === "GraphInterrupt" ||
      err.constructor?.name === "GraphInterrupt" ||
      // на случай, если LangGraph кидает что-то похожее
      err.message?.includes("interrupt"))
  );
}

export function withToolLogging<Args, Res>(
  name: string,
  fn: (args: Args) => Promise<Res>,
): (args: Args) => Promise<Res> {
  return async (args) => {
    const t0 = Date.now();
    logger.debug({ tool: name, args }, "tool start");

    try {
      const res = await fn(args);
      logger.info({ tool: name, ms: Date.now() - t0 }, "tool did ok");
      return res;
    } catch (err) {
      // 🔑 Interrupt — это не ошибка, а пауза. Пробрасываем без лога "failed".
      if (isGraphInterrupt(err)) {
        logger.debug({ tool: name, ms: Date.now() - t0 }, "tool paused (interrupt)");
        throw err;
      }

      logger.error(
        { tool: name, args, ms: Date.now() - t0, err: (err as Error).message },
        "tool failed",
      );
      throw err;
    }
  };
}
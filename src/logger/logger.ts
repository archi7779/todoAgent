import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: { app: "ai-agent" },           // добавится в каждый лог
  timestamp: pino.stdTimeFunctions.isoTime,
  // Красиво в dev, JSON в prod
  transport:
    process.env.NODE_ENV === "production"
      ? undefined
      : { target: "pino-pretty", options: { colorize: true, translateTime: "SYS:HH:MM:ss.l" } },
});
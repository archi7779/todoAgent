import { logger } from "@/src/logger/logger";
import { App, buildApp } from "../buildApp";

let appPromise: Promise<App> | null = null;

export function getApp(): Promise<App> {
  if (!appPromise) {
    appPromise = buildApp().catch((err) => {
      appPromise = null;
      logger.error({ tool: "agent", err }, "buildApp failed");
      throw err;
    });
  }
  return appPromise;
}
  

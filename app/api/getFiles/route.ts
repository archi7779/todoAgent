import { readTasksFile } from "@/src/agent/mcpServers/fileSystem/jsonStore";
import { logger } from "@/src/logger/logger";
import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
const FILE =
  process.env.TASKS_FILE ??
  path.resolve(process.cwd(), "public", "Agent-task", "tasks.json");

export async function GET() {
  const t0 = Date.now();
  try {
    const data = await readTasksFile(FILE); // ← всегда читает диск заново
    logger.info({ count: data.tasks.length, ms: Date.now() - t0 }, "[tasks] read ok");

    return NextResponse.json(
      { tasks: data.tasks, ts: Date.now() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    logger.error({ err: (e as Error).message }, "[tasks] read failed");
    return NextResponse.json(
      { tasks: [], error: (e as Error).message },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
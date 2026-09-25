import { logger } from "@/src/logger/logger";
import { TasksFile, TasksFileSchema } from "@/src/types/task";
import { readFile, writeFile, rename } from "node:fs/promises";

let queue: Promise<unknown> = Promise.resolve();

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const next = queue.then(fn, fn);
  queue = next.catch(() => {});
  return next;
}

export async function readTasksFile(file: string): Promise<TasksFile> {
  const raw = await readFile(file, "utf8");
  const parsed = JSON.parse(raw);
  const result = TasksFileSchema.safeParse(parsed);
  if (!result.success) {
    logger.error({ file, issues: result.error.issues }, "tasks file schema invalid");
    throw new Error(
      `Invalid tasks file: ${result.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ")}`,
    );
  }
  return result.data;
}

async function writeTasksFile(file: string, data: TasksFile): Promise<void> {
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await rename(tmp, file);
}

/** Все изменения идут только через это — лок гарантирован */
export async function updateTasksFile(
  file: string,
  mutate: (data: TasksFile) => void | Promise<void>,
): Promise<{ count: number }> {
  return withLock(async () => {
    const data = await readTasksFile(file);
    await mutate(data);
    await writeTasksFile(file, data);
    return { count: data.tasks.length };
  });
}
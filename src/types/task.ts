import { z } from "zod";

// 1. Тип задачи — источник правды через zod
export const TaskSchema = z.object({
  id: z.string().min(1).max(64),
  type: z.enum(["dayly", "common"]),          // опечатка как в задании — оставь, если так в данных
  content: z.string().min(1).max(10_000),
  status: z.enum(["done", "pending"]),
  comment: z.string().max(2_000).optional(),
});

export type Task = z.infer<typeof TaskSchema>;

// 2. Файл — массив задач. Если у тебя объект-обёртка — поправь.
export const TasksFileSchema = z.object({
    tasks: z.array(TaskSchema),
});
export type TasksFile = z.infer<typeof TasksFileSchema>;
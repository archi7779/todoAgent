import { TaskSchema } from "@/src/types/task";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { withToolLogging } from "./toolWithLogin";
import { interrupt } from "@langchain/langgraph";
import { updateTasksFile } from "./jsonStore";


const EditArgsSchema = z
  .object({
    upsert: TaskSchema.optional(),
    deleteId: z.string().min(1).optional(),
    patch: z
      .object({
        id: z.string().min(1),
        status: z.enum(["done", "pending"]).optional(),
        comment: z.string().max(2_000).optional(),
      })
      .optional(),
  })
  .refine((v) => [v.upsert, v.deleteId, v.patch].filter(Boolean).length === 1, {
    message: "Ровно одна операция: upsert | deleteId | patch",
  });

export function makeEditTasksTool(file: string) {
  return new DynamicStructuredTool({
    name: "edit_tasks",
    description:
      "Modify tasks. Exactly one op per call: " +
      "`upsert` (add/replace by id), `deleteId`, or `patch` (status/comment).",
    schema: EditArgsSchema,
    func: withToolLogging("edit_tasks", async (args) => {
      // 🔐 HITL только для delete
      if (args.deleteId) {
        const decision = interrupt({
          kind: "confirm_delete",
          taskId: args.deleteId,
          message: `Подтвердите удаление задачи ${args.deleteId}?`,
        });
        // decision — то, что вернёт клиент при resume
        if (!decision?.approved) {
          return JSON.stringify({
            ok: false,
            rejected: true,
            reason: "Удаление отклонено пользователем",
            deleteId: args.deleteId,
          });
        }
      }

      const result = await updateTasksFile(file, (data) => {
        const tasks = data.tasks;

        if (args.upsert) {
          const idx = tasks.findIndex((t) => t.id === args.upsert!.id);
          if (idx >= 0) tasks[idx] = args.upsert;
          else tasks.push(args.upsert);
        } else if (args.deleteId) {
          const idx = tasks.findIndex((t) => t.id === args.deleteId);
          if (idx < 0) throw new Error(`Task ${args.deleteId} not found`);
          tasks.splice(idx, 1);
        } else if (args.patch) {
          const t = tasks.find((x) => x.id === args.patch!.id);
          if (!t) throw new Error(`Task ${args.patch.id} not found`);
          if (args.patch.status) t.status = args.patch.status;
          if (args.patch.comment !== undefined) t.comment = args.patch.comment;
        }
      });
      return JSON.stringify({ ok: true, ...result });
    }),
  });
}
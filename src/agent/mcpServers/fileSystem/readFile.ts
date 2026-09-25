import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { readTasksFile } from "./jsonStore";
import { withToolLogging } from "./toolWithLogin";


export function makeReadTasksTool(file: string) {
  return new DynamicStructuredTool({
    name: "read_tasks",
    description: "Read the tasks JSON file and return all tasks.",
    schema: z.object({}),
    func: withToolLogging("read_tasks", async () => {
      const data = await readTasksFile(file);
      return JSON.stringify(data);
    }),
  });
}
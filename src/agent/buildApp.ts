import path from "node:path";
import { StateGraph, START, END, MemorySaver } from "@langchain/langgraph";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";
import { makeReadTasksTool } from "./mcpServers/fileSystem/readFile";
import { makeEditTasksTool } from "./mcpServers/fileSystem/editFile";
import { makeAgentNode } from "./nodes/agentNode";
import { AgentState } from "./graph/helpers/agentState";
import { getChatModel } from "./getModel";

export async function buildApp() {
  const checkpointer = new MemorySaver();

  const FILE =
    process.env.TASKS_FILE ??
    path.join(process.cwd(), "public", "Agent-task", "tasks.json");

  const tools = [makeReadTasksTool(FILE), makeEditTasksTool(FILE)];
  const model = (await getChatModel()).bindTools(tools);

  const agentNode = makeAgentNode({ model });

  return new StateGraph(AgentState)
    .addNode("agent", agentNode)
    .addNode("tools", new ToolNode(tools))
    .addEdge(START, "agent")
    .addConditionalEdges("agent", toolsCondition, ["tools", END])
    .addEdge("tools", "agent")
    .compile({ checkpointer });
}

export type App = Awaited<ReturnType<typeof buildApp>>;
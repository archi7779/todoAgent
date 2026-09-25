import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { DynamicStructuredTool } from "@langchain/core/tools";

type McpInstance = {
  client: Client;
  tools: DynamicStructuredTool[];
};

declare global {
  // eslint-disable-next-line no-var
  var __mcpFileSystem: {
    instance: McpInstance | null;
    promise: Promise<McpInstance> | null;
  } | undefined;
}

if (!globalThis.__mcpFileSystem) {
  globalThis.__mcpFileSystem = { instance: null, promise: null };
}

export const mcpFileSystem = globalThis.__mcpFileSystem;

//Если хочу еще 1 сервер = в declare global еще 1 переменную, + if 
import "server-only";
import path from "node:path";
import { makeReadTasksTool } from "./readFile";
import { makeEditTasksTool } from "./editFile";

const pathToFolder = path.resolve(process.cwd(), "public/Agent-task");

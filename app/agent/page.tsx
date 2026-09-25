import fs from "node:fs/promises";
import path from "node:path";
import Chat from "@/src/features/Chat";
import FileList from "@/src/features/FileList";
import { Task } from "@/src/types/task";
import type { CSSProperties } from "react";

const FILE = path.join(process.cwd(), "public", "Agent-task", "tasks.json");

export default async function AgentPage() {
  let tasks: Task[] = [];
  let loadError: string | null = null;

  try {
    const raw = await fs.readFile(FILE, "utf8");
    tasks = JSON.parse(raw).tasks ?? [];
  } catch (e) {
    console.error("[page] read failed:", e);
    loadError = "Не удалось загрузить список задач";
  }

  return (
    <main style={pageStyles.root}>
      {/* ЛЕВАЯ КОЛОНКА — ЧАТ */}
      <section style={pageStyles.chatSection}>
        <Chat />
      </section>

      {/* ПРАВАЯ КОЛОНКА — ЗАДАЧИ */}
      <section style={pageStyles.tasksSection}>
        <div style={pageStyles.tasksHeader}>Задачи</div>
        <div style={pageStyles.tasksBody}>
          {loadError ? (
            <div style={pageStyles.error}>⚠ {loadError}</div>
          ) : (
            <FileList initialFiles={tasks} />
          )}
        </div>
      </section>
    </main>
  );
}

const pageStyles = {
  root: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 380px",   // чат гибкий, задачи 380px
    gap: 16,
    height: "100dvh",
    padding: 16,
    boxSizing: "border-box",
    background: "#f5f5f7",
    fontFamily: "system-ui, -apple-system, sans-serif",
  } as CSSProperties,

  chatSection: {
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
  } as CSSProperties,

  tasksSection: {
    minHeight: 0,
    background: "white",
    borderRadius: 12,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  } as CSSProperties,

  tasksHeader: {
    padding: "12px 16px",
    borderBottom: "1px solid #eee",
    fontWeight: 600,
    fontSize: 14,
    color: "#333",
  } as CSSProperties,

  tasksBody: {
    flex: 1,
    overflowY: "auto",
    minHeight: 0,
    padding: 12,
  } as CSSProperties,

  error: {
    color: "#c00",
    fontSize: 13,
    padding: "8px 16px",
  } as CSSProperties,
};
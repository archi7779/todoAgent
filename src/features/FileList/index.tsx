"use client";

import { useTasks } from "@/src/servers/hooks/useRefreshDocs";
import s from "./filelist.module.css";
import { Task } from "@/src/types/task";

const STATUS_META: Record<
  Task["status"],
  { label: string; icon: string; rowClass: string; iconClass: string; labelClass: string }
> = {
  done: {
    label: "Готово",
    icon: "✓",
    rowClass: s.rowDone,
    iconClass: s.iconDone,
    labelClass: s.labelDone,
  },
  pending: {
    label: "В работе",
    icon: "○",
    rowClass: s.rowPending,
    iconClass: s.iconPending,
    labelClass: s.labelPending,
  },
};

const TYPE_META: Record<Task["type"], { label: string; badgeClass: string }> = {
  dayly:  { label: "Ежедневная", badgeClass: s.badgeDaily },
  common: { label: "Обычная",    badgeClass: s.badgeCommon },
};

export default function FileList({ initialFiles }: { initialFiles: Task[] }) {
  const { tasks, loading, error, fetchTasks } = useTasks(initialFiles);

  const doneCount = tasks.filter((t) => t.status === "done").length;

  return (
    <div className={s.wrap}>
      <div className={s.header}>
        <div className={s.counter}>
          Всего: {tasks.length}
          {tasks.length > 0 && <> · готово {doneCount}</>}
        </div>
        <button className={s.refresh} onClick={fetchTasks} disabled={loading}>
          <span className={loading ? s.spin : ""}>⟳</span>
          {loading ? "Обновление..." : "Обновить"}
        </button>
      </div>

      {error && <div className={s.error}>Ошибка: {error}</div>}

      {!loading && !error && tasks.length === 0 && (
        <div className={s.empty}>Задач пока нет</div>
      )}

      <ul className={s.list}>
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} />
        ))}
      </ul>
    </div>
  );
}

function TaskRow({ task }: { task: Task }) {
  const status = STATUS_META[task.status];
  const type = TYPE_META[task.type];

  return (
    <li className={`${s.row} ${status.rowClass}`}>
      <span
        className={`${s.statusIcon} ${status.iconClass}`}
        aria-label={status.label}
        title={status.label}
      >
        {status.icon}
      </span>

      <div className={s.content}>
        <div className={s.meta}>
          <span className={`${s.badge} ${type.badgeClass}`}>{type.label}</span>
          <span className={`${s.statusLabel} ${status.labelClass}`}>
            {status.label}
          </span>
          <span className={s.id}>#{task.id}</span>
        </div>

        <p className={`${s.text} ${task.status === "done" ? s.textDone : ""}`}>
          {task.content}
        </p>

        {task.comment && <p className={s.comment}>💬 {task.comment}</p>}
      </div>
    </li>
  );
}
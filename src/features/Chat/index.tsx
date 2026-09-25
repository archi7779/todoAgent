"use client";

import { DisplayMessage, useAgentHistory } from "@/src/servers/hooks/useAgentHistory";
import { useASkAgent } from "@/src/servers/hooks/useAsk";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { Interrupt } from "@/src/types/common";

/* ============================================================
   ОСНОВНОЙ КОМПОНЕНТ — только генерация threadId
   ============================================================ */
  //НЕйрослоп - впадлу делать аюай тут
export default function Chat() {
  const [threadId, setThreadId] = useState<string | null>(null);

  useEffect(() => {
    setThreadId(crypto.randomUUID());
  }, []);

  if (!threadId) {
    return <div style={styles.empty}>Инициализация…</div>;
  }

  return <ChatInner threadId={threadId} />;
}

/* ============================================================
   ВНУТРЕННИЙ КОМПОНЕНТ — вся логика чата
   ============================================================ */

function ChatInner({ threadId }: { threadId: string }) {
  const [question, setQuestion] = useState("");
  const [pendingUserMessage, setPendingUserMessage] =
    useState<DisplayMessage | null>(null);

  const { goFetch, answ, interrupt, resume, isRunning, status, toolName } =
    useASkAgent(threadId);
  const { history, loading, error, fetchHistory } = useAgentHistory(threadId);

  // Грузим историю при монтировании и после каждого завершённого стрима
  useEffect(() => {
    if (!isRunning && status === "idle") {
      fetchHistory().then(() => {
        setPendingUserMessage(null); // history теперь содержит наше сообщение
      });
    }
  }, [isRunning, status, fetchHistory]);

  const handleAsk = () => {
    if (!question.trim() || isRunning) return;

    const text = question.trim();

    // Оптимистично показываем сообщение пользователя сразу
    setPendingUserMessage({
      id: `pending-${crypto.randomUUID()}`,
      role: "user",
      content: text,
    });

    goFetch(text);
    setQuestion("");
  };

  const messages = useMemo(() => {
    const list: DisplayMessage[] = [];

    // 1. Сначала вся история
    list.push(...history);

    // 2. Потом твоё новое сообщение (оптимистично) — идёт в конец
    if (pendingUserMessage) {
      list.push(pendingUserMessage);
    }

    // 3. Потом стриминговый ответ
    if (answ) {
      list.push({ id: "__streaming__", role: "assistant", content: answ });
    }

    return list;
  }, [history, answ, pendingUserMessage]);

  return (
    <div style={styles.chatPanel}>
      <div style={styles.header}>
        <span>Агент</span>
        <span style={styles.headerId}>{threadId.slice(0, 8)}</span>
      </div>

      <ChatScroll messages={messages} loading={loading} />

      {error && <div style={styles.error}>⚠ {error}</div>}

      {/* ИНДИКАТОРЫ — над полем ввода */}
      {isRunning && status === "thinking" && !answ && (
        <div style={styles.meta}>🤔 Думаю…</div>
      )}
      {isRunning && status === "working" && (
        <div style={styles.meta}>
          🔧 Работаю: {toolName ?? "инструмент"}…
        </div>
      )}
      {isRunning && status === "thinking" && !toolName && answ && (
        <div style={styles.meta}>✍️ Формирую ответ…</div>
      )}

      <Composer
        value={question}
        onChange={setQuestion}
        onSend={handleAsk}
        disabled={isRunning}
      />

      {interrupt && (
        <ApprovalModal
          isRunnign={isRunning}
          interrupt={interrupt}
          onApprove={() => resume({ approved: true })}
          onDeny={() =>
            resume({ approved: false, reason: "Пользователь отказал" })
          }
        />
      )}
    </div>
  );
}

/* ============================================================
   СТИЛИ
   ============================================================ */

const colors = {
  panel: "#ffffff",
  border: "#eeeeee",
  text: "#1a1a1a",
  muted: "#888888",
  faint: "#999999",
  userBubble: "#007aff",
  userText: "#ffffff",
  aiBubble: "#f0f0f2",
  error: "#c00",
  primary: "#007aff",
  danger: "#dc2626",
};

const styles = {
  chatPanel: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    minHeight: 0,
    background: colors.panel,
    borderRadius: 12,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    overflow: "hidden",
    fontFamily: "system-ui, -apple-system, sans-serif",
  } as CSSProperties,

  header: {
    padding: "12px 16px",
    borderBottom: `1px solid ${colors.border}`,
    fontWeight: 600,
    fontSize: 14,
    color: colors.text,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  } as CSSProperties,

  headerId: {
    fontSize: 12,
    color: colors.faint,
    fontWeight: 400,
  } as CSSProperties,

  error: {
    color: colors.error,
    fontSize: 13,
    padding: "8px 16px",
  } as CSSProperties,

  meta: {
    fontSize: 12,
    color: colors.muted,
    padding: "6px 16px",
    borderTop: `1px solid ${colors.border}`,
  } as CSSProperties,

  scroll: {
    flex: 1,
    overflowY: "auto",
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    minHeight: 0,
  } as CSSProperties,

  empty: {
    color: colors.faint,
    fontSize: 14,
    textAlign: "center",
    padding: "40px 20px",
  } as CSSProperties,

  row: (isUser: boolean): CSSProperties => ({
    display: "flex",
    justifyContent: isUser ? "flex-end" : "flex-start",
  }),

  bubble: (isUser: boolean): CSSProperties => ({
    maxWidth: "78%",
    padding: "10px 14px",
    borderRadius: 14,
    borderBottomRightRadius: isUser ? 4 : 14,
    borderBottomLeftRadius: isUser ? 14 : 4,
    fontSize: 14,
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    background: isUser ? colors.userBubble : colors.aiBubble,
    color: isUser ? colors.userText : colors.text,
  }),

  cursor: {
    marginLeft: 2,
    opacity: 0.6,
  } as CSSProperties,

  composer: {
    borderTop: `1px solid ${colors.border}`,
    padding: "12px 16px",
    display: "flex",
    gap: 8,
    background: colors.panel,
  } as CSSProperties,

  input: {
    flex: 1,
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #ddd",
    fontSize: 14,
    outline: "none",
  } as CSSProperties,

  sendBtn: (disabled: boolean): CSSProperties => ({
    padding: "10px 18px",
    borderRadius: 10,
    border: "none",
    background: disabled ? "#ccc" : colors.primary,
    color: "white",
    fontSize: 14,
    fontWeight: 500,
    cursor: disabled ? "not-allowed" : "pointer",
  }),

  modalBackdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  } as CSSProperties,

  modal: {
    background: "white",
    borderRadius: 12,
    padding: 24,
    minWidth: 320,
    maxWidth: 480,
    boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
  } as CSSProperties,

  modalActions: {
    display: "flex",
    gap: 8,
    justifyContent: "flex-end",
    marginTop: 20,
  } as CSSProperties,

  btnOutline: (disabled: boolean): CSSProperties => ({
    padding: "8px 16px",
    borderRadius: 8,
    border: "1px solid #ccc",
    background: "white",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
  }),

  btnDanger: (disabled: boolean): CSSProperties => ({
    padding: "8px 16px",
    borderRadius: 8,
    border: "none",
    background: disabled ? "#999" : colors.danger,
    color: "white",
    cursor: disabled ? "not-allowed" : "pointer",
  }),
};

/* ============================================================
   ПОДКОМПОНЕНТЫ
   ============================================================ */

function ChatScroll({
  messages,
  loading,
}: {
  messages: DisplayMessage[];
  loading: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  return (
    <div ref={ref} style={styles.scroll}>
      {loading && messages.length === 0 && (
        <div style={styles.empty}>Загружаю историю…</div>
      )}
      {!loading && messages.length === 0 && (
        <div style={styles.empty}>Начните диалог — задайте вопрос агенту.</div>
      )}

      {messages.map((m) => {
        const isUser = m.role === "user";
        const isStreaming = m.id === "__streaming__";

        return (
          <div key={m.id} style={styles.row(isUser)}>
            <div style={styles.bubble(isUser)}>
              {m.content}
              {isStreaming && <span style={styles.cursor}>▍</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Composer({
  value,
  onChange,
  onSend,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled: boolean;
}) {
  return (
    <div style={styles.composer}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
        placeholder="Спросите что-нибудь…"
        disabled={disabled}
        style={styles.input}
      />
      <button
        onClick={onSend}
        disabled={disabled || !value.trim()}
        style={styles.sendBtn(disabled)}
      >
        {disabled ? "…" : "Спросить"}
      </button>
    </div>
  );
}

function ApprovalModal({
  interrupt,
  onApprove,
  onDeny,
  isRunnign,
}: {
  interrupt: Interrupt;
  onApprove: () => void;
  onDeny: () => void;
  isRunnign: boolean;
}) {
  return (
    <div style={styles.modalBackdrop}>
      <div style={styles.modal}>
        <h3 style={{ marginTop: 0 }}>Подтверждение действия</h3>
        <p>{interrupt.message ?? "Агент просит подтвердить операцию"}</p>

        {interrupt.taskId && (
          <p style={{ fontSize: 12, color: "#666" }}>
            ID задачи: <code>{interrupt.taskId}</code>
          </p>
        )}

        <div style={styles.modalActions}>
          <button
            onClick={onDeny}
            disabled={isRunnign}
            style={styles.btnOutline(isRunnign)}
          >
            Отклонить
          </button>
          <button
            onClick={onApprove}
            disabled={isRunnign}
            style={styles.btnDanger(isRunnign)}
          >
            Подтвердить
          </button>
        </div>
      </div>
    </div>
  );
}
// app/providers.tsx
'use client';

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';

type AppError = {
  id: string;
  message: string;
  code?: string;
  cause?: unknown;
};

type Ctx = {
  errors: AppError[];
  report: (e: Omit<AppError, 'id'>) => void;
  dismiss: (id: string) => void;
};

const ErrorCtx = createContext<Ctx | null>(null);

export function ErrorProvider({ children }: { children: ReactNode }) {
  const [errors, setErrors] = useState<AppError[]>([]);

  const report = useCallback((e: Omit<AppError, 'id'>) => {
    const err = { ...e, id: crypto.randomUUID() };
    console.error('[app-error]', err);
    setErrors((prev) => [...prev, err]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setErrors((prev) => prev.filter((x) => x.id !== id));
  }, []);

  return (
    <ErrorCtx.Provider value={{ errors, report, dismiss }}>
      {children}

      {/* тосты — вверху по центру */}
      <div
        style={{
          position: 'fixed',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          zIndex: 999999,
          pointerEvents: 'none',
        }}
      >
        {errors.map((e) => (
          <div
            key={e.id}
            onClick={() => dismiss(e.id)}
            style={{
              background: '#fee',
              color: '#900',
              padding: '10px 14px',
              borderRadius: 8,
              cursor: 'pointer',
              maxWidth: 720,
              minWidth: 320,
              boxShadow: '0 4px 12px rgba(0,0,0,.15)',
              fontSize: 12,
              fontFamily: 'monospace',
              lineHeight: 1.4,
              wordBreak: 'break-all',
              whiteSpace: 'pre-wrap',
              pointerEvents: 'auto',
            }}
          >
            <b>{e.code ?? 'Ошибка'}</b>: {e.message}
          </div>
        ))}
      </div>
    </ErrorCtx.Provider>
  );
}

export function useError() {
  const ctx = useContext(ErrorCtx);
  if (!ctx) throw new Error('useError must be used inside ErrorProvider');
  return ctx;
}
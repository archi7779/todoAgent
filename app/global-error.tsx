'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error('[global-error]', error);

  return (
    <html lang="ru">
      <body>
        <h2>Что-то сломалось на уровне приложения</h2>
        <pre>{error.message}</pre>
        <button onClick={reset}>Попробовать снова</button>
      </body>
    </html>
  );
}
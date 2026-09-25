export type AppErrorCode =
  | 'HTTP'              // бэк ответил не 200
  | 'NO_BODY'           // тела ответа нет
  | 'BAD_CONTENT_TYPE'  // пришёл не text/event-stream
  | 'TIMEOUT'           // стрим молчит слишком долго
  | 'STREAM'            // ошибка внутри SSE-события
  | 'ABORTED'           // отмена пользователем (не показываем)
  | 'NETWORK'           // fetch упал (нет соединения и т.п.)
  | 'DOM'               // прочие DOMException
  | 'UNKNOWN';          // всё остальное

/** Своя ошибка — то, что ты кидаешь сам. */
export class AppError extends Error {
  code: AppErrorCode;
  userMessage: string;
  cause?: unknown;

  constructor(opts: {
    code: AppErrorCode;
    message: string;
    userMessage?: string;
    cause?: unknown;
  }) {
    super(opts.message);
    this.name = 'AppError';
    this.code = opts.code;
    this.userMessage = opts.userMessage ?? opts.message;
    this.cause = opts.cause;
  }
}

export type ParsedError = {
  code: AppErrorCode;
  userMessage: string;       // что показать пользователю ('' = не показывать)
  technicalMessage: string;  // что писать в лог
  cause?: unknown;           // оригинал (для Sentry и т.п.)
};

/** Приводит любую ошибку к единому виду. */
export function parseError(err: unknown): ParsedError {
  // 1) своя ошибка — доверяем её полям
  if (err instanceof AppError) {
    return {
      code: err.code,
      userMessage: err.userMessage,
      technicalMessage: err.message,
      cause: err.cause,
    };
  }

  // 2) DOMException — различаем по .name
  if (typeof DOMException !== 'undefined' && err instanceof DOMException) {
    if (err.name === 'AbortError') {
      return {
        code: 'ABORTED',
        userMessage: '',                 // отмену не показываем
        technicalMessage: 'AbortError',
        cause: err,
      };
    }
    return {
      code: 'DOM',
      userMessage: 'Ошибка браузера',
      technicalMessage: `${err.name}: ${err.message}`,
      cause: err,
    };
  }

  // 3) TypeError — чаще всего сетевой фейл fetch
  if (err instanceof TypeError) {
    return {
      code: 'NETWORK',
      userMessage: 'Нет соединения с агентом',
      technicalMessage: err.message,
      cause: err,
    };
  }

  // 4) любой другой Error
  if (err instanceof Error) {
    return {
      code: 'UNKNOWN',
      userMessage: typeof err === 'string' ? err : JSON.stringify(err),
      technicalMessage: err.message,
      cause: err,
    };
  }

  // 5) кинули не Error (строку, число, объект)
  return {
    code: 'UNKNOWN',
    userMessage: 'Что-то пошло не так',
    technicalMessage: typeof err === 'string' ? err : JSON.stringify(err),
    cause: err,
  };
}

/** Удобный шорткат, чтобы не писать new AppError({...}) каждый раз. */
export const appError = (
  code: AppErrorCode,
  message: string,
  userMessage?: string,
  cause?: unknown,
) => new AppError({ code, message, userMessage, cause });
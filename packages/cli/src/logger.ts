export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogFormat = 'pretty' | 'json';
type Fields = Record<string, string | number | boolean | undefined>;

export interface Logger {
  debug(msg: string, fields?: Fields): void;
  info(msg: string, fields?: Fields): void;
  warn(msg: string, fields?: Fields): void;
  error(msg: string, fields?: Fields): void;
}

const ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

/**
 * Structured logs on stderr (stdout is kept for machine-readable output). `json` emits one object
 * per line for CI log processors; `pretty` is for people.
 */
export function createLogger(
  options: { level?: LogLevel; format?: LogFormat; write?: (line: string) => void; now?: () => Date } = {},
): Logger {
  const min = ORDER[options.level ?? 'info'];
  const format = options.format ?? 'pretty';
  const write = options.write ?? ((line: string) => process.stderr.write(`${line}\n`));
  const now = options.now ?? (() => new Date());

  const log = (level: LogLevel, msg: string, fields: Fields = {}) => {
    if (ORDER[level] < min) return;
    const clean = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined));
    if (format === 'json') {
      write(JSON.stringify({ time: now().toISOString(), level, msg, ...clean }));
      return;
    }
    const tag = { debug: '·', info: '›', warn: '!', error: '✗' }[level];
    const extra = Object.entries(clean)
      .map(([k, v]) => `${k}=${String(v)}`)
      .join(' ');
    write(`${tag} ${msg}${extra ? `  ${extra}` : ''}`);
  };
  return {
    debug: (m, f) => {
      log('debug', m, f);
    },
    info: (m, f) => {
      log('info', m, f);
    },
    warn: (m, f) => {
      log('warn', m, f);
    },
    error: (m, f) => {
      log('error', m, f);
    },
  };
}

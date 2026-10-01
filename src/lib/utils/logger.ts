/* -----------------------------------------------------------------------------
 *  Copyright (c) 2023, Fraunhofer-Gesellschaft zur Förderung der angewandten Forschung e.V.
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published by
 *  the Free Software Foundation, version 3.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program. If not, see <https://www.gnu.org/licenses/>.  
 *
 *  No Patent Rights, Trademark Rights and/or other Intellectual Property
 *  Rights other than the rights under this license are granted.
 *  All other rights reserved.
 *
 *  For any other rights, a separate agreement needs to be closed.
 *
 *  For more information please contact:  
 *  Fraunhofer FOKUS
 *  Kaiserin-Augusta-Allee 31
 *  10589 Berlin, Germany
 *  https://www.fokus.fraunhofer.de/go/fame
 *  famecontact@fokus.fraunhofer.de
 * -----------------------------------------------------------------------------
 */
export const LogLevels = [
  'silent',
  'perf',
  'fatal',
  'error',
  'warn',
  'info',
  'debug',
  'trace',
] as const;

export interface LoggerOptions {
  name?: string; // name for the logger instance for better traceability
  level?:
    | 'silent'
    | 'perf'
    | 'fatal'
    | 'error'
    | 'warn'
    | 'info'
    | 'debug'
    | 'trace'
    | 'SILENT'
    | 'PERF'
    | 'FATAL'
    | 'ERROR'
    | 'WARN'
    | 'INFO'
    | 'DEBUG'
    | 'TRACE'; // case-insensitive log level
  maxMessageLength?: number; // limit message length to prevent flooding the console
}

export const LoggerDefaults: LoggerOptions = {
  name: 'default',
  level: 'info',
  maxMessageLength: parseInt(process.env.LOG_MAX_MESSAGE_LENGTH || '1000', 10), // default to 1k characters
};

/**
 * A simple logger class that supports different log levels and message formatting.
 * It allows you to control the verbosity of logs and includes timestamps for better traceability.
 * The logger can be easily extended to support additional features like log file writing or remote logging in the future.
 */
export class Logger {
  private name: string;
  private level: number;
  private maxMessageLength: number; // limit message length to prevent flooding the console

  constructor(options: LoggerOptions = LoggerDefaults) {
    this.name = options.name || LoggerDefaults.name!;
    this.level = LogLevels.indexOf(
      String(options.level || LoggerDefaults.level!).toLowerCase() as any
    ); // invalid log-level strings will disable logging
    this.maxMessageLength =
      options.maxMessageLength || LoggerDefaults.maxMessageLength!;
  }

  // Logger interface
  perf(message: string, ...args: any[]) {
    this.log(1 /* LogLevels.indexOf("perf") */, message, ...args);
  }
  fatal(message: string, ...args: any[]) {
    this.log(2 /* LogLevels.indexOf("fatal") */, message, ...args);
  }
  error(message: string, ...args: any[]) {
    this.log(3 /* LogLevels.indexOf("error") */, message, ...args);
  }
  warn(message: string, ...args: any[]) {
    this.log(4 /* LogLevels.indexOf("warn") */, message, ...args);
  }
  info(message: string, ...args: any[]) {
    this.log(5 /* LogLevels.indexOf("info") */, message, ...args);
  }
  debug(message: string, ...args: any[]) {
    this.log(6 /* LogLevels.indexOf("debug") */, message, ...args);
  }
  trace(message: string, ...args: any[]) {
    this.log(7 /* LogLevels.indexOf("trace") */, message, ...args);
  }

  private log(level: number, message: string, ...args: any[]) {
    if (this.level >= level) {
      // late string format objects for better performance when logging is disabled
      const strings = [message, ...args].map((arg) => formatErroRecurse(arg));
      // limit string length to prevent flooding the console
      const trimmed = strings.map((str) =>
        str.length > this.maxMessageLength
          ? str.substring(0, this.maxMessageLength)
          : str
      );
      console.log(
        `${new Date().toISOString()} [${LogLevels[level]}] [${this.name}]`,
        ...trimmed
      );
    }
  }
}

function formatLoggerCallSiteStack(): string {
  const stack = new Error('Logger call site').stack;
  if (!stack) return '';

  const frames = stack
    .split('\n')
    .slice(2)
    .map((line) => line.trim());

  const projectFrames = frames.filter(
    (line) =>
      line.includes(process.cwd()) &&
      !line.includes('node_modules') &&
      !line.includes('logger.ts')
  );

  if (!projectFrames.length) return '';
  return `Logged from:\n${projectFrames.join('\n')}`;
}

function formatErroRecurse(
  arg: any,
  seen: WeakSet<object> = new WeakSet()
): string {
  if (arg === null || arg === undefined) return String(arg);
  if (typeof arg !== 'object') return String(arg);

  if (seen.has(arg)) {
    return '[Circular]';
  }
  seen.add(arg);

  if (arg instanceof Error) {
    const stack =
      typeof arg.stack === 'string' ? arg.stack : `${arg.name}: ${arg.message}`;
    const loggerCallSite = formatLoggerCallSiteStack();
    const cause = (arg as any).cause;
    if (cause === undefined) {
      return loggerCallSite
        ? `${stack}\n${loggerCallSite}\n${JSON.stringify(arg)}`
        : `${stack}\n${JSON.stringify(arg)}`;
    }
    const causeText = `${stack}\nCaused by: ${formatErroRecurse(cause, seen)}`;
    return loggerCallSite ? `${causeText}\n${loggerCallSite}` : causeText;
  }

  if (Array.isArray(arg)) {
    return `[${arg.map((item) => formatErroRecurse(item, seen)).join(', ')}]`;
  }

  return `\n` + JSON.stringify(arg, null, 2);
}

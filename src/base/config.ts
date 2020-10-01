import { CookieJar, Cookies } from '../authentication/cookies';

// TODO: move this to a .d.ts file.

export enum ReadyState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSED = 2,
}

export interface EventSourceInitDict {
  withCredentials?: boolean;
  headers?: Record<string, unknown>;
  proxy?: string;
  https?: Record<string, unknown>;
  rejectUnauthorized?: boolean;
}

interface Event {
  stopImmediatePropagation(): void;
  stopPropagation(): void;
}

/* eslint-disable */
// @ts-ignore
interface MessageEvent<T = any> extends Event {
  readonly data: T;
}
/* eslint-enable */

interface EventListener {
  (evt: Event): void;
}

export interface EventSource {
  readonly readyState: ReadyState;
  onopen: (evt: MessageEvent) => unknown;
  onmessage: (evt: MessageEvent) => unknown;
  onerror: (evt: MessageEvent) => unknown;
  addEventListener(type: string, listener: EventListener): void;
  close(): void;
}

interface Headers extends Iterable<[string, string]> {
  raw(): Record<string, string[]>;
  forEach(callback: (value: string, name: string) => void): void;
  [Symbol.iterator](): Iterator<[string, string]>;
}

export type HeadersInit = { [key: string]: string };

export type BodyInit = string;

export type RequestRedirect = 'error' | 'follow' | 'manual';

export interface RequestInit {
  body?: BodyInit;
  headers?: HeadersInit;
  method?: string;
  redirect?: RequestRedirect;
}

export interface Response {
  json(): Promise<Record<string, string>>;
  headers: Headers;
  status: number;
  statusText: string;
  url: string;
}

export interface Logger {
  /* eslint-disable */
  debug: (...params: any[]) => void;
  info: (...params: any[]) => void;
  warn: (...params: any[]) => void;
  error: (...params: any[]) => void;
  /* eslint-enable */
}

export interface Config {
  realtimeHealthCheckIntervalMs: number;
  cookieJar: CookieJar;
  deps: {
    eventSource: (
      url: string,
      eventSourceInitDict?: EventSourceInitDict,
    ) => EventSource;
    fetch: (url: string, init: RequestInit) => Promise<Response>;
  };
  loginOverride?: (
    username: string,
    password: string,
    config: Config,
  ) => Promise<Cookies>;
  log: Logger;
}

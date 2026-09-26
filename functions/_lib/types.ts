// Minimal runtime type declarations for Cloudflare D1 / R2 so the project
// type-checks with the app's single tsconfig (no workers-types needed).

export interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  first<T = Record<string, unknown>>(column?: string): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<unknown>;
}

export interface D1Database {
  prepare(sql: string): D1Statement;
  batch(statements: D1Statement[]): Promise<{ results: unknown[] }>;
}

export interface R2ObjectBody {
  body: ReadableStream;
  httpMetadata?: { contentType?: string };
}

export interface R2Bucket {
  get(key: string): Promise<R2ObjectBody | null>;
  put(
    key: string,
    value: ArrayBuffer | string,
    options?: { httpMetadata?: { contentType?: string } }
  ): Promise<unknown>;
}

export interface Env {
  DB: D1Database;
  MEDIA: R2Bucket;
  /** Comma-separated admin emails. Default: info.opuszim@gmail.com */
  ALLOWED_ADMINS?: string;
  /** When set together with CF_ACCESS_AUD, strict JWT verification is enforced. */
  CF_ACCESS_TEAM_DOMAIN?: string;
  CF_ACCESS_AUD?: string;
}

export interface PagesContext {
  request: Request;
  env: Env;
  params: Record<string, string | string[]>;
  data: unknown;
}

export type PagesHandler = (context: PagesContext) => Response | Promise<Response>;

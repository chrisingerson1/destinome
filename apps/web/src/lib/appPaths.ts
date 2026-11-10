// Vite supplies the configured deployment base; native Node tests use the local default.
export const APP_BASE_PATH = import.meta.env?.BASE_URL ?? "/";

export function apiPath(path: string, basePath = APP_BASE_PATH): string {
  return `${basePath}api/${path}`;
}

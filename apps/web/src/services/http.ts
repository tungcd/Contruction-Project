import type { ApiResponse } from "@acc/shared-types";

/**
 * Gọi Route Handler của chính app này (same-origin) và bóc lớp
 * { success, data, message }. Không cần base URL, không cần CORS.
 */
export async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  const body = (await res.json().catch(() => null)) as ApiResponse<T> | null;
  if (!res.ok || !body || !body.success) {
    throw new Error(body?.message || `Lỗi API (${res.status})`);
  }
  return body.data as T;
}

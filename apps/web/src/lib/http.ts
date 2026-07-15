import { NextResponse } from "next/server";
import { ZodError } from "zod";
import type { ApiResponse } from "@acc/shared-types";

/**
 * Chuẩn hoá response { success, data, message } cho mọi Route Handler
 * (04-Tech-Stack mục 5).
 */

export function ok<T>(data: T, message = ""): NextResponse {
  return NextResponse.json<ApiResponse<T>>({ success: true, data, message });
}

export function fail(message: string, status = 400): NextResponse {
  return NextResponse.json<ApiResponse<null>>(
    { success: false, data: null, message },
    { status },
  );
}

/** Lỗi nghiệp vụ có status code riêng. */
export class HttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export const notFound = (message = "Không tìm thấy dự án") =>
  new HttpError(message, 404);

/**
 * Bọc handler để mọi lỗi trả về đúng format thay vì stack trace.
 */
export async function handle(
  fn: () => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof HttpError) return fail(err.message, err.status);
    if (err instanceof ZodError) {
      const msg = err.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join("; ");
      return fail(msg || "Dữ liệu không hợp lệ", 400);
    }
    console.error("[API]", err);
    return fail("Đã có lỗi xảy ra. Vui lòng thử lại.", 500);
  }
}

/** Kiểm tra id trên URL có phải UUID hợp lệ. */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-9a-f][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function assertUuid(id: string): string {
  if (!UUID_RE.test(id)) throw new HttpError("ID dự án không hợp lệ", 400);
  return id;
}

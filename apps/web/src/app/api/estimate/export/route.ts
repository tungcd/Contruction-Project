import type { NextRequest } from "next/server";
import { z, ZodError } from "zod";
import { HttpError } from "@/lib/http";
import { buildEstimateWorkbook } from "@/lib/estimate/excelExport";
import type { EstimateDraft } from "@/lib/estimate/types";

export const dynamic = "force-dynamic";

/**
 * Milestone Estimate MVP — Feature 6: Export Excel v1. Xuất trực tiếp bản
 * Draft đang có ở client (giống dữ liệu gửi cho "Lưu") — không bắt buộc
 * phải lưu DB trước mới xuất được, đúng tinh thần "Demo trước" của Milestone.
 *
 * Không dùng `handle()`/`ok()` như các route khác vì response thành công là
 * file nhị phân (xlsx), không phải JSON `{ success, data, message }`.
 */
const ExportRequestSchema = z.object({
  draft: z.record(z.string(), z.unknown()),
  projectName: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = ExportRequestSchema.parse(await req.json());
    const buffer = await buildEstimateWorkbook(
      body.draft as unknown as EstimateDraft,
      body.projectName ?? "Du an",
    );
    return new Response(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="du-toan.xlsx"',
      },
    });
  } catch (err) {
    if (err instanceof HttpError) {
      return Response.json(
        { success: false, data: null, message: err.message },
        { status: err.status },
      );
    }
    if (err instanceof ZodError) {
      return Response.json(
        { success: false, data: null, message: "Dữ liệu không hợp lệ" },
        { status: 400 },
      );
    }
    console.error("[API] estimate/export", err);
    return Response.json(
      { success: false, data: null, message: "Đã có lỗi xảy ra. Vui lòng thử lại." },
      { status: 500 },
    );
  }
}

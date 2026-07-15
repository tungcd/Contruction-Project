import { handle, ok } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * Cho UI biết đang chạy provider nào, để hiển thị cảnh báo khi ở chế độ mock.
 * KHÔNG trả API key hay bất kỳ thông tin nhạy cảm nào.
 */
export async function GET() {
  return handle(async () => {
    const provider = (process.env.AI_PROVIDER ?? "mock").toLowerCase();
    return ok({ provider, isMock: provider !== "openai" });
  });
}

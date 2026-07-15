import type { AIProvider } from "./AIProvider";
import { MockProvider } from "./MockProvider";
import { OpenAIProvider } from "./OpenAIProvider";

export * from "./AIProvider";

let cached: AIProvider | null = null;

/**
 * Chọn provider theo biến môi trường AI_PROVIDER.
 * - mock   -> chạy offline, không tốn tiền (mặc định).
 * - openai -> gọi thật, cần OPENAI_API_KEY.
 *
 * Chỉ gọi từ phía server (Route Handler).
 */
export function getAIProvider(): AIProvider {
  if (cached) return cached;

  const kind = (process.env.AI_PROVIDER ?? "mock").toLowerCase();

  if (kind === "openai") {
    const apiKey = process.env.OPENAI_API_KEY;
    // Tránh tình huống chạy openai với key placeholder rồi lỗi khó hiểu.
    if (!apiKey || apiKey.startsWith("sk-...") || apiKey.length < 20) {
      throw new Error(
        "AI_PROVIDER=openai nhưng OPENAI_API_KEY chưa hợp lệ. " +
          "Điền key thật vào .env hoặc đổi AI_PROVIDER=mock.",
      );
    }
    cached = new OpenAIProvider(
      apiKey,
      process.env.OPENAI_MODEL ?? "gpt-5-mini",
    );
    return cached;
  }

  cached = new MockProvider();
  return cached;
}

/** Dùng trong test / khi đổi env lúc chạy. */
export function resetAIProvider(): void {
  cached = null;
}

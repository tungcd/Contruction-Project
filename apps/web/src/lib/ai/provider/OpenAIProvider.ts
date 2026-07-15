import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import {
  AIInvalidOutputError,
  type AIProvider,
  type AnalyzeInput,
  type GenerateBriefInput,
} from "./AIProvider";
import type { ExtractResult } from "../schemas/extractor";
import { ExtractResultSchema } from "../schemas/extractor";
import { OpenAIExtractSchema } from "../schemas/openai-extract";
import { normalizeRequirement, sanitizeText } from "../parsers/normalize";
import {
  EXTRACT_SYSTEM_PROMPT,
  buildExtractUserPrompt,
} from "../prompts/extract-requirement";
import {
  BRIEF_SYSTEM_PROMPT,
  buildBriefUserPrompt,
} from "../prompts/generate-brief";

/**
 * Provider gọi OpenAI Responses API + Structured Output.
 * CHỈ chạy phía server — không bao giờ import từ React component.
 */
export class OpenAIProvider implements AIProvider {
  readonly name = "openai";
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(apiKey: string, model: string) {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async analyzeRequirement(input: AnalyzeInput): Promise<ExtractResult> {
    const userPrompt = buildExtractUserPrompt(input);

    // JSON lỗi -> retry 1 lần, vẫn lỗi thì báo người dùng (05 mục 5 & 11).
    const parsed = await withRetry(
      () => this.callExtract(userPrompt),
      1,
    );

    // Mọi chuỗi từ AI đều phải sanitize: chúng sẽ được ghi vào cột text của
    // Postgres, mà ký tự NULL làm cả query nổ (22P05).
    return ExtractResultSchema.parse({
      // Model hay trả 0 / "chưa rõ" thay cho null -> dọn trước khi validate.
      requirement: normalizeRequirement(parsed.requirement),
      questions: parsed.questions.slice(0, 3).map(sanitizeText),
      assumptions: parsed.assumptions.map(sanitizeText),
      summary: sanitizeText(parsed.summary),
      confidence: parsed.confidence,
    });
  }

  private async callExtract(userPrompt: string) {
    const res = await this.client.responses.parse({
      model: this.model,
      input: [
        { role: "system", content: EXTRACT_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      // gpt-5-mini là model reasoning: mặc định nó "nghĩ" rất lâu (đo được
      // 3008 reasoning tokens -> 58s, có lần 180s). Trích xuất thông tin từ
      // một đoạn chat không cần suy luận sâu, nên hạ effort để demo mượt.
      reasoning: { effort: "low" },
      text: {
        format: zodTextFormat(OpenAIExtractSchema, "extract_result"),
      },
    });

    const parsed = res.output_parsed;

    // Bật AI_DEBUG=1 khi cần soi model thực sự trả gì (rất hữu ích: chính nó
    // đã lộ ra việc model trả 0 và "flat"/"modern" thay vì null/tiếng Việt).
    if (process.env.AI_DEBUG === "1") {
      console.log("[AI DEBUG] status =", res.status);
      console.log("[AI DEBUG] usage =", JSON.stringify(res.usage));
      console.log("[AI DEBUG] parsed =", JSON.stringify(parsed)?.slice(0, 800));
    }

    if (!parsed) throw new AIInvalidOutputError();
    return parsed;
  }

  async generateBrief(input: GenerateBriefInput): Promise<string> {
    const res = await this.client.responses.create({
      model: this.model,
      input: [
        { role: "system", content: BRIEF_SYSTEM_PROMPT },
        { role: "user", content: buildBriefUserPrompt(input) },
      ],
    });

    const text = res.output_text?.trim();
    if (!text) throw new AIInvalidOutputError("AI không sinh được Brief.");
    return text;
  }
}

async function withRetry<T>(fn: () => Promise<T>, retries: number): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      console.warn(`[AI] Lần gọi ${i + 1} thất bại:`, (err as Error).message);
    }
  }
  throw lastErr instanceof Error
    ? new AIInvalidOutputError(
        "AI trả về dữ liệu chưa hợp lệ sau khi thử lại. Vui lòng nhập ngắn gọn hơn.",
      )
    : new AIInvalidOutputError();
}

import type { NextRequest } from "next/server";
import { ok, handle } from "@/lib/http";
import { buildEstimateDraft } from "@/lib/estimate/engine";
import { EstimateRequestSchema } from "@/lib/estimate/schema";
import { DEFAULT_ESTIMATE_SETTINGS } from "@/lib/estimate/sample-data/settings.sample";
import { DEMO_PRICE_BOOK } from "@/lib/estimate/sample-data/price-book.demo";

/**
 * Ticket M3-003 — Prototype Estimate Engine.
 * Entrypoint công khai của prototype (Founder Decision M3-003 mục 5.1).
 *
 * KHÔNG lưu DB, KHÔNG gọi AI, KHÔNG render UI, KHÔNG xuất Excel — route này
 * chỉ để Founder "paste Requirement" và nhận lại EstimateDraft JSON để
 * review Rule Engine trước khi làm Excel Writer (theo đúng ticket).
 *
 * Body:
 *   { requirement: Requirement, settings?: Partial<EstimateSettings>,
 *     priceBook?: PriceBook }
 * `settings`/`priceBook` bỏ qua thì dùng mẫu mặc định (mục đích: Founder
 * chỉ cần paste đúng 1 Requirement là đủ, đúng tinh thần DoD của ticket).
 */
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return handle(async () => {
    const body = EstimateRequestSchema.parse(await req.json());

    const settings = { ...DEFAULT_ESTIMATE_SETTINGS, ...body.settings };
    const priceBook = body.priceBook ?? DEMO_PRICE_BOOK;

    const draft = buildEstimateDraft(body.requirement, settings, priceBook);
    return ok(draft);
  });
}

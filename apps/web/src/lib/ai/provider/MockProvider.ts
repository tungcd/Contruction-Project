import type { Requirement } from "@acc/shared-types";
import type {
  AIProvider,
  AnalyzeInput,
  GenerateBriefInput,
} from "./AIProvider";
import type { ExtractResult, PartialRequirement } from "../schemas/extractor";
import {
  ExtractResultSchema,
  PartialRequirementSchema,
} from "../schemas/extractor";
import { mergeRequirement } from "../parsers/merge";
import { buildQuestionsFromMissing } from "../question-templates";

/**
 * Provider chạy offline, KHÔNG gọi OpenAI (AI_PROVIDER=mock).
 *
 * Không phải AI thật: chỉ dò từ khoá tiếng Việt bằng regex. Đủ để UI và
 * demo chạy đầy đủ khi chưa có API key. Độ chính xác thấp hơn OpenAI, đặc
 * biệt với câu phức tạp — dùng để phát triển UI, không dùng cho khách thật.
 */
export class MockProvider implements AIProvider {
  readonly name = "mock";

  async analyzeRequirement(input: AnalyzeInput): Promise<ExtractResult> {
    // Giả lập độ trễ để UI hiện được trạng thái "đang phân tích".
    await delay(600);

    const text = input.message.toLowerCase();
    const requirement = extractFromText(input.message, text);
    const assumptions = buildAssumptions(text, requirement);

    // Mock không tự nghĩ được câu hỏi -> dùng template theo field còn thiếu.
    const merged = mergeRequirement(input.current, requirement);
    const questions = buildQuestionsFromMissing(merged, input.askedQuestions);

    return ExtractResultSchema.parse({
      requirement,
      questions,
      assumptions,
      summary: buildSummary(requirement),
      confidence: 0.5,
    });
  }

  async generateBrief(input: GenerateBriefInput): Promise<string> {
    await delay(400);
    const r = input.requirement;
    const missing =
      input.missingFields.length > 0
        ? input.missingFields.map((m) => `- ${m.label}`).join("\n")
        : "- Không thiếu thông tin bắt buộc.";

    return `# Project Brief: ${input.projectName}

## 1. Tóm tắt dự án
${buildSummary(r) || "Chưa đủ thông tin để tóm tắt."}

## 2. Thông tin khu đất
- Diện tích đất: ${fmt(r.site.landArea, " m²")}
- Diện tích xây dựng mỗi tầng: ${fmt(r.site.constructionArea, " m²")}
- Mặt tiền: ${fmt(r.site.frontage, " m")}
- Đường vào: ${fmt(r.site.roadWidth, " m")}

## 3. Nhu cầu sử dụng
- Số tầng: ${fmt(r.building.floors, " tầng")}
- Phòng ngủ: ${fmt(r.functional.bedrooms)}
- Có người già: ${r.household.elderly === null ? "_Chưa rõ_" : r.household.elderly ? "Có" : "Không"}

## 4. Công năng chính
- Gara / sân ô tô: ${r.functional.garage === null ? "_Chưa rõ_" : r.functional.garage ? "Có" : "Không"}
- Phòng thờ: ${r.functional.worshipRoom === null ? "_Chưa rõ_" : r.functional.worshipRoom ? "Có" : "Không"}

## 5. Phong cách / vật liệu
- Phong cách: ${fmt(r.building.architecturalStyle)}
- Mái: ${fmt(r.building.roofType)}

## 6. Ngân sách / tiến độ
- Ngân sách: ${r.budget.budget ? formatMoney(r.budget.budget) : "_Chưa rõ_"}
- Phạm vi báo giá: ${fmt(scopeText(r.budget.constructionScope))}

## 7. Thông tin còn thiếu
${missing}

## 8. Giả định
- Brief này được dựng ở chế độ mock (chưa dùng AI thật).

## 9. Bước tiếp theo
- Bổ sung các thông tin còn thiếu ở mục 7.
- Chuyển brief cho KTS / QS để triển khai.
`;
  }
}

// --- Dò từ khoá tiếng Việt ---

function extractFromText(raw: string, text: string): PartialRequirement {
  const out: Record<string, unknown> = {};

  const num = (re: RegExp): number | undefined => {
    const m = text.match(re);
    if (!m || !m[1]) return undefined;
    const v = Number(m[1].replace(",", "."));
    return Number.isFinite(v) ? v : undefined;
  };

  /**
   * Cộng TỔNG mọi lần xuất hiện, không lấy lần đầu.
   * Khách hay mô tả theo tầng: "tầng 1 có 1 phòng ngủ... tầng 2 thêm 2 phòng"
   * -> phải ra 3, không phải 1.
   */
  const sumAll = (re: RegExp): number | undefined => {
    const rx = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
    let total = 0;
    let found = false;
    for (const m of text.matchAll(rx)) {
      const raw = m[1];
      if (!raw) continue;
      const v = Number(raw.replace(",", "."));
      if (!Number.isFinite(v)) continue;
      total += v;
      found = true;
    }
    return found ? total : undefined;
  };

  // --- project ---
  const project: Record<string, unknown> = {};
  if (/cải tạo|sửa nhà|sửa lại/.test(text)) project.projectType = "renovation";
  else if (/nội thất/.test(text) && !/xây/.test(text))
    project.projectType = "interior";
  else if (/xây/.test(text)) project.projectType = "new_build";

  if (/nhà phố|nhà ống/.test(text)) project.buildingType = "townhouse";
  else if (/biệt thự/.test(text)) project.buildingType = "villa";
  else if (/chung cư|căn hộ/.test(text)) project.buildingType = "apartment";

  const loc = raw.match(
    /(?:ở|tại)\s+([\p{Lu}][\p{L}]*(?:\s+[\p{Lu}][\p{L}]*)*)/u,
  );
  if (loc?.[1]) project.location = loc[1].trim();
  if (Object.keys(project).length) out.project = project;

  // --- site ---
  const site: Record<string, unknown> = {};
  // "đất 90m2" / "90m2 đất" / "tổng khoảng 90m2" / "diện tích 90m2"
  const landArea =
    num(/đất\s*(?:khoảng\s*)?(\d+(?:[.,]\d+)?)\s*m2/) ??
    num(/(\d+(?:[.,]\d+)?)\s*m2\s*đất/) ??
    num(/(?:tổng|diện tích|dt)\s*(?:khoảng\s*)?(\d+(?:[.,]\d+)?)\s*m2/);
  if (landArea) site.landArea = landArea;

  // "đất 5x18m" -> mặt tiền 5, chiều sâu 18
  const dim = text.match(/(\d+(?:[.,]\d+)?)\s*x\s*(\d+(?:[.,]\d+)?)\s*m(?!2)/);
  if (dim?.[1] && dim[2]) {
    site.frontage = Number(dim[1].replace(",", "."));
    site.depth = Number(dim[2].replace(",", "."));
  }

  const consArea = num(
    /(?:xây\s*(?:dựng)?\s*)?(?:khoảng\s*)?(\d+(?:[.,]\d+)?)\s*m2\s*(?:\/|mỗi|một|1)\s*tầng/,
  );
  if (consArea) site.constructionArea = consArea;

  const frontage = num(/mặt tiền\s*(?:rộng\s*)?(\d+(?:[.,]\d+)?)\s*m(?!2)/);
  if (frontage) site.frontage = frontage;

  const depth = num(/(?:chiều sâu|sâu)\s*(\d+(?:[.,]\d+)?)\s*m(?!2)/);
  if (depth) site.depth = depth;

  const road = num(
    /đường\s*(?:vào|trước nhà)?[^.,]{0,20}?(\d+(?:[.,]\d+)?)\s*m(?!2)/,
  );
  if (road) site.roadWidth = road;
  if (Object.keys(site).length) out.site = site;

  // --- building ---
  const building: Record<string, unknown> = {};
  const floors = num(/(\d+)\s*tầng/);
  if (floors) building.floors = floors;

  const roof = text.match(/mái\s+(nhật|thái|bằng|ngói|tôn|lệch)/);
  if (roof?.[1]) building.roofType = `Mái ${capitalize(roof[1])}`;

  const style = text.match(
    /(hiện đại|tân cổ điển|cổ điển|tối giản|nhiệt đới|indochine)/,
  );
  if (style?.[1]) building.architecturalStyle = capitalize(style[1]);
  if (Object.keys(building).length) out.building = building;

  // --- household ---
  const household: Record<string, unknown> = {};
  if (/mẹ|bố|cha|ông bà|người già|cụ/.test(text)) household.elderly = true;
  const cars = num(/(\d+)\s*(?:ô tô|oto|xe hơi)/);
  if (cars) household.cars = cars;
  if (Object.keys(household).length) out.household = household;

  // --- functional ---
  const functional: Record<string, unknown> = {};

  // Cộng tổng số phòng ngủ trên toàn bộ mô tả, kể cả khi tách theo tầng.
  //
  // Khoảng trắng phải nằm TRONG lookahead. Nếu viết `phòng\s*(?!tắm)` thì \s*
  // backtrack về 0 ký tự, lookahead xét ở vị trí dấu cách nên luôn pass và
  // "2 phòng tắm" vẫn bị đếm thành phòng ngủ.
  const NOT_BEDROOM = /(?!\s*(?:khách|thờ|tắm|bếp|ăn|làm\s*việc|giặt|kho|vệ\s*sinh|wc))/
    .source;
  let bedrooms = sumAll(new RegExp(`(\\d+)\\s*phòng${NOT_BEDROOM}`)) ?? 0;

  // "phòng ngủ master" thường không kèm số -> tính là 1.
  // Lookbehind loại trường hợp đã có số ("1 phòng master" đã được sumAll đếm),
  // nếu không sẽ cộng hai lần.
  const masterCount = [
    ...text.matchAll(/(?<!\d\s*)phòng\s*(?:ngủ\s*)?master/g),
  ].length;
  bedrooms += masterCount;
  if (bedrooms > 0) functional.bedrooms = bedrooms;

  const baths = sumAll(/(\d+)\s*(?:wc|nhà vệ sinh|toilet|phòng tắm)/);
  if (baths) functional.bathrooms = baths;

  // Phủ định phải xét TRƯỚC: "không cần gara" nghĩa là KHÔNG có gara.
  if (/không\s*(?:cần|có|làm)\s*(?:gara|garage)/.test(text)) {
    functional.garage = false;
  } else if (/ô tô|oto|xe hơi|gara|garage/.test(text)) {
    functional.garage = true;
  }

  if (/không\s*(?:cần|có|làm)\s*(?:phòng\s*)?thờ/.test(text))
    functional.worshipRoom = false;
  else if (/phòng thờ|bàn thờ|chỗ thờ|nơi thờ/.test(text))
    functional.worshipRoom = true;

  if (/sân vườn|cây xanh|có sân/.test(text)) functional.garden = true;
  if (/ban công/.test(text)) functional.balcony = true;
  // "kho" đứng riêng, KHÔNG khớp "khoảng"/"khoá".
  // Không dùng \bkho\b vì \b của JS chỉ hiểu ASCII: chữ "ả" không phải word
  // char nên \b khớp ngay sau "kho" trong "khoảng".
  if (/(?<!\p{L})kho(?!\p{L})/u.test(text)) functional.storage = true;

  if (Object.keys(functional).length) out.functional = functional;

  // --- budget ---
  const budget: Record<string, unknown> = {};
  // Dải "2,5 đến 3 tỷ" -> lấy trung bình, không vơ số lớn nhất.
  const range = text.match(
    /(\d+(?:[.,]\d+)?)\s*(?:đến|tới|-|~)\s*(\d+(?:[.,]\d+)?)\s*(tỷ|tỉ|triệu)/,
  );
  if (range?.[1] && range[2] && range[3]) {
    const lo = Number(range[1].replace(",", "."));
    const hi = Number(range[2].replace(",", "."));
    if (Number.isFinite(lo) && Number.isFinite(hi)) {
      const unit = range[3] === "triệu" ? 1_000_000 : 1_000_000_000;
      budget.budget = ((lo + hi) / 2) * unit;
    }
  } else {
    const money = text.match(/(\d+(?:[.,]\d+)?)\s*(tỷ|tỉ|triệu)/);
    if (money?.[1] && money[2]) {
      const v = Number(money[1].replace(",", "."));
      if (Number.isFinite(v)) {
        budget.budget = money[2] === "triệu" ? v * 1_000_000 : v * 1_000_000_000;
      }
    }
  }
  if (/trọn gói/.test(text)) budget.constructionScope = "turnkey";
  else if (/phần thô|xây thô/.test(text)) budget.constructionScope = "rough";
  else if (/cả nội thất|gồm nội thất/.test(text))
    budget.constructionScope = "interior";
  if (Object.keys(budget).length) out.budget = budget;

  // Parse để vừa validate vừa có kiểu đúng — mock cũng không được phép
  // đẩy dữ liệu rác vào business logic.
  return PartialRequirementSchema.parse(out);
}

function buildAssumptions(
  text: string,
  r: PartialRequirement,
): string[] {
  const out: string[] = [];
  if (r.project?.projectType === "new_build" && !r.project?.buildingType) {
    out.push("Đây là nhà ở dân dụng xây mới, chưa rõ nhà phố hay biệt thự.");
  }
  if (/sân để ô tô|chỗ để ô tô/.test(text)) {
    out.push("Có chỗ để ô tô nhưng chưa rõ là gara kín hay sân lộ thiên.");
  }
  if (r.household?.elderly) {
    out.push("Có người già ở cùng nên có thể cần phòng ngủ ở tầng 1.");
  }
  return out;
}

function buildSummary(r: PartialRequirement): string {
  const parts: string[] = [];
  if (r.project?.projectType === "new_build") parts.push("xây mới");
  if (r.project?.location) parts.push(`ở ${r.project.location}`);
  if (r.site?.landArea) parts.push(`đất ${r.site.landArea}m²`);
  if (r.building?.floors) parts.push(`${r.building.floors} tầng`);
  if (r.functional?.bedrooms) parts.push(`${r.functional.bedrooms} phòng ngủ`);
  if (r.budget?.budget) parts.push(`ngân sách ${formatMoney(r.budget.budget)}`);

  if (parts.length === 0) return "";
  return `Mình đã ghi nhận: ${parts.join(", ")}.`;
}

// --- helpers ---

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function fmt(v: unknown, unit = ""): string {
  return v === null || v === undefined ? "_Chưa rõ_" : `${v}${unit}`;
}

function formatMoney(v: number): string {
  if (v >= 1_000_000_000)
    return `${(v / 1_000_000_000).toFixed(2).replace(/\.?0+$/, "")} tỷ`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(0)} triệu`;
  return `${v.toLocaleString("vi-VN")} đ`;
}

function scopeText(s: Requirement["budget"]["constructionScope"]): string | null {
  if (!s) return null;
  return { rough: "Phần thô", turnkey: "Trọn gói", interior: "Gồm nội thất" }[s];
}

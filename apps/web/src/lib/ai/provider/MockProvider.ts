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
 * Không phải AI thật: chỉ dò từ khoá tiếng Việt bằng regex. Đủ để UI và demo
 * chạy khi chưa có API key. Độ chính xác thấp hơn OpenAI, dùng để phát triển UI.
 * Đồng bộ Data Model v0.2.
 */
export class MockProvider implements AIProvider {
  readonly name = "mock";

  async analyzeRequirement(input: AnalyzeInput): Promise<ExtractResult> {
    await delay(500);

    const text = input.message.toLowerCase();
    const requirement = extractFromText(input.message, text);
    const assumptions = buildAssumptions(text, requirement);

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
    await delay(300);
    const r = input.requirement;
    const missing =
      input.missingFields.length > 0
        ? input.missingFields.map((m) => `- ${m.label}`).join("\n")
        : "- Không thiếu thông tin bắt buộc.";
    return `# Project Brief: ${input.projectName}

## Tóm tắt
${buildSummary(r) || "Chưa đủ thông tin để tóm tắt."}

## Thông tin còn thiếu
${missing}

_(Brief mock — chưa dùng AI thật.)_
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

  /** Cộng TỔNG mọi lần xuất hiện, không lấy lần đầu. */
  const sumAll = (re: RegExp): number | undefined => {
    const rx = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
    let total = 0;
    let found = false;
    for (const m of text.matchAll(rx)) {
      if (!m[1]) continue;
      const v = Number(m[1].replace(",", "."));
      if (!Number.isFinite(v)) continue;
      total += v;
      found = true;
    }
    return found ? total : undefined;
  };

  // --- project ---
  const project: Record<string, unknown> = {};
  if (/cải tạo|sửa nhà|sửa lại/.test(text)) project.projectType = "renovation";
  else if (/nâng tầng|cơi nới/.test(text)) project.projectType = "extension";
  else if (/nội thất/.test(text) && !/xây/.test(text)) project.projectType = "interior";
  else if (/xây/.test(text)) project.projectType = "new_build";

  if (/nhà phố|nhà ống/.test(text)) project.buildingType = "townhouse";
  else if (/biệt thự/.test(text)) project.buildingType = "villa";
  else if (/chung cư|căn hộ/.test(text)) project.buildingType = "apartment";
  else if (/cấp 4|cấp bốn/.test(text)) project.buildingType = "level4";
  else if (/shophouse|nhà phố thương mại/.test(text)) project.buildingType = "shophouse";

  // Địa điểm: "ở A, B" -> district=A, province=B; "ở A" -> province=A.
  const loc2 = raw.match(
    /(?:ở|tại)\s+(\p{Lu}[\p{L}]*(?:\s+\p{Lu}[\p{L}]*)*)\s*,\s*(\p{Lu}[\p{L}]*(?:\s+\p{Lu}[\p{L}]*)*)/u,
  );
  if (loc2?.[1] && loc2[2]) {
    project.district = loc2[1].trim();
    project.province = loc2[2].trim();
  } else {
    const loc1 = raw.match(/(?:ở|tại)\s+(\p{Lu}[\p{L}]*(?:\s+\p{Lu}[\p{L}]*)*)/u);
    if (loc1?.[1]) project.province = loc1[1].trim();
  }
  if (Object.keys(project).length) out.project = project;

  // --- site ---
  const site: Record<string, unknown> = {};
  const landArea =
    num(/đất\s*(?:khoảng\s*)?(\d+(?:[.,]\d+)?)\s*m2/) ??
    num(/(\d+(?:[.,]\d+)?)\s*m2\s*đất/) ??
    num(/(?:tổng|diện tích|dt)\s*(?:khoảng\s*)?(\d+(?:[.,]\d+)?)\s*m2/);
  if (landArea) site.landArea = landArea;

  const dim = text.match(/(\d+(?:[.,]\d+)?)\s*x\s*(\d+(?:[.,]\d+)?)\s*m(?!2)/);
  if (dim?.[1] && dim[2]) {
    site.frontage = Number(dim[1].replace(",", "."));
    site.depth = Number(dim[2].replace(",", "."));
  }

  const footprint = num(
    /(?:xây\s*(?:dựng)?\s*)?(?:khoảng\s*)?(\d+(?:[.,]\d+)?)\s*m2\s*(?:\/|mỗi|một|1)\s*tầng/,
  );
  if (footprint) site.buildingFootprint = footprint;
  const totalFloor = num(/tổng\s*(?:diện tích\s*)?sàn\s*(?:khoảng\s*)?(\d+(?:[.,]\d+)?)\s*m2/);
  if (totalFloor) site.totalFloorArea = totalFloor;

  const frontage = num(/mặt tiền\s*(?:rộng\s*)?(\d+(?:[.,]\d+)?)\s*m(?!2)/);
  if (frontage) site.frontage = frontage;
  const road = num(/đường\s*(?:vào|trước nhà)?[^.,]{0,20}?(\d+(?:[.,]\d+)?)\s*m(?!2)/);
  if (road) site.roadWidth = road;
  if (Object.keys(site).length) out.site = site;

  // --- building ---
  const building: Record<string, unknown> = {};
  const floors = num(/(\d+)\s*tầng(?!\s*hầm)/);
  if (floors) building.floors = floors;

  if (/không\s*(?:có|làm)\s*(?:tầng\s*)?hầm/.test(text)) building.basementLevels = 0;
  else {
    const base = num(/(\d+)\s*tầng\s*hầm/);
    if (base !== undefined) building.basementLevels = base;
    else if (/tầng hầm|có hầm/.test(text)) building.basementLevels = 1;
  }

  const roofMap: [RegExp, string][] = [
    [/mái\s*(?:bằng|bê tông)/, "flat"],
    [/mái\s*nhật/, "japanese"],
    [/mái\s*thái/, "thai"],
    [/mái\s*ngói/, "tile"],
    [/mái\s*tôn/, "metal"],
    [/mái\s*lệch/, "sloped"],
  ];
  const roof = roofMap.find(([re]) => re.test(text));
  if (roof) building.roofType = roof[1];

  const styleMap: [RegExp, string][] = [
    [/hiện đại/, "modern"],
    [/tân cổ điển/, "neoclassical"],
    [/cổ điển/, "classical"],
    [/tối giản/, "minimalist"],
    [/đông dương|indochine/, "indochine"],
    [/nhiệt đới/, "tropical"],
    [/bắc âu|scandinav/, "scandinavian"],
  ];
  const style = styleMap.find(([re]) => re.test(text));
  if (style) building.architecturalStyle = style[1];
  if (Object.keys(building).length) out.building = building;

  // --- household ---
  const household: Record<string, unknown> = {};
  if (/mẹ|bố|cha|ông bà|người già|cụ|bà\b/.test(text)) household.hasElderly = true;
  const cars = num(/(\d+)\s*(?:ô tô|oto|xe hơi)/);
  if (cars) household.cars = cars;
  if (Object.keys(household).length) out.household = household;

  // --- functional ---
  const functional: Record<string, unknown> = {};
  const NOT_BEDROOM =
    /(?!\s*(?:khách|thờ|tắm|bếp|ăn|làm\s*việc|giặt|kho|vệ\s*sinh|wc))/.source;
  let bedrooms = sumAll(new RegExp(`(\\d+)\\s*phòng${NOT_BEDROOM}`)) ?? 0;
  const masterCount = [
    ...text.matchAll(/(?<!\d\s*)phòng\s*(?:ngủ\s*)?master/g),
  ].length;
  bedrooms += masterCount;
  if (bedrooms > 0) functional.bedrooms = bedrooms;

  const baths = sumAll(/(\d+)\s*(?:wc|nhà vệ sinh|toilet|phòng tắm)/);
  if (baths) functional.bathrooms = baths;

  if (/không\s*(?:cần|có|làm)\s*phòng\s*khách/.test(text)) functional.livingRoom = false;
  else if (/phòng khách/.test(text)) functional.livingRoom = true;

  if (/không\s*(?:cần|có|làm)\s*(?:phòng\s*)?bếp/.test(text)) functional.kitchen = false;
  else if (/(?<!\p{L})bếp(?!\p{L})/u.test(text)) functional.kitchen = true;

  if (/không\s*(?:cần|có|làm)\s*(?:gara|garage)/.test(text)) functional.garage = false;
  else if (/ô tô|oto|xe hơi|gara|garage/.test(text)) functional.garage = true;

  if (/không\s*(?:cần|có|làm)\s*(?:phòng\s*)?thờ/.test(text)) functional.worshipRoom = false;
  else if (/phòng thờ|bàn thờ|chỗ thờ|nơi thờ/.test(text)) functional.worshipRoom = true;

  if (/sân vườn|cây xanh|có sân/.test(text)) functional.garden = true;
  if (/ban công/.test(text)) functional.balcony = true;
  if (/(?<!\p{L})kho(?!\p{L})/u.test(text)) functional.storage = true;

  const otherRooms: string[] = [];
  if (/sân phơi/.test(text)) otherRooms.push("Sân phơi");
  if (/phòng làm việc/.test(text)) otherRooms.push("Phòng làm việc");
  if (/phòng gym|phòng tập/.test(text)) otherRooms.push("Phòng tập");
  if (otherRooms.length) functional.otherRooms = otherRooms;
  if (Object.keys(functional).length) out.functional = functional;

  // --- budget ---
  const budget: Record<string, unknown> = {};
  const toDong = (v: number, unit: string) =>
    unit === "triệu" ? v * 1_000_000 : v * 1_000_000_000;
  const range = text.match(
    /(\d+(?:[.,]\d+)?)\s*(?:đến|tới|-|~)\s*(\d+(?:[.,]\d+)?)\s*(tỷ|tỉ|triệu)/,
  );
  const over = text.match(/(?:hơn|trên|từ)\s*(\d+(?:[.,]\d+)?)\s*(tỷ|tỉ|triệu)/);
  const under = text.match(/(?:dưới|tối đa|không quá)\s*(\d+(?:[.,]\d+)?)\s*(tỷ|tỉ|triệu)/);
  const single = text.match(/(?:khoảng\s*)?(\d+(?:[.,]\d+)?)\s*(tỷ|tỉ|triệu)/);
  if (range?.[1] && range[2] && range[3]) {
    budget.budgetMin = toDong(Number(range[1].replace(",", ".")), range[3]);
    budget.budgetMax = toDong(Number(range[2].replace(",", ".")), range[3]);
    budget.budgetNote = range[0];
  } else if (over?.[1] && over[2]) {
    budget.budgetMin = toDong(Number(over[1].replace(",", ".")), over[2]);
    budget.budgetNote = over[0];
  } else if (under?.[1] && under[2]) {
    budget.budgetMax = toDong(Number(under[1].replace(",", ".")), under[2]);
    budget.budgetNote = under[0];
  } else if (single?.[1] && single[2]) {
    const v = toDong(Number(single[1].replace(",", ".")), single[2]);
    budget.budgetMin = v;
    budget.budgetMax = v;
    budget.budgetNote = single[0];
  }

  if (/cả nội thất|gồm nội thất|kèm nội thất/.test(text) && /trọn gói/.test(text))
    budget.constructionScope = "turnkey_with_interior";
  else if (/trọn gói|chìa khoá|chìa khóa/.test(text)) budget.constructionScope = "turnkey";
  else if (/phần thô|xây thô/.test(text)) budget.constructionScope = "rough_and_finishing_labor";
  else if (/khoán công|chỉ nhân công|chỉ công/.test(text)) budget.constructionScope = "labor_only";
  if (Object.keys(budget).length) out.budget = budget;

  return PartialRequirementSchema.parse(out);
}

function buildAssumptions(text: string, r: PartialRequirement): string[] {
  const out: string[] = [];
  if (r.project?.projectType === "new_build" && !r.project?.buildingType)
    out.push("Đây là nhà ở dân dụng xây mới, chưa rõ loại nhà cụ thể.");
  if (/sân để ô tô|chỗ để ô tô|để ngoài sân/.test(text))
    out.push("Ô tô để ngoài sân/ngoài đường, có thể không cần gara kín.");
  if (r.household?.hasElderly)
    out.push("Có người già ở cùng nên có thể cần phòng ngủ ở tầng 1.");
  return out;
}

function buildSummary(r: PartialRequirement): string {
  const parts: string[] = [];
  if (r.project?.projectType === "new_build") parts.push("xây mới");
  if (r.project?.province) parts.push(`ở ${r.project.province}`);
  if (r.site?.landArea) parts.push(`đất ${r.site.landArea}m²`);
  if (r.building?.floors) parts.push(`${r.building.floors} tầng`);
  if (r.functional?.bedrooms) parts.push(`${r.functional.bedrooms} phòng ngủ`);
  if (r.budget?.budgetMin || r.budget?.budgetMax)
    parts.push(`ngân sách ${formatBudget(r.budget.budgetMin, r.budget.budgetMax)}`);
  if (parts.length === 0) return "";
  return `Mình đã ghi nhận: ${parts.join(", ")}.`;
}

// --- helpers ---

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function formatBudget(min?: number | null, max?: number | null): string {
  const f = (v: number) =>
    v >= 1_000_000_000
      ? `${(v / 1_000_000_000).toFixed(2).replace(/\.?0+$/, "")} tỷ`
      : `${(v / 1_000_000).toFixed(0)} triệu`;
  if (min && max && min !== max) return `${f(min)} - ${f(max)}`;
  if (min) return f(min);
  if (max) return f(max);
  return "";
}

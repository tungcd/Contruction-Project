/**
 * Chuẩn hoá dữ liệu thô của AI TRƯỚC khi validate (05-Prompt-and-AI-Contract mục 5).
 *
 * Lý do tồn tại: model hay dùng 0 hoặc chuỗi rỗng để nói "không biết", trong
 * khi contract quy ước "không biết" = null. Nếu không xử lý, Zod chặn
 * (landArea phải > 0) và cả tin nhắn bị bỏ đi dù AI đọc đúng phần còn lại.
 *
 * KHÔNG còn bảng dịch Anh->Việt: từ v0.2, roofType/architecturalStyle là enum
 * được Structured Output enforce, giá trị lạ đã đi vào "other" + *Note (điều kiện 6).
 * UI dịch enum -> nhãn tiếng Việt ở tầng hiển thị.
 */

/** Field bắt buộc > 0: 0 chắc chắn là "không biết", không phải giá trị thật. */
const POSITIVE_FIELDS: Record<string, string[]> = {
  site: ["landArea", "buildingFootprint", "totalFloorArea", "frontage", "depth", "roadWidth"],
  building: ["floors"],
  budget: ["budgetMin", "budgetMax"],
};

/** Field mà 0 là vô nghĩa -> coi như chưa biết. */
const ZERO_IS_UNKNOWN: Record<string, string[]> = {
  functional: ["bedrooms", "bathrooms"],
  household: ["adults"],
};
// KHÔNG đưa basementLevels vào đây: 0 tầng hầm là giá trị hợp lệ (điều kiện 1).
// household.cars / household.children giữ 0 vì "không có" là thông tin thật.

const CODE_TAB = 0x09;
const CODE_LF = 0x0a;
const CODE_CR = 0x0d;
const CODE_SPACE = 0x20;
const CODE_DEL = 0x7f;

/**
 * Loại ký tự điều khiển khỏi chuỗi của AI.
 *
 * PostgreSQL KHÔNG lưu được ký tự NULL trong text/json: nó ném lỗi 22P05
 * "unsupported Unicode escape sequence", request trả 500 và mất luôn tin nhắn
 * của khách. Đã gặp thật khi chạy regression với gpt-5-mini.
 *
 * Dùng vòng lặp theo mã ký tự thay vì regex, để không phải nhúng ký tự điều
 * khiển thật vào file nguồn. Giữ tab, xuống dòng, carriage return.
 */
export function sanitizeText(s: string): string {
  let out = "";
  for (const ch of s) {
    const code = ch.codePointAt(0);
    if (code === undefined) continue;
    const isControl =
      (code < CODE_SPACE &&
        code !== CODE_TAB &&
        code !== CODE_LF &&
        code !== CODE_CR) ||
      code === CODE_DEL;
    if (!isControl) out += ch;
  }
  return out;
}

export function normalizeRequirement(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const src = raw as Record<string, unknown>;
  const out: Record<string, unknown> = {};

  for (const [group, value] of Object.entries(src)) {
    if (value === null || value === undefined) continue;

    if (typeof value === "string") {
      const trimmed = sanitizeText(value).trim();
      if (trimmed) out[group] = trimmed;
      continue;
    }
    if (Array.isArray(value)) {
      const cleaned = value
        .filter((v): v is string => typeof v === "string")
        .map((v) => sanitizeText(v).trim())
        .filter((v) => v.length > 0);
      if (cleaned.length > 0) out[group] = cleaned;
      continue;
    }
    if (typeof value !== "object") {
      out[group] = value;
      continue;
    }

    const fields = value as Record<string, unknown>;
    const cleaned: Record<string, unknown> = {};

    for (const [field, v] of Object.entries(fields)) {
      if (v === null || v === undefined) continue;

      if (Array.isArray(v)) {
        const arr = v
          .filter((x): x is string => typeof x === "string")
          .map((x) => sanitizeText(x).trim())
          .filter((x) => x.length > 0);
        if (arr.length > 0) cleaned[field] = arr;
        continue;
      }

      if (typeof v === "number") {
        if (!Number.isFinite(v)) continue;
        if (POSITIVE_FIELDS[group]?.includes(field) && v <= 0) continue;
        if (ZERO_IS_UNKNOWN[group]?.includes(field) && v <= 0) continue;
        if (v < 0) continue;
        cleaned[field] = v;
        continue;
      }

      if (typeof v === "string") {
        const trimmed = sanitizeText(v).trim();
        // KHÔNG lọc "unknown": đó là giá trị enum hợp lệ của foundationType.
        if (!trimmed || /^(không rõ|chưa rõ|chưa biết|n\/a)$/i.test(trimmed))
          continue;
        cleaned[field] = trimmed;
        continue;
      }

      cleaned[field] = v;
    }

    if (Object.keys(cleaned).length > 0) out[group] = cleaned;
  }

  return out;
}

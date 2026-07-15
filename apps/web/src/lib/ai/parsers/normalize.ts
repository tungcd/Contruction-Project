/**
 * Chuẩn hoá dữ liệu thô của AI TRƯỚC khi validate (05-Prompt-and-AI-Contract mục 5).
 *
 * Lý do tồn tại: model hay dùng 0 hoặc chuỗi rỗng để nói "không biết", trong
 * khi contract của ta quy ước "không biết" = null. Nếu không xử lý, Zod sẽ
 * chặn (landArea phải > 0) và cả tin nhắn bị bỏ đi dù AI đọc đúng phần còn lại.
 *
 * Không thể bắt model luôn nghe lời prompt -> phải chặn ở code.
 */

/** Field bắt buộc > 0: 0 chắc chắn là "không biết", không phải giá trị thật. */
const POSITIVE_FIELDS: Record<string, string[]> = {
  site: ["landArea", "constructionArea", "frontage", "depth", "roadWidth"],
  building: ["floors"],
  budget: ["budget"],
};

/** Field mà 0 là vô nghĩa với một căn nhà -> coi như chưa biết. */
const ZERO_IS_UNKNOWN: Record<string, string[]> = {
  functional: ["bedrooms", "bathrooms"],
  household: ["adults"],
};
// Lưu ý: household.cars và household.children giữ nguyên 0,
// vì "không có ô tô" / "không có trẻ nhỏ" là thông tin thật.

export function normalizeRequirement(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const src = raw as Record<string, unknown>;
  const out: Record<string, unknown> = {};

  for (const [group, value] of Object.entries(src)) {
    if (value === null || value === undefined) continue;

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) out[group] = trimmed;
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

      if (typeof v === "number") {
        if (!Number.isFinite(v)) continue;
        if (POSITIVE_FIELDS[group]?.includes(field) && v <= 0) continue;
        if (ZERO_IS_UNKNOWN[group]?.includes(field) && v <= 0) continue;
        if (v < 0) continue;
        cleaned[field] = v;
        continue;
      }

      if (typeof v === "string") {
        const trimmed = v.trim();
        // Model đôi khi trả "không rõ"/"chưa biết" thay vì null.
        if (!trimmed || /^(không rõ|chưa rõ|chưa biết|unknown|n\/a)$/i.test(trimmed))
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

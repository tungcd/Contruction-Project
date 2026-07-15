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

/**
 * Model hay trả tiếng Anh cho field tự do dù prompt yêu cầu tiếng Việt
 * (đo được: roofType="flat", architecturalStyle="modern"). UI hiển thị
 * thẳng giá trị này nên phải dịch, không thể tin prompt.
 */
const VI_BY_EN: Record<string, string> = {
  // roofType
  flat: "Mái bằng",
  "flat roof": "Mái bằng",
  japanese: "Mái Nhật",
  "japanese roof": "Mái Nhật",
  thai: "Mái Thái",
  "thai roof": "Mái Thái",
  tile: "Mái ngói",
  tiled: "Mái ngói",
  "tiled roof": "Mái ngói",
  metal: "Mái tôn",
  sloped: "Mái dốc",
  // architecturalStyle
  modern: "Hiện đại",
  contemporary: "Hiện đại",
  classic: "Cổ điển",
  classical: "Cổ điển",
  neoclassical: "Tân cổ điển",
  "neo-classical": "Tân cổ điển",
  minimalist: "Tối giản",
  minimal: "Tối giản",
  tropical: "Nhiệt đới",
  scandinavian: "Bắc Âu",
};

const TRANSLATED_FIELDS: Record<string, string[]> = {
  building: ["roofType", "architecturalStyle"],
};

function translateIfEnglish(group: string, field: string, v: string): string {
  if (!TRANSLATED_FIELDS[group]?.includes(field)) return v;
  return VI_BY_EN[v.toLowerCase().trim()] ?? v;
}

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
 * khiển thật vào file nguồn (rất dễ vỡ khi copy/merge).
 * Giữ lại tab, xuống dòng và carriage return vì hợp lệ trong văn bản.
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
        const trimmed = sanitizeText(v).trim();
        // Model đôi khi trả "không rõ"/"chưa biết" thay vì null.
        if (!trimmed || /^(không rõ|chưa rõ|chưa biết|unknown|n\/a)$/i.test(trimmed))
          continue;
        cleaned[field] = translateIfEnglish(group, field, trimmed);
        continue;
      }

      cleaned[field] = v;
    }

    if (Object.keys(cleaned).length > 0) out[group] = cleaned;
  }

  return out;
}

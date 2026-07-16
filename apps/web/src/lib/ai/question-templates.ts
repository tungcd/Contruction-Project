import type { Requirement } from "@acc/shared-types";
import { computeMissingFields } from "@acc/shared-types";

/**
 * Câu hỏi viết sẵn theo field còn thiếu. Dùng cho MockProvider và làm fallback
 * khi AI không sinh được câu hỏi. Thứ tự trong map = độ ưu tiên.
 */
const QUESTION_BY_FIELD: Record<string, string> = {
  "site.totalFloorArea":
    "Anh/chị dự kiến tổng diện tích sàn xây dựng khoảng bao nhiêu m² ạ?",
  "budget.constructionScope":
    "Anh/chị muốn khoán nhân công, xây phần thô, hay xây trọn gói ạ?",
  "site.roadWidth":
    "Đường trước nhà rộng khoảng bao nhiêu mét, xe tải chở vật liệu vào được không ạ?",
  "building.floors": "Nhà mình dự kiến xây mấy tầng ạ?",
  "functional.bedrooms": "Gia đình cần bao nhiêu phòng ngủ ạ?",
  "budget.budget": "Ngân sách dự kiến của anh/chị khoảng bao nhiêu ạ?",
  "site.landArea": "Diện tích khu đất là bao nhiêu m² ạ?",
  "site.frontage": "Mặt tiền khu đất rộng khoảng bao nhiêu mét ạ?",
  "project.province": "Công trình nằm ở tỉnh/thành nào ạ?",
  "project.district": "Cụ thể ở quận/huyện nào ạ?",
  "project.buildingType":
    "Anh/chị muốn xây nhà phố, biệt thự, nhà cấp 4 hay dạng nào ạ?",
  "project.projectType":
    "Đây là xây mới, cải tạo, nâng tầng hay chỉ làm nội thất ạ?",
  "functional.bathrooms": "Nhà mình cần bao nhiêu WC ạ?",
  "building.roofType":
    "Anh/chị thích kiểu mái nào (mái Nhật, mái Thái, mái bằng...) ạ?",
  "building.architecturalStyle":
    "Anh/chị thích phong cách nào (hiện đại, tân cổ điển...) ạ?",
};

const PRIORITY = Object.keys(QUESTION_BY_FIELD);

export const MAX_QUESTIONS = 3;

/** Sinh tối đa 3 câu hỏi cho field còn thiếu, bỏ qua câu đã hỏi. */
export function buildQuestionsFromMissing(
  requirement: Requirement,
  askedQuestions: string[] = [],
): string[] {
  const missingKeys = new Set(
    computeMissingFields(requirement).map((m) => m.key),
  );
  const asked = new Set(askedQuestions);

  return PRIORITY.filter((key) => missingKeys.has(key))
    .map((key) => QUESTION_BY_FIELD[key]!)
    .filter((q) => !asked.has(q))
    .slice(0, MAX_QUESTIONS);
}

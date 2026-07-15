import type { Requirement } from "@acc/shared-types";
import { computeMissingFields } from "@acc/shared-types";

/**
 * Câu hỏi viết sẵn theo từng field còn thiếu.
 * Dùng cho MockProvider và làm fallback khi AI không sinh được câu hỏi.
 *
 * Thứ tự trong map = độ ưu tiên: field ảnh hưởng nhiều nhất tới thiết kế
 * và bóc tách khối lượng đứng trước (05-Prompt-and-AI-Contract mục 8).
 */
const QUESTION_BY_FIELD: Record<string, string> = {
  "site.constructionArea":
    "Anh/chị dự kiến xây khoảng bao nhiêu m² mỗi tầng ạ?",
  "budget.constructionScope":
    "Anh/chị muốn báo giá phần thô, trọn gói hay bao gồm cả nội thất?",
  "site.roadWidth":
    "Đường trước nhà rộng khoảng bao nhiêu mét, xe tải chở vật liệu vào được không ạ?",
  "building.floors": "Nhà mình dự kiến xây mấy tầng ạ?",
  "functional.bedrooms": "Gia đình cần bao nhiêu phòng ngủ ạ?",
  "budget.budget": "Ngân sách dự kiến của anh/chị khoảng bao nhiêu ạ?",
  "site.landArea": "Diện tích khu đất là bao nhiêu m² ạ?",
  "site.frontage": "Mặt tiền khu đất rộng khoảng bao nhiêu mét ạ?",
  "project.location": "Công trình nằm ở khu vực nào ạ?",
  "project.buildingType":
    "Anh/chị muốn xây nhà phố, biệt thự hay dạng công trình nào ạ?",
  "project.projectType":
    "Đây là xây mới, cải tạo hay chỉ làm phần nội thất ạ?",
  "functional.bathrooms": "Nhà mình cần bao nhiêu WC ạ?",
  "building.roofType": "Anh/chị thích kiểu mái nào (mái Nhật, mái Thái, mái bằng...) ạ?",
  "building.architecturalStyle":
    "Anh/chị thích phong cách nào (hiện đại, tân cổ điển...) ạ?",
};

/** Thứ tự ưu tiên hỏi. */
const PRIORITY = Object.keys(QUESTION_BY_FIELD);

export const MAX_QUESTIONS = 3;

/**
 * Sinh tối đa 3 câu hỏi cho các field còn thiếu, bỏ qua câu đã hỏi rồi.
 */
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

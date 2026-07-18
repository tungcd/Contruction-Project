/**
 * Model tier — Founder Decision (2026-07-18). Dùng model nhẹ (`default`)
 * cho phần lớn tác vụ, chỉ chuyển sang model mạnh hơn (`complex`) khi thực
 * sự cần suy luận sâu — tránh tốn tiền/chậm cho việc không cần.
 *
 * `default`: đọc hội thoại khách hàng, extract requirement, structured
 * output, phát hiện field thiếu, sinh câu hỏi bổ sung, tóm tắt, chuẩn hoá
 * dữ liệu, viết proposal thông thường. Cả `analyzeRequirement` và
 * `generateBrief` hiện tại đều dùng `default` — không có tác vụ nào trong
 * app hiện khớp tiêu chí `complex`.
 *
 * `complex`: requirement dài/mâu thuẫn/khó hiểu, review Estimate để phát
 * hiện thiếu hạng mục, so sánh nhiều phương án, tư vấn theo ngân sách, sinh
 * proposal quan trọng gửi khách, hoặc khi user chủ động bấm "Phân tích kỹ"/
 * "Review bằng AI". Các tính năng này CHƯA tồn tại trong app — hằng số này
 * chỉ định nghĩa sẵn tên model, chưa có call site nào dùng tới `complex`.
 *
 * Current recommendation, không phải quyết định cố định — tên model có thể
 * đổi qua .env (`OPENAI_MODEL_DEFAULT`/`OPENAI_MODEL_COMPLEX`) mà không cần
 * sửa code.
 */
export const MODELS = {
  default: "gpt-5.6-luna",
  complex: "gpt-5.6-terra",
} as const;

export type ModelTier = keyof typeof MODELS;

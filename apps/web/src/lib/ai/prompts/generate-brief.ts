import type { GenerateBriefInput } from "../provider/AIProvider";

/**
 * Prompt sinh Project Brief. Brief LUÔN sinh từ Requirement hiện tại,
 * không lấy từ hội thoại (05-Prompt-and-AI-Contract mục 9).
 */

export const BRIEF_SYSTEM_PROMPT = `Bạn là trợ lý của chủ thầu xây dựng dân dụng ở Việt Nam.

NHIỆM VỤ
Viết một bản Project Brief bằng Markdown, để chủ thầu gửi cho Kiến trúc sư / QS hoặc xác nhận lại với khách.

QUY TẮC
1. CHỈ dùng thông tin có trong Requirement. Không bịa thêm số liệu.
2. Thông tin nào chưa có thì ghi vào mục "Thông tin còn thiếu", không tự điền.
3. Văn phong ngắn gọn, chuyên nghiệp, tiếng Việt có dấu.
4. Không thêm lời chào, không thêm giải thích ngoài brief.

CẤU TRÚC BẮT BUỘC
# Project Brief: <tên dự án>
## 1. Tóm tắt dự án
## 2. Thông tin khu đất
## 3. Nhu cầu sử dụng
## 4. Công năng chính
## 5. Phong cách / vật liệu
## 6. Ngân sách / tiến độ
## 7. Thông tin còn thiếu
## 8. Giả định
## 9. Bước tiếp theo`;

export function buildBriefUserPrompt(input: GenerateBriefInput): string {
  const missing =
    input.missingFields.length > 0
      ? input.missingFields.map((m) => `- ${m.label}`).join("\n")
      : "(không thiếu gì)";

  return `TÊN DỰ ÁN: ${input.projectName}

REQUIREMENT (null = chưa biết):
${JSON.stringify(input.requirement, null, 2)}

THÔNG TIN CÒN THIẾU (do hệ thống tính, đưa vào mục 7):
${missing}

Hãy viết Project Brief.`;
}

# 05. Prompt & AI Contract

**Project:** AI Construction Copilot\
**Module:** AI Project Discovery (MVP)\
**Version:** v0.1\
**Status:** Draft

------------------------------------------------------------------------

# 1. Mục tiêu

Tài liệu này định nghĩa cách AI hoạt động trong MVP.

Mục tiêu:

-   Claude Code biết khi nào gọi AI.
-   Backend biết dữ liệu truyền đi và nhận về.
-   Frontend biết cách hiển thị kết quả.
-   Không để AI tự quyết định nghiệp vụ.

------------------------------------------------------------------------

# 2. Nguyên tắc

-   AI chỉ xử lý ngôn ngữ tự nhiên.
-   Business Rule nằm trong code.
-   Output luôn là JSON có schema.
-   Không hiển thị trực tiếp output của LLM khi chưa validate.
-   AI không được ghi dữ liệu trực tiếp vào database.

------------------------------------------------------------------------

# 3. AI Pipeline

``` text
User Message
      ↓
Requirement Extractor
      ↓
Requirement JSON
      ↓
Validator
      ↓
Merge Requirement
      ↓
Missing Detector
      ↓
Question Generator
      ↓
Project Brief Generator (khi đủ điều kiện)
```

------------------------------------------------------------------------

# 4. AI Step 1 - Requirement Extractor

## Input

-   Requirement hiện tại (nếu có)
-   Tin nhắn mới của người dùng

## Nhiệm vụ

-   Trích xuất thông tin.
-   Không suy diễn quá mức.
-   Chỉ tạo dữ liệu có thể xác định.

## Output

``` json
{
  "requirement": {},
  "confidence": 0.92
}
```

------------------------------------------------------------------------

# 5. AI Step 2 - Validator

Kiểm tra:

-   JSON đúng schema.
-   Kiểu dữ liệu hợp lệ.
-   Không có field lạ.

Nếu lỗi:

-   Retry 1 lần.
-   Nếu vẫn lỗi thì trả thông báo cho người dùng.

------------------------------------------------------------------------

# 6. AI Step 3 - Requirement Merge

Input:

-   Requirement hiện tại.
-   Requirement mới.

Output:

Requirement mới sau khi gộp.

Nguyên tắc:

-   Không xóa dữ liệu cũ nếu người dùng không thay đổi.
-   Chỉ ghi đè field được cập nhật.

------------------------------------------------------------------------

# 7. AI Step 4 - Missing Detector

Mục tiêu:

Tìm các trường còn thiếu.

Ví dụ:

-   Diện tích xây dựng.
-   Phạm vi thi công.
-   Đường vào công trình.

Output:

``` json
{
  "missingFields": [
    "constructionArea",
    "constructionScope",
    "roadWidth"
  ]
}
```

------------------------------------------------------------------------

# 8. AI Step 5 - Question Generator

Input:

-   Requirement.
-   Missing Fields.

Rule:

-   Tối đa 3 câu hỏi.
-   Không hỏi lại câu đã hỏi.
-   Ưu tiên thông tin ảnh hưởng thiết kế và bóc tách.

Output:

``` json
{
  "questions": [
    "Dự kiến xây bao nhiêu m² mỗi tầng?",
    "Anh/chị muốn báo giá phần thô hay trọn gói?",
    "Đường trước nhà rộng khoảng bao nhiêu mét?"
  ]
}
```

------------------------------------------------------------------------

# 9. AI Step 6 - Project Brief Generator

Điều kiện:

-   Requirement Score \>= 70%.

Output:

Markdown:

``` text
## Tóm tắt dự án

...
```

Brief luôn sinh từ Requirement hiện tại.

------------------------------------------------------------------------

# 10. API Contract

## Analyze Message

Input

``` json
{
  "projectId": "uuid",
  "message": "..."
}
```

Output

``` json
{
  "requirement": {},
  "missingFields": [],
  "questions": [],
  "briefReady": false
}
```

------------------------------------------------------------------------

# 11. Retry Strategy

-   JSON lỗi → Retry 1 lần.
-   Timeout → Cho phép gửi lại.
-   Lỗi hệ thống → Trả thông báo thân thiện.

------------------------------------------------------------------------

# 12. Logging

Lưu:

-   Prompt ID
-   Response Time
-   Token Usage
-   Model Name
-   Error (nếu có)

Không lưu API Key.

------------------------------------------------------------------------

# 13. Future

Sau MVP có thể bổ sung:

-   OCR
-   Voice
-   Image Understanding
-   Multi-Agent
-   RAG
-   Tool Calling nâng cao

------------------------------------------------------------------------

# Definition of Done

Claude Code có thể:

-   Tích hợp AI.
-   Thiết kế service AI.
-   Xây API phân tích requirement.
-   Validate JSON.
-   Sinh câu hỏi.
-   Sinh Project Brief.

Không cần tự thiết kế lại AI workflow.

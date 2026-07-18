# Feature Documentation

> **Document Info**
> - Mục đích: giải thích tài liệu feature khác tài liệu architecture như
>   thế nào, và cách một feature mới nên được thêm vào `docs/`.
> - Đối tượng đọc chính: ChatGPT, Claude, Founder, người triển khai
>   feature.
> - Trạng thái: Index.
> - Tài liệu liên quan: [../architecture/](../architecture/).

## Feature docs khác Architecture docs như thế nào

- **`architecture/`** trả lời câu hỏi áp dụng **toàn dự án**: nguyên tắc
  ra quyết định nào được dùng, quy ước tài liệu ra sao. Không mô tả một
  tính năng cụ thể.
- **`features/<tên>/`** trả lời câu hỏi cho **một feature/pipeline cụ
  thể**: domain model của nó, boundary dữ liệu, spec triển khai. Mỗi
  feature tự quyết định cấu trúc file con phù hợp với bản chất của nó
  (xem `concept-design/requirement/` vs `concept-design/constraint/` —
  không nhất thiết giống nhau).

Một tài liệu feature **tham chiếu** `architecture/principles.md` khi cần
áp dụng nguyên tắc chung, không copy lại nội dung.

## Danh sách feature hiện có

| Feature | Mô tả | Trạng thái |
|---|---|---|
| [concept-design/](concept-design/) | Pipeline M4 — AI Concept Design (Requirement → ... → Concept Package) | Requirement: chờ ChatGPT soạn Frozen v1.0. Các module khác: chưa bắt đầu. |
| [estimate/](estimate/) | Estimate Engine — Rule Engine, Business Code taxonomy | Đã implement, tài liệu đang bổ sung. |
| [pricebook/](pricebook/) | PriceBook CRUD | Đã implement, tài liệu đang bổ sung. |

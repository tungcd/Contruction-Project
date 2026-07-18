# Requirement Template (Rendering Spec)

> **Document Info**
> - Mục đích: đặc tả cách Requirement.md được render từ Requirement
>   JSON — cho người đọc là con người (Founder, kiến trúc sư, khách
>   hàng).
> - Đối tượng đọc chính: người triển khai renderer, ChatGPT khi cập nhật
>   Template v2.
> - Trạng thái: **Skeleton** — chờ nội dung Template v2 (dựa trên
>   `documents/milestone_1/01_requirement-template-v1.md` +
>   `04_requirement-feature-architecture-response-claude.md` mục 6).
> - Tài liệu liên quan:
>   [requirement-domain-model.md](requirement-domain-model.md) (§4, §5),
>   `documents/milestone_1/01_requirement-template-v1.md` (bản v1 gốc).

<!-- Skeleton — nội dung do ChatGPT soạn (Template v2) -->

## 1. Nguyên tắc render

Requirement.md luôn được sinh từ Requirement JSON, không hand-edit trực
tiếp (xem REQ-D1).

## 2. Cấu trúc section

Danh sách section + nguồn dữ liệu tương ứng trong Requirement JSON.

## 3. Quy tắc hiển thị Unknown / Excluded

"Cần xác nhận thêm" (từ missing fields) / "Không cần" (từ
`excludedRooms` + field `false`) — render tự động, không phải section
tay điền.

## 4. Nhãn trường (Vietnamese field labels)

Bảng field JSON → nhãn tiếng Việt hiển thị trên Requirement.md.

## 5. Change Log

So sánh v1 → v2 (danh sách thay đổi cụ thể).

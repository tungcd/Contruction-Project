# Constraint Set Domain Model

> **Document Info**
> - Mục đích: single source of truth cho domain model của Constraint
>   Set Compiler.
> - Đối tượng đọc chính: người triển khai Constraint Set Compiler,
>   Design Intent Graph Generator (consumer trực tiếp).
> - Trạng thái: **Skeleton** — chưa bắt đầu thiết kế nội dung.
> - Tài liệu liên quan:
>   [../requirement/requirement-domain-model.md](../requirement/requirement-domain-model.md)
>   (input của module này), `architecture/principles.md` (nguyên tắc
>   dùng chung — tham chiếu, không copy).

<!-- Skeleton — chưa có nội dung, chờ ChatGPT thiết kế -->

## 1. Purpose & Scope

Constraint Set là gì — output tất định của một phép biến đổi từ
Requirement, không phải một entity persisted (function thuần, tính lại
khi cần).

## 2. Input Boundary

Chỉ đọc Requirement JSON đã `confirmed` — không đọc Requirement.md,
không đọc Interview/Draft State.

## 3. Output Structure

Các loại constraint (mustInclude/mustNotInclude/exactEnum/
exactDimensions...).

## 4. Ranh giới tất định

Không được diễn giải văn xuôi tự do. Xử lý `otherRooms`/`excludedRooms`
(Open Boundary kế thừa từ Requirement — quyết định giải pháp tại đây).

## 5. Consumer

Design Intent Graph Generator — hợp đồng input/output với module đó.

## 6. Open Boundaries

(Điền khi có quyết định — ít nhất phải xử lý rõ vấn đề free-text room
list kế thừa từ Requirement.)

## 7. Decision Log Index

Bảng trỏ tới `architecture/decisions/CONSTRAINT-D1-...md` khi có.

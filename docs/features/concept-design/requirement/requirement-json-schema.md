# Requirement JSON Schema

> **Document Info**
> - Mục đích: đặc tả field-by-field của Requirement JSON — bản đọc được
>   song song với `packages/shared-types/src/requirement.ts`.
> - Đối tượng đọc chính: người triển khai/sửa schema, AIProvider
>   extraction prompt.
> - Trạng thái: **Skeleton** — chờ nội dung. Khi có, đây là **Reference**
>   (mô tả), code trong `packages/shared-types` mới là Source of Truth
>   thực thi được (type-checked).
> - Tài liệu liên quan:
>   [requirement-domain-model.md](requirement-domain-model.md) (nguyên
>   tắc chi phối các field này).

<!-- Skeleton — nội dung do ChatGPT soạn -->

## 1. Tổng quan

Vị trí file thật (`packages/shared-types/src/requirement.ts`), quan hệ
với tài liệu này (mô tả song song, không phải nguồn build).

## 2. Nhóm dữ liệu (Groups)

- `project`
- `site`
- `building`
- `household`
- `functional`
- `budget`
- `timeline`
- `notes`

## 3. Field Reference

Bảng field → kiểu dữ liệu → ý nghĩa tri-state (nếu có) → ví dụ.

## 4. Enum Reference

`ProjectType`, `BuildingType`, `RoofType`, `ArchitecturalStyle`,
`ConstructionScope`, `FoundationType` — giá trị + ghi chú "other + note"
nếu có.

## 5. Change Log

Lịch sử thay đổi schema (mỗi thay đổi trỏ tới ADR tương ứng nếu có).

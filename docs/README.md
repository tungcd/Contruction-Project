# Documentation

> **Document Info**
> - Mục đích: điểm vào (entry point) và bản đồ Information Architecture của
>   toàn bộ tài liệu kỹ thuật dự án.
> - Đối tượng đọc chính: Founder, ChatGPT (Solution Architect), Claude
>   (Reviewer), và bất kỳ ai clone repository sau này.
> - Trạng thái: **Index** — không phải source of truth cho bất kỳ quyết
>   định nào, chỉ trỏ tới nơi chứa source of truth thật sự.
> - Tài liệu liên quan: tất cả thư mục con bên dưới.

## Nguyên tắc: Docs-as-Code

Toàn bộ tài liệu kỹ thuật của dự án sống trong `docs/`, commit cùng
source code, version cùng Git. Không dùng Notion/Google Docs làm tài
liệu chính thức. Pull Request thay đổi kiến trúc nên kèm cập nhật tài
liệu tương ứng.

Xem chi tiết nguyên tắc tại [architecture/principles.md](architecture/principles.md).

## Cấu trúc

```text
docs/
├── architecture/
│   ├── principles.md      Nguyên tắc kiến trúc + quy ước tài liệu dùng chung
│   ├── draft/              Đề xuất đang thảo luận, CHƯA freeze
│   ├── frozen/              Kiến trúc đã đóng băng — source of truth
│   └── decisions/           ADR — 1 quyết định = 1 file
├── features/
│   ├── concept-design/      Pipeline M4 (Requirement → ... → Concept Package)
│   ├── estimate/            Estimate Engine / Rule Engine
│   └── pricebook/           PriceBook CRUD
├── research/                Tài liệu nghiên cứu domain (không phải source of truth)
└── meeting-notes/           Log thảo luận theo thời gian (lịch sử, không phải kiến trúc)
```

## Information Architecture

| Thư mục | Mục đích | Trạng thái | Ai đọc |
|---|---|---|---|
| `architecture/principles.md` | Nguyên tắc ra quyết định + quy ước tài liệu, dùng chung mọi module | Source of Truth | Mọi người |
| `architecture/draft/` | Đề xuất kiến trúc đang bàn, chưa chốt | Draft (không phải Source of Truth) | ChatGPT, Claude, Founder |
| `architecture/frozen/` | Kiến trúc đã Founder chốt | Source of Truth | Mọi người |
| `architecture/decisions/` | ADR — lý do đằng sau từng quyết định cụ thể | Source of Truth (cho quyết định đó) | Mọi người |
| `features/<name>/` | Domain model + spec của một feature/pipeline cụ thể | Source of Truth khi đã có nội dung (xem trạng thái từng file) | Người triển khai feature đó |
| `research/` | Ghi chép nghiên cứu domain (Space Syntax, benchmark ngành...) | Reference — input cho draft, không tự nó là quyết định | ChatGPT, Claude |
| `meeting-notes/` | Log thảo luận theo ngày, dạng lịch sử | Reference lịch sử — không phải kiến trúc | Mọi người (tra cứu bối cảnh) |

## Quan hệ với `documents/`

Thư mục `documents/CHATGPT_CONTEXT/` và `documents/milestone_1/` đã tồn
tại trước `docs/` và **vẫn giữ nguyên vị trí** — đó là log thảo luận gốc
(quá trình đi tới các quyết định), có giá trị lịch sử nhưng không phải
kiến trúc chính thức. Chỉ khi một chuỗi thảo luận hội tụ thành một tài
liệu **frozen** (như Requirement Domain Model v1.0), tài liệu đó mới
được soạn/đặt trong `docs/architecture/frozen/` hoặc `docs/features/`.
Không di chuyển toàn bộ `documents/` vào `docs/` ngay — đây là quyết
định có thể đảo ngược, di chuyển dần khi cần, không big-bang.

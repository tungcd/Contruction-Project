# Architecture Documentation

> **Document Info**
> - Mục đích: giải thích 4 thư mục con của `architecture/` và quan hệ
>   giữa chúng.
> - Đối tượng đọc chính: ChatGPT, Claude, Founder.
> - Trạng thái: Index.
> - Tài liệu liên quan: [principles.md](principles.md), [draft/](draft/),
>   [frozen/](frozen/), [decisions/](decisions/).

`architecture/` chứa tài liệu áp dụng **toàn dự án** — khác với
`features/`, vốn chứa domain model của một feature/pipeline cụ thể.

| Thư mục/file | Vai trò |
|---|---|
| `principles.md` | Nguyên tắc ra quyết định + quy ước tài liệu dùng chung cho mọi feature. Không lặp lại trong từng tài liệu module — chỉ tham chiếu. |
| `draft/` | Đề xuất kiến trúc đang thảo luận, chưa được Founder chốt. |
| `frozen/` | Kiến trúc đã chốt — source of truth chính thức. |
| `decisions/` | ADR — lý do cụ thể đằng sau từng quyết định, 1 file/quyết định. |

## Vòng đời một quyết định kiến trúc

```text
Ý tưởng → draft/ (thảo luận) → Founder chốt → frozen/ (nội dung)
                                             → decisions/ (ADR — vì sao)
```

Một tài liệu `frozen/` luôn nên có ít nhất một ADR tương ứng trong
`decisions/` giải thích lý do các quyết định chính trong đó — `frozen/`
trả lời "là gì", `decisions/` trả lời "vì sao".

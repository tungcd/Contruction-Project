# Requirement Domain Model v1.0

> **Document Info**
> - Mục đích: single source of truth cho domain model của Requirement
>   feature — nguyên tắc, boundary, canonical flow.
> - Đối tượng đọc chính: người triển khai Requirement JSON Schema,
>   Requirement Template v2, Constraint Set Compiler.
> - Trạng thái: **Skeleton** — chờ ChatGPT soạn nội dung đầy đủ, sau đó
>   chuyển `architecture/frozen/` hoặc giữ tại đây làm bản chính (quyết
>   định vị trí cuối cùng khi nội dung sẵn sàng).
> - Supersedes: —
> - Tài liệu liên quan: `documents/milestone_1/07_...md` (cấu trúc đề
>   xuất gốc), `architecture/principles.md` (nguyên tắc dùng chung —
>   tham chiếu, không copy).

<!--
  Nội dung đầy đủ sẽ do ChatGPT soạn. Đây chỉ là mục lục/heading theo
  cấu trúc đã thống nhất qua chuỗi thảo luận (documents/milestone_1/).
-->

## 0. Metadata

Version, ngày freeze, supersedes, người tham gia, phạm vi tài liệu.

## 1. Purpose & Scope

Requirement là gì / không phải là gì. Những gì tài liệu này KHÔNG quyết
định (Requirement Template v2 rendering chi tiết, Constraint Set
Compiler internals).

## 2. Canonical Data Flow

```text
Conversation → AI Interview → Requirement JSON
    ├→ Requirement.md (generated rendering, không lưu)
    └→ Constraint Set Compiler (deterministic, spec riêng)
```

## 3. Core Entities & Boundaries

Requirement (canonical, persisted) / Interview-Draft State (ephemeral) /
Requirement.md (rendering, không lưu). Bảng ranh giới dữ liệu.

## 4. Data Model Principles

Tri-state `null/true/false` + `otherRooms`/`excludedRooms`. Hai trục
`projectType` × `constructionScope`. Household additive fields. Reference
images. Status lifecycle (`draft/needs_clarification/ready/confirmed` +
`confirmedAt`).

## 5. Design Principles (đặc thù Requirement)

Requirement is not Design. *(Các nguyên tắc project-wide khác — Burden
of Proof Rule, Simplicity before Generality — chỉ tham chiếu
`architecture/principles.md`, không lặp lại ở đây.)*

## 6. Consumer Boundaries (Anti-Corruption Layer)

Estimate Engine vs Concept Design pipeline — Constraint Set Compiler là
nơi hấp thụ khác biệt.

## 7. Snapshot & Audit Strategy

`ConceptSet.requirementSnapshotJson` + `requirementSnapshotMarkdown`.
Không versioning Requirement.

## 8. Open Boundaries

`otherRooms`/`excludedRooms` → deterministic constraint (chưa giải
quyết, thuộc phạm vi Constraint Set Compiler). Per-field
provenance/confidence (hoãn). Phạm vi MVP (nhà phố/biệt thự xây mới).
`confirmedBy` (hoãn, chưa có auth).

## 9. Decision Log Index (ADR references)

Bảng trỏ tới `architecture/decisions/REQ-D1-...md` đến `REQ-D8-...md`.

## 10. Manual POC Priorities (pointer)

Trỏ sang [../README.md](../README.md) — không lặp lại nội dung ở đây.

## 11. Change Log

v1.0 — freeze ban đầu.

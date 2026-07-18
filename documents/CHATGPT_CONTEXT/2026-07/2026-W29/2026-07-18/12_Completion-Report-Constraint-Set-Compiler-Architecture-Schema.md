# Completion Report — Constraint Set Compiler (Architecture + Schema + Code)

**Ngày:** 2026-07-18
**Khung diễn đạt:** current recommendation, có thể chỉnh lại khi Manual POC
cho bằng chứng ngược (Startup Flexibility Principle).

## Done

### Architecture (2 vòng review, đã freeze)

- Responsibility: `Requirement → Constraint Set Compiler → Constraint Set`,
  Pure Function / Deterministic / No AI.
- 6 invariant chốt: Pure Function, Deterministic, No AI, No Information
  Creation, **No Silent Drop** (mới — đối xứng No Information Creation,
  không được âm thầm mất dữ liệu chưa compile được), **Explicit
  Precondition** (mới — fail-fast nếu Requirement chưa `confirmed`,
  không sinh partial output).
- Boundary: normalize/validate/canonicalize/compile. Đọc mọi field
  Requirement tự do nhưng không thực hiện Estimate business logic.
- Descriptor hidden coupling: ghi nhận, defer sang khi Descriptor vào
  Architecture Review riêng (chưa có Constraint Set Schema để bàn cụ
  thể lúc đó).

### Schema (2 vòng review, đã freeze Conceptual Schema)

- Top-level: `metadata, site, building, household, spaces, structure,
  style, budget, unresolved`. Bỏ `rules` (mơ hồ trách nhiệm — rủi ro
  lấn Design Intent Graph hoặc trùng lặp domain group) và `preferences`
  (dư thừa so với field-level type tag).
- Đại diện field: `ConstraintField<T> = { value, constraintType }`,
  `constraintType ∈ {exact, min, max, required, forbidden, preferred}`
  — `value` polymorphic (scalar/enum/array/range), giải quyết đúng nhu
  cầu giữ dải min/max cho budget (Founder Decision cũ, không lấy
  trung bình).
- `unresolved` — type riêng (`UnresolvedEntry`), KHÔNG dùng chung
  `ConstraintField<T>` (nó chưa có constraintType đã phân loại) — đây
  là nơi giải quyết Open Boundary `otherRooms`/`excludedRooms` kế thừa
  từ Requirement.
- `household` được thêm (hasElderly/children/accessibilityNeeds) — nếu
  thiếu, Design Intent Graph phải đọc thẳng Requirement, phá ranh giới
  Anti-Corruption Layer.

### Code

- `packages/shared-types/src/constraint-set.ts` (mới) — implement đúng
  Conceptual Schema trên bằng Zod, tái sử dụng enum có sẵn của
  Requirement (`BuildingType/RoofType/ArchitecturalStyle/
  ConstructionScope/FoundationType`) thay vì khai báo lại.
- Export qua `packages/shared-types/src/index.ts`.
- **Chỉ là schema** — chưa có compiler function, chưa DTO/API/database.

### Process (áp dụng toàn dự án, không riêng module này)

- `docs/architecture/principles.md` — thêm A5 "Move fast. Never violate
  frozen decisions." (Prototype-Driven Refinement/"thiết kế 80%"): fast
  iteration áp dụng cho chi tiết chưa có bằng chứng, không áp dụng cho
  invariant đã freeze.
- Quy ước đặt tên review theo artifact (Architecture/Schema/Prototype/
  Implementation Review + "Round N" chỉ khi >1 vòng) — ghi tại
  `docs/meeting-notes/README.md`.
- Toàn bộ `docs/` Docs-as-Code đã scaffold (architecture/, features/,
  research/, meeting-notes/) — xem `docs/README.md`.

## Files

- Mới: `packages/shared-types/src/constraint-set.ts`, toàn bộ `docs/`
  (skeleton), `docs/meeting-notes/2026-07/2026-W29/2026-07-18/01_`–`08_`
  (log review Constraint Set Compiler).
- Sửa: `packages/shared-types/src/index.ts` (export constraint-set),
  `docs/architecture/principles.md` (A5), `docs/meeting-notes/README.md`
  (quy ước tên), root `README.md` (pointer sang `docs/`).

## Verify

- `npm run typecheck` (shared-types): PASS.
- `npm run build` (shared-types): PASS.
- `tsc --noEmit` (apps/web): PASS — không ảnh hưởng ngược.

## Next

Theo roadmap Founder đã chốt: **Compiler Prototype** — viết fixture JSON
cho đúng phạm vi MVP hiện tại (`simple-house`, `villa`, `townhouse`;
**hoãn** `interior-only`/`renovation` — phạm vi đó đã bị defer từ
Requirement Domain Model, chưa nên test bây giờ), compile thử
Requirement → ConstraintSet để lộ chỗ "gượng ép" trước khi viết compiler
thật, rồi Manual POC lấy evidence.

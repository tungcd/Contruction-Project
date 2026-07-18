# Requirement Feature — Architecture Response (Claude)

**Language note:** Per the convention established in
`claude-context-requirement-feature-v2.md` §4, this response is written in
English (AI-to-AI). Proposed field labels and Decision Log entries are in
Vietnamese as required.

---

## 1. Executive Assessment

The current direction is sound. The resolution of C1 (Requirement JSON as
canonical source, Requirement.md as generated rendering) is correct and
is the right call — it mirrors a pattern already proven in this exact
codebase (Project Brief is already a generated rendering off a canonical
Requirement, not a hand-authored document).

**However, there is one blind spot neither this document nor the v1
template review surfaced, and it is more consequential than any of
questions A–J individually:**

> **This project already has an implemented, frozen, running Requirement
> JSON schema** (`packages/shared-types/src/requirement.ts`, referred to
> in project history as "Data Model v0.2"), with a working extraction
> pipeline (`AIProvider.analyzeRequirement`, both Mock and OpenAI
> implementations), merge logic, missing-field detection, and a
> generated Project Brief consumer. Discovery Chat, Project Brief, and
> Estimate Engine are all built against it today.

Section 5–16 of the context document design the Requirement feature as
if starting from a conceptual pipeline diagram, without referencing this
existing implementation. This needs to be reconciled explicitly before
Template v2 is drafted — see Critical Architecture Decision CAD-1 below.
The good news: reconciliation is cheap, and several of questions C, D,
and part of A are **already answered** by the existing schema and
supporting code, not open design problems. I mark these clearly below so
effort isn't spent redesigning what already works.

---

## 2. Critical Architecture Decisions

### CAD-1 — Reconcile with the existing implemented Requirement schema

- **Issue:** The context document designs "Requirement JSON" as if it
  were a new artifact. A schema with the same name and role already
  exists, is frozen, and is load-bearing for three working features
  (Discovery Chat extraction, Project Brief, Estimate Engine input via
  `functional`/`site`/`building`/`budget` groups).
- **Recommendation:** Treat this Requirement feature work as an
  **extension** of the existing schema, not a parallel v2. Concretely:
  keep `project`/`site`/`building`/`household`/`functional`/`budget`/
  `timeline`/`notes` groups as-is, add the small number of genuinely
  missing fields identified below (CAD-3, CAD-4, §4.G), and do not touch
  fields already frozen.
- **Reason:** The founder is a solo developer (§2 of the context
  document). Running two parallel "Requirement" concepts — one consumed
  by Discovery Chat/Estimate today, another designed fresh for the M4
  Concept Design pipeline — is exactly the kind of hidden migration cost
  the review is explicitly asked to flag (§18: "Identify hidden future
  migration costs explicitly").
- **Risk if ignored:** Two schemas drift independently; whichever one
  the Constraint Set Compiler actually reads becomes the de facto
  standard, and the other becomes dead weight or a source of subtle
  data-loss bugs when synchronizing between them. For a one-person team,
  this is a realistic way to lose weeks.

### CAD-2 — Requirement JSON / Requirement.md split: confirmed, with one addition

- **Issue:** §11 of the context document already proposes: Requirement
  JSON is canonical, Requirement.md is a rendering, Constraint Set
  Compiler reads JSON only. This is correct and should be frozen as-is.
- **Recommendation:** Add one missing piece: a **gate** between
  "Requirement JSON is being edited" and "Requirement JSON is handed to
  the Constraint Set Compiler." Right now nothing marks a Requirement as
  ready to leave the interview loop — see §4.A and §4.J for the concrete
  (minimal) proposal.
- **Reason:** Without an explicit gate, the Constraint Set Compiler could
  run against a Requirement that's still mid-conversation and obviously
  incomplete, wasting a downstream AI call (Design Intent Graph
  generation, the most expensive/highest-risk stage per the frozen M4
  pipeline).
- **Risk if ignored:** Wasted AI spend and confusing partial-concept
  generations, discovered late (during Manual POC or worse, in front of a
  customer).

### CAD-3 — Tri-state model: already solved for fixed fields, needs one small addition for open-ended ones

- **Issue (§16.C):** The context document asks whether
  `required/excluded/unspecified` is sufficient, or whether more states
  (`preferred/optional/undecided/not_applicable`) are needed.
- **Recommendation:** **Do not introduce a new enum.** The existing
  schema's fixed boolean fields (`garage`, `balcony`, `worshipRoom`,
  `storage`, `garden`, `livingRoom`, `kitchen`) already encode exactly
  this tri-state via `null | true | false` — `null` = unspecified,
  `true` = required, `false` = excluded. This is not a gap; it is already
  implemented and already has a carefully-tuned extraction prompt
  enforcing it (`extract-requirement.ts`: "false = khách nói rõ KHÔNG CÓ
  ... null = khách KHÔNG NHẮC TỚI ... KHÔNG BAO GIỜ dùng false hay 0 để
  thay cho null"). What v1 Template review (C4) actually found missing
  was **arbitrary exclusions outside the fixed field list** (e.g.
  customer says "không cần phòng đọc sách" — a room with no dedicated
  boolean field). The existing schema already has `otherRooms: string[]`
  for arbitrary *desired* extra rooms; it has no mirror for arbitrary
  *excluded* ones. Add exactly one field: `excludedRooms: string[]`.
  Do not add `preferred/optional/undecided/not_applicable` — no current
  downstream consumer (Constraint Set Compiler, Estimate Engine) needs
  that granularity, and adding it now is over-engineering ahead of proven
  need.
- **Reason:** Reusing proven, already-prompt-tuned semantics is strictly
  lower risk than designing new ones, and avoids a second migration.
- **Risk if ignored:** Rebuilding a tri-state mechanism that already
  exists wastes effort and risks a subtly different (and less
  battle-tested) semantic than the one already in production prompts.

### CAD-4 — Construction Scope: two axes already exist, don't collapse them into one

- **Issue (§16.F):** The context document lists candidate scope
  categories (thiết kế / xây thô / hoàn thiện / trọn gói / nội thất /
  cải tạo) and explicitly warns they may not be mutually exclusive.
- **Recommendation:** This list actually mixes **two independent axes**
  that already exist separately in the frozen schema:
  - `project.projectType` (new_build / renovation / interior / extension)
    — **what kind of project this is**.
  - `budget.constructionScope` (labor_only / rough_and_finishing_labor /
    turnkey / turnkey_with_interior) — **how much of the work is being
    contracted**, structured as an increasing-scope ladder (each value
    is a superset of the previous one's labor content).
  Keep both axes as-is. Do not build a new composite/multi-select
  category list — the ladder already handles non-mutual-exclusivity
  correctly (turnkey_with_interior already implies turnkey, which
  already implies rough_and_finishing_labor).
- **Reason:** The two-axis model is simpler than a flat category list
  with unclear combination rules, and it's already wired into the
  Estimate Engine (section gating: `sanitary_equipment` section is only
  enabled when `constructionScope = turnkey_with_interior`).
- **Risk if ignored:** A new composite scope model would require
  re-deriving Estimate Engine's section-gating logic and would not
  obviously map back cleanly to the existing enum.

---

## 3. Proposed Requirement Feature Model

Three components, deliberately kept small:

1. **Requirement** (canonical, persisted, single row per project —
   unchanged storage model from today). Extend with: `excludedRooms:
   string[]` (CAD-3), `constructionAccessibilityNeeds` fields (§4.G),
   `referenceImages` (§4.H), `status` (§4.J). No versioning fields.
2. **Interview/Draft State** (ephemeral, NOT part of the persisted
   Requirement) — this already exists in practice: `askedQuestions`
   passed per analyze call, and `analysis-store.ts` (client-side Zustand
   store) already holds AI assumptions ephemerally, by deliberate Founder
   Decision, precisely because Requirement itself is frozen/overwritten
   and assumptions are not meant to survive as persisted state. No new
   entity needed — just confirm this pattern extends to the M4 pipeline
   too.
3. **Requirement.md** (generated rendering, not stored — same pattern as
   Project Brief). Never hand-edited; regenerated whenever the canonical
   Requirement changes.

Deliberately **not** introducing: a separate `Constraint Set` persisted
entity (it's a pure function of Requirement, recomputed on demand, same
philosophy as `computeReadiness`/`computeScore` — no storage, no
staleness risk), a separate `Validation Result` entity (readiness is
already computed, not stored), a `RequirementSnapshot` entity (see §4.A —
recommend deferring; the M4 pipeline's `ConceptSet.generatedFromRequirement
Version` field, already specified in the frozen M4 architecture, already
captures "which Requirement state a Concept was generated from" via a
timestamp, without needing a full snapshot copy).

---

## 4. Resolution of Open Questions A–J

### A. Canonical architecture

```text
Conversation → AI Interview → Requirement JSON
    ├→ Requirement.md
    └→ Constraint Set Compiler (only when Requirement.status ∈ {ready, confirmed})
```

Confirmed correct, with one addition: a **status gate** (§4.J), not a
separate "Requirement Validation" or "Requirement Snapshot" stage.
"Human Confirmation" should be a real, minimal addition (one explicit
action, e.g. "Xác nhận yêu cầu" before generating concepts) — this is
currently missing end-to-end (today's Discovery Chat has no equivalent
of "I'm done, lock this in" moment) and is worth adding precisely because
the M4 pipeline's most expensive/risky stage (Design Intent Graph
generation) should never run against a Requirement the customer/founder
hasn't actually confirmed as final. "Requirement Snapshot" as a full
entity: **defer** — the existing `generatedFromRequirementVersion`
timestamp pattern (already used by `EstimateDraft`, already specified for
`ConceptSet` in the frozen M4 architecture) is sufficient and cheaper.

### B. Requirement data model boundaries

| Data | Belongs in |
|---|---|
| Site facts, household, functional needs, budget, style preferences stated by customer | Requirement |
| `askedQuestions`, live AI assumptions during an in-progress conversation | Interview/Draft State (ephemeral, not persisted) |
| `missingFields`, `score`, `readiness` | Derived/computed, not stored (existing pattern, keep) |
| `mustNotInclude`/`mustInclude`/`exactEnum`/`exactDimensions` | Constraint Set (pure function output, not stored — existing M4 architecture already specifies this) |
| Space relationships, zoning, privacy, circulation | Design Intent Graph — never Requirement |
| Project name, customer contact, status (Discovery/ReadyForBrief/...) | Project metadata — already separate from Requirement in the existing schema |

### C. Tri-state and exclusion model

Resolved in CAD-3: reuse existing `null/true/false` for fixed fields, add
`excludedRooms: string[]` for the open-ended case. No new enum.

### D. Unknown / Assumption / Open Question / Confidence

- **Unknown** = derived (`field === null`), same as today's
  `computeMissingFields`. Not a stored list.
- **Open Question** = derived from Unknown via
  `buildQuestionsFromMissing` (already exists). Not a separate stored
  object — same underlying data, different view, confirming the
  suspicion already raised in I2.
- **Assumption** = AI-generated per analyze call, kept **client-side
  ephemeral only** (existing Founder Decision, not to be revisited
  without a concrete reason — none has emerged here).
- **Confidence** = today only exists as an overall `score` (%), not
  per-field. **Defer** per-field confidence — Principle 5 in the context
  document already says the data model should not *block* this later; no
  schema change is needed now to keep that door open (a future
  `fieldMeta` side-table or JSON blob could be added without touching
  the frozen Requirement fields).

### E. Human-readable Requirement.md

Should show: grouped facts (reuse the existing Project Brief's section
grouping — Thông tin dự án / Thông tin khu đất / Nhu cầu công năng /
Ngân sách), an explicit **"Không cần" (excluded)** list rendered from
`excludedRooms` + any `false`-valued fixed fields, and a "Cần xác nhận
thêm" list rendered from derived missing fields — this is the exact same
pattern the existing Project Brief already uses (`toConfirm`), reused,
not reinvented. Should **hide**: any future per-field provenance/
confidence metadata (agrees with ChatGPT's "Not Yet Accepted" stance on
I1 — correct call, no disagreement here).

### F. Construction Scope

Resolved in CAD-4: keep the existing two-axis model
(`projectType` × `constructionScope`), do not build a new composite list.

### G. Household and user needs

Recommend a **small additive** extension, not a relationship graph:
keep `adults`/`children`/`hasElderly`/`cars` as-is, add:
- `accessibilityNeeds: boolean | null` + `accessibilityNeedsNote: string
  | null` (covers "người khuyết tật" from the v1 template without a new
  taxonomy).
- `householdNote: string | null` (freeform — covers domestic staff,
  guests, future family changes without modeling them as first-class
  fields; matches the existing `notes` field's precedent of "freeform
  when a fixed taxonomy isn't justified yet").
Do **not** model household members as a relationship graph (over-
engineering — nothing downstream needs to reason about individual family
members, only aggregate counts and a few boolean flags).

### H. Reference images and attachments

`referenceImages: { url: string, note: string }[]`. The `note` field is
**mandatory in practice** (not enforced by type, but by prompt/UI
guidance) and must describe only style/material/mood — never layout.
Downstream (Descriptor Compiler, per the frozen M4 architecture) must
treat the image URL as opaque and only ever consume the `note` text —
this is a hard rule worth stating explicitly in the eventual Requirement
feature spec, directly extending I3's "do not infer layout from images."
Confidence-in-interpretation: **defer**, same reasoning as §4.D.

### I. MVP boundary

Recommend explicitly scoping Requirement v1/v2 templates to **new-build
townhouse and villa only** — this matches both the existing seeded demo
data and the already-frozen M4 pipeline's own MVP scope decision (see
`05_Planning-M4-001-AI-Concept-Design.md`, which already made this exact
call for the same reasons). No schema change is needed to defer
apartment/renovation/interior-only — `projectType` already has those
enum values reserved; only the interview prompt tuning and downstream
pipeline support for those cases should wait.

### J. Versioning and confirmation

Recommend:
- **Add now:** `status: "draft" | "needs_clarification" | "ready" |
  "confirmed"` (cheap, directly enables CAD-2's gate) and `confirmedAt:
  Date | null` (cheap, timestamp only).
- **Defer:** `version`, `supersedesVersion` — Requirement today is a
  single-row, overwrite-on-update model (unlike `EstimateDraft`, which
  has a genuine "compare multiple drafts side by side" use case).
  Nothing in the current or frozen-M4 requirements calls for comparing
  historical Requirement versions; adding version tracking now is
  speculative infrastructure for a need that hasn't appeared.
- **Defer:** `confirmedBy` — no auth/user concept exists anywhere in this
  MVP (consistent with the rest of the product); adding a "confirmed by
  whom" field with nothing to populate it is dead weight.

---

## 5. Proposed Decision Log Entries

```text
Decision ID: REQ-D1
Title: Requirement JSON là nguồn dữ liệu chính thức, Requirement.md là bản render
Status: Accept
Decision: Requirement JSON (schema hiện có, Data Model v0.2) là nguồn sự
thật duy nhất. Requirement.md luôn được sinh ra từ Requirement JSON, không
bao giờ được chỉnh sửa tay trực tiếp. Constraint Set Compiler chỉ đọc
Requirement JSON, không bao giờ đọc/parse file .md.
Reason: Markdown tự do không thể được code deterministic đọc tin cậy được;
tách nguồn dữ liệu khỏi bản hiển thị giữ đúng ranh giới deterministic đã
chốt cho Constraint Set Compiler.
Consequences: Mọi thay đổi Requirement phải đi qua JSON trước; Requirement.md
là sản phẩm phái sinh, không phải input.
```

```text
Decision ID: REQ-D2
Title: Requirement JSON kế thừa và mở rộng schema hiện có (Data Model v0.2), không tạo schema mới song song
Status: Accept
Decision: Requirement feature cho milestone AI Concept Design SỬ DỤNG LẠI
schema Requirement đã đóng băng trong codebase (packages/shared-types),
chỉ bổ sung thêm field mới khi thật sự cần (excludedRooms,
accessibilityNeeds, referenceImages, status, confirmedAt) — không viết
lại từ đầu.
Reason: Founder là solo developer; duy trì 2 khái niệm "Requirement" song
song là rủi ro chi phí bảo trì lớn nhất có thể tránh được.
Consequences: Mọi thiết kế tiếp theo (Constraint Set Compiler, Requirement.md
rendering) phải build trên schema hiện có, không giả định 1 schema mới.
```

```text
Decision ID: REQ-D3
Title: Giữ nguyên tri-state null/true/false cho field cố định, thêm excludedRooms cho trường hợp tự do
Status: Accept
Decision: Không tạo enum required/excluded/unspecified mới. Các field
boolean cố định tiếp tục dùng null=chưa rõ/true=muốn có/false=từ chối rõ
ràng như hiện tại. Thêm field mới `excludedRooms: string[]` cho không
gian bị từ chối nhưng không có field cố định tương ứng.
Reason: Ngữ nghĩa hiện tại đã được kiểm chứng qua prompt extraction thực
tế; không cần thiết kế lại.
Consequences: Requirement.md và Constraint Set Compiler đều phải xử lý
đúng 3 trạng thái này cho field cố định, và đọc thêm excludedRooms cho
trường hợp tự do.
```

```text
Decision ID: REQ-D4
Title: Construction Scope giữ mô hình 2 trục (projectType × constructionScope), không gộp thành 1 danh sách category mới
Status: Accept
Decision: Không tạo danh sách phạm vi thi công mới (thiết kế/xây thô/hoàn
thiện/trọn gói/nội thất/cải tạo). Giữ nguyên projectType (loại dự án) và
constructionScope (mức độ khoán) như 2 trục độc lập đã có.
Reason: Mô hình bậc thang hiện tại (turnkey_with_interior ⊃ turnkey ⊃
rough_and_finishing_labor ⊃ labor_only) đã xử lý đúng vấn đề "không loại
trừ lẫn nhau" mà không cần thiết kế mới, và đã gắn sẵn vào logic bật/tắt
section của Estimate Engine.
Consequences: Không cần sửa Estimate Engine; Requirement.md hiển thị cả 2
trục riêng biệt, không gộp chung 1 danh sách.
```

```text
Decision ID: REQ-D5
Title: Thêm trạng thái xác nhận (status) cho Requirement, chưa làm versioning
Status: Accept (status field) / Defer (versioning)
Decision: Thêm field `status` (draft/needs_clarification/ready/confirmed)
và `confirmedAt` vào Requirement. KHÔNG thêm version/supersedesVersion/
confirmedBy ở giai đoạn này.
Reason: Cần 1 điểm chặn rõ ràng trước khi đưa Requirement vào Constraint
Set Compiler (tránh chạy pipeline tốn kém trên dữ liệu chưa hoàn chỉnh).
Versioning/confirmedBy chưa có nhu cầu thực tế cụ thể (không giống
EstimateDraft cần so sánh nhiều bản), và hệ thống hiện chưa có khái niệm
user/auth để gán confirmedBy.
Consequences: Discovery Chat cần thêm 1 hành động rõ ràng "Xác nhận yêu
cầu" trước khi cho phép sinh Concept.
```

```text
Decision ID: REQ-D6
Title: Reference images lưu kèm ghi chú bắt buộc, không suy diễn bố cục từ ảnh
Status: Accept
Decision: `referenceImages: { url, note }[]` — note mô tả phong cách/vật
liệu/không khí, KHÔNG được diễn giải bố cục. Descriptor Compiler (giai
đoạn sau, đã chốt ở kiến trúc M4) chỉ được đọc `note`, coi `url` là dữ
liệu không đọc được (opaque).
Reason: Đúng nguyên tắc "Requirement is not design" — ảnh dễ bị hiểu nhầm
thành gợi ý bố cục nếu không có ràng buộc rõ.
Consequences: UI thu thập ảnh tham khảo phải bắt buộc có ô ghi chú kèm
theo, không cho phép chỉ upload ảnh trơn.
```

---

## 6. Changes Recommended for Requirement Template v2

Precise change list against v1 (`requirement-template-v1.md`), not a
rewrite:

1. **Add** a "Phạm vi thi công" field to §4 (Mục tiêu xây dựng) —
   render `constructionScope` value in Vietnamese label (Chỉ nhân công /
   Xây thô + nhân công hoàn thiện / Trọn gói / Trọn gói + nội thất).
2. **Add** a labeled "Loại mái" field inside §6 (Phong cách) — render
   `roofType` (nullable — show "Chưa xác định" if null, per REQ-D3's
   existing semantics, not a new rule).
3. **Add** an explicit "Không cần" list, rendered from `excludedRooms` +
   any fixed field with `value === false` — this is the direct fix for
   C4, using the field now confirmed to exist (REQ-D3).
4. **Remove** §7 (Hard Constraints), §9 (Unknown Information), §11
   (Confidence) **as separate hand-authored sections** — since
   Requirement.md is now a generated rendering (REQ-D1), these become
   auto-rendered lists derived from the JSON (missing fields → "Cần xác
   nhận thêm"; excluded values → "Không cần", per item 3), not sections a
   human fills in blank. This directly resolves I1 without needing a new
   cross-referencing mechanism — the duplication risk disappears because
   there's no longer a second hand-maintained copy.
5. **Clarify** §6 "Hình tham khảo" with an inline note: "Chỉ ghi phong
   cách/vật liệu/tông màu gợi ý từ ảnh, không diễn giải bố cục" (per
   REQ-D6).
6. **Keep** §12 (Open Questions) but reframe as an auto-rendered list
   from the same derived missing-fields logic as item 4 (per §4.D — same
   underlying data as "Unknown," different framing, not a separate
   author-maintained section).
7. **Keep unchanged:** §1–3, §5, §8 (Soft Priorities can stay as
   free-text — it captures trade-off statements the customer makes,
   which is genuinely different content from field-level unknown/
   confidence tracking, not redundant with anything else).
8. **Fix** the Markdown heading artifacts (`## \##...`) — cosmetic, not
   architectural, but should not survive into v2.

---

## 7. Risks and Deferred Topics

**MVP risks (must address before/during Sprint 1):**
- CAD-1 (schema reconciliation) — if not resolved explicitly, Sprint 1
  ("Requirement → Constraint Set") risks building against the wrong
  source of truth.
- Missing confirmation gate (CAD-2) — without it, Sprint 2+ can waste AI
  budget on premature Design Intent Graph generation.

**Future scalability risks (acknowledged, not MVP-blocking):**
- Household modeling will likely need revisiting if the product later
  supports multi-generational/multi-family household structures beyond
  what `accessibilityNeeds`/`householdNote` can express as free text.
- Apartment/renovation projects will need a different "site" section
  entirely (existing structure vs raw land) — already flagged in the v1
  template review (N3), still open, deliberately deferred per §4.I.

**Deliberately postponed (explicit, not silent):**
- Per-field provenance/confidence metadata (§4.D, §4.H) — data model
  should not block it later, but nothing built now.
- Requirement versioning/supersedes (§4.J).
- `confirmedBy` (no auth concept exists yet).

---

## 8. Final Recommendation

Before drafting Requirement Template v2, get **one explicit confirmation
from the Founder**: that Requirement JSON for this feature **extends**
the existing frozen schema (CAD-1 / REQ-D2), not a fresh parallel design.
This is the cheapest possible decision to make now and the most expensive
to get wrong later — everything else in this response (§4.C, F, and half
of the Decision Log) depends on it, and all of it becomes near-free once
confirmed, since most of the "open questions" turn out to already have
working answers in the existing implementation.

Once confirmed, Template v2 can be drafted directly from §6's change
list — it is a small, additive edit to v1, not a redesign.

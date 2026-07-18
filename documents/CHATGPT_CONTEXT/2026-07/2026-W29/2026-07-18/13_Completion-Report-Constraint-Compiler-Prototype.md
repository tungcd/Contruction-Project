# Completion Report — Constraint Set Compiler Prototype

**Ngày:** 2026-07-18
**Khung diễn đạt:** current recommendation, có thể chỉnh khi Manual POC
cho bằng chứng ngược (Startup Flexibility Principle).

## 1. Compiler Implementation Summary

- `packages/shared-types/src/constraint-set-compiler.ts` (mới) —
  `compileRequirementToConstraintSet(requirement): ConstraintSet`, Pure
  Function, không gọi AI/DB/network.
- **Explicit Precondition**: throw `RequirementNotConfirmedError` nếu
  `requirement.status !== "confirmed"` — fail-fast, không sinh partial
  output.
- **Cross-field validation**: throw `ConstraintValidationError` nếu một
  tên phòng xuất hiện ở CẢ `otherRooms` lẫn `excludedRooms` — không tự
  resolve (theo Schema Review Round 2).
- **No Silent Drop**: 6 field dạng ghi chú tự do
  (`buildingTypeNote/roofTypeNote/architecturalStyleNote/
  constructionScopeNote/budgetNote/notes`) được preserve vào
  `unresolved` thay vì bị bỏ qua.
- **Null handling**: field `null` ở Requirement → không tạo
  `ConstraintField`; mảng rỗng (`otherRooms`/`excludedRooms` khi
  Requirement không nhắc gì) cũng coi như "không nhắc tới", không tạo
  field — nhất quán với nguyên tắc No Information Creation.
- **Field cần bổ sung ở Requirement để compiler chạy được** (đã quyết
  định từ trước, chỉ chưa implement — không phải thiết kế mới):
  `status`/`confirmedAt` (REQ-D7), `functional.excludedRooms` (REQ-D3),
  `household.accessibilityNeeds` (§4.G) — đã thêm vào
  `packages/shared-types/src/requirement.ts`.

## 2. Fixture Summary

3 fixture đúng phạm vi MVP tại `packages/shared-types/fixtures/constraint/`:

- `simple-house` — tối thiểu (nhà cấp 4, ít field), kiểm tra golden path
  cơ bản, hầu hết field null.
- `townhouse` — nhà phố, có `excludedRooms`/`otherRooms` không trùng
  nhau, `budgetNote` → kiểm tra `unresolved`.
- `villa` — biệt thự, có `household` (hasElderly/accessibilityNeeds),
  2 note field + `notes` → kiểm tra `unresolved` với 3 mục.

Đã bỏ qua `interior-only`/`renovation` theo đúng quyết định defer từ
Requirement Domain Model (§4.I).

## 3. Manual POC Findings

Script `npm run poc:constraint` (`packages/shared-types/scripts/
compiler-poc.mjs`) build rồi compile từng fixture, so sánh với
`expected-constraint-set.json` (bỏ qua `metadata.compiledAt` vì đây là
timestamp runtime, không phải nội dung miền).

```
Constraint Set Compiler — Manual POC (3 fixtures)

  PASS  simple-house
  PASS  townhouse
  PASS  villa

3/3 pass
```

Schema "cảm thấy tự nhiên" khi implement — không cần workaround nào cho
3 case trong phạm vi MVP; `ConstraintField<T>` (scalar/enum/array/range)
và `UnresolvedEntry` đều dùng đúng như thiết kế, không cần điều chỉnh gì
thêm ở tầng schema.

## 4. Discovered Failure Modes / Cần làm rõ

- **`metadata.compiledAt` không deterministic theo nghĩa đen** (timestamp
  runtime) — đã làm rõ trong code comment: "Deterministic" invariant áp
  dụng cho NỘI DUNG MIỀN, không áp dụng cho `compiledAt`. Không phải lỗi,
  chỉ cần thống nhất cách hiểu này khi Descriptor/Design Intent Graph tới
  lượt (nếu chúng cũng có metadata tương tự).
- **Requirement chưa phân biệt "đúng N" vs "ít nhất N"** cho field số
  (bedrooms, floors, diện tích...) — compiler hiện mặc định
  `constraintType: "exact"` cho mọi field số (trừ `budget`, vốn đã có
  min/max từ Requirement). Đây là giới hạn dữ liệu đầu vào từ
  Requirement, KHÔNG phải lỗi ConstraintSet Schema (schema đã có
  `min`/`max` sẵn sàng dùng khi có dữ liệu). Đề xuất nhỏ nhất nếu cần sau
  này: bổ sung tín hiệu "ít nhất/đúng/tối đa" vào Requirement extraction
  — chưa làm vì chưa có bằng chứng cụ thể cần thiết (đúng A5, hoãn tới
  khi thấy nhu cầu thật).
- **Chưa có UI/workflow xác nhận Requirement thật** — fixture gán thẳng
  `status: "confirmed"` vì action "Xác nhận yêu cầu" (đã nêu ở
  Requirement Domain Model §4.A) chưa được xây dựng. Explicit
  Precondition trong compiler hoạt động đúng, nhưng chưa có gì trong app
  thực sự đưa Requirement tới trạng thái này ngoài chỉnh tay JSON.
- **Đường lỗi (fail-fast/validation error) chưa có fixture riêng** — 3
  fixture đều là golden path thành công theo đúng yêu cầu ("Each fixture
  should contain requirement.json + expected-constraint-set.json"); có
  thể bổ sung fixture kiểu "should reject" sau nếu cần, chưa làm vì
  ngoài phạm vi được giao.

Không phát hiện giới hạn nào của Conceptual/Logical Schema cần sửa —
không đề xuất mở lại schema.

## Files

- Mới: `packages/shared-types/src/constraint-set-compiler.ts`,
  `packages/shared-types/scripts/compiler-poc.mjs`,
  `packages/shared-types/fixtures/constraint/{simple-house,townhouse,villa}/
  {requirement.json,expected-constraint-set.json}`.
- Sửa: `packages/shared-types/src/requirement.ts` (thêm `status`,
  `confirmedAt`, `functional.excludedRooms`,
  `household.accessibilityNeeds`), `packages/shared-types/src/index.ts`
  (export compiler), `packages/shared-types/package.json` (script
  `poc:constraint`), `apps/web/src/lib/ai/parsers/merge.ts` (giữ
  `status`/`confirmedAt` khi merge, union-merge `excludedRooms` giống
  `otherRooms`).

## Verify

- `npm run typecheck` (shared-types): PASS.
- `npm run build` (shared-types): PASS.
- `npm run poc:constraint`: 3/3 PASS.
- `tsc --noEmit` (apps/web): PASS (sau khi sửa `merge.ts` — phát hiện 1
  chỗ vỡ type do thêm `status`/`confirmedAt` bắt buộc, đã fix).

## Next

Theo workflow đã chốt: Completion Report này → Prototype Review (nếu
Founder/ChatGPT thấy cần) → bắt đầu Design Intent Graph.

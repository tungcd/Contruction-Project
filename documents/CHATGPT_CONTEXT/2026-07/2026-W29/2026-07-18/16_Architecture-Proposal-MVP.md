# Proposal MVP — Architecture, Domain Model, Pipeline, Export Strategy

**Ngày:** 2026-07-18
**Trạng thái:** Architecture — chưa code. Theo đúng workflow: Architecture
→ Prototype → Fixtures → Manual POC → Completion Report.

---

## 1. Review Estimate MVP hiện có — tái sử dụng được gì

Đã đọc kỹ code hiện tại trước khi thiết kế (tránh lặp lại sai lầm ở
STOP file 15 — không thiết kế mà không biết cái gì đã có sẵn):

| Đã có | Ở đâu | Tái sử dụng cho Proposal thế nào |
|---|---|---|
| `BriefSection[]` (Project/Site/Household/Functional, deterministic, chỉ hiện field có giá trị) | `features/requirement/brief-view.ts` | Dùng thẳng cho `projectSummary` — không viết lại |
| `buildScopeSection()` (constructionScope) | `brief-view.ts` | Dùng thẳng cho `proposedScope` |
| `buildEstimateSummary()` (total, subtotal từng section, đếm needs_survey/user_confirmed) | `features/estimate/estimate-view.ts` | Dùng thẳng cho `estimateSummary` |
| `EstimateDraftRecord.status: "draft"\|"confirmed"` | `lib/estimate/persistence-types.ts` | Proposal chỉ nên generate từ EstimateDraft đã `confirmed` — cùng tinh thần Explicit Precondition đã áp dụng cho Constraint Compiler |
| `Project.customerName/customerPhone` | Prisma `Project` | `customerSummary` |
| `requirement.timeline.expectedStart/expectedFinish` | Requirement (đã có, chưa dùng ở đâu) | `timeline` |
| `requirement.functional.excludedRooms` (mới thêm hôm nay) | Requirement | `exclusions` — đúng dữ liệu, khỏi phải hỏi lại khách |
| Excel export dùng `exceljs` | `lib/estimate/excelExport.ts` | Không tái dùng được cho PDF (khác định dạng) — xem mục 5 |

**Kết luận review:** phần lớn nội dung Proposal cần đã tồn tại rải rác ở
Requirement + EstimateDraft. Việc thật sự mới là: **assembler** ghép
chúng lại đúng khuôn dạng khách hàng đọc được, cộng thêm vài field nhỏ
chưa có nguồn nào (`assumptions` viết tay, `paymentPlan`, `validity`,
`contractorInformation`).

---

## 2. Proposal Architecture

```text
Requirement (status=confirmed)
      +
EstimateDraftRecord (status=confirmed)
      +
ContractorProfile (settings tĩnh, KHÔNG per-project)
      +
ProposalSettings (validity ngày, mẫu payment plan)
        ↓
  buildProposal()  — Pure Function, Deterministic, No AI (v1)
        ↓
      Proposal (JSON, KHÔNG persist ở v1 — xem lý do mục 4)
        ↓
   Web Preview  /  In → PDF (browser print)
```

Ranh giới (giống tinh thần Constraint Compiler): `buildProposal()` chỉ
đọc dữ liệu đã có, không tính lại Estimate, không gọi AI ở v1, không ghi
DB.

**Explicit Precondition:** chỉ generate khi CẢ Requirement lẫn
EstimateDraft đều `confirmed` — nếu không, báo lỗi rõ ràng, không sinh
Proposal một phần.

---

## 3. Proposal Domain Model (tối thiểu, không thiết kế thừa)

```ts
interface Proposal {
  generatedAt: string;
  customerSummary: { name: string | null; phone: string | null };
  projectSummary: BriefSection[];        // tái dùng nguyên brief-view.ts
  proposedScope: BriefSection | null;    // tái dùng buildScopeSection()
  estimateSummary: EstimateSummary;      // tái dùng buildEstimateSummary()
  assumptions: string[];                 // MỚI — xem mục 3.1
  exclusions: string[];                  // MỚI nhưng có sẵn dữ liệu — từ requirement.functional.excludedRooms
  timeline: { expectedStart: string | null; expectedFinish: string | null }; // có sẵn dữ liệu
  paymentPlan: PaymentMilestone[];        // MỚI — xem mục 3.2
  validity: { validUntil: string };       // MỚI
  contractorInfo: ContractorProfile;      // MỚI — settings tĩnh
}

interface PaymentMilestone {
  label: string;   // vd "Đặt cọc", "Hoàn thiện phần thô", "Bàn giao"
  percent: number; // 0-100, tổng nên = 100 (validate, không auto-fix)
}

interface ContractorProfile {
  companyName: string;
  phone: string;
  address: string | null;
}
```

Cố tình KHÔNG mô hình hoá: hợp đồng, điều khoản pháp lý, bảo hành chi
tiết (task đã loại trừ rõ — "Avoid contract generation... legal
clauses"). "Warranty" trong danh sách section gốc bị bỏ khỏi Domain
Model vì chưa có nguồn dữ liệu/quyết định nào — nếu Founder cần, đây là
field tự do (`warrantyNote: string | null`) chứ chưa cần mô hình riêng.

### 3.1. `assumptions` — nguồn dữ liệu

Không có kho "assumption" nào sẵn có cho Estimate (khác Requirement,
Estimate chưa từng track assumption). Đề xuất: sinh một dòng mặc định
từ `EstimateSummary.needsSurveyOrMeasurementCount` (nếu > 0: "X hạng mục
cần đo đạc/khảo sát thực tế trước khi thi công"), phần còn lại là mảng
string **để trống, contractor tự điền** trước khi gửi khách — giống
đúng triết lý "editable: true" đã dùng cho BOQDraftLine. Không cố suy
diễn thêm assumption nào khác chưa có bằng chứng cần.

### 3.2. `paymentPlan` — không có nguồn dữ liệu, để trống mặc định

MVP không suy đoán tỷ lệ thanh toán (mỗi hợp đồng khác nhau, không đủ dữ
liệu để suy diễn không sai). Mặc định mảng rỗng, contractor tự nhập tay
qua UI trước khi xuất — tránh đưa ra tỷ lệ "bịa" cho một tài liệu khách
hàng sẽ đọc trực tiếp.

---

## 4. Có nên persist Proposal (DB, versioned) không?

**Đề xuất: KHÔNG, ở v1.** `buildProposal()` chạy on-demand mỗi lần mở
trang Preview, không lưu bản ghi riêng (khác `EstimateDraft`, vốn có lý
do rõ để versioned — so sánh nhiều bản báo giá). Task hiện tại không
yêu cầu "Proposal History" (khác Estimate MVP's Feature 2). Nếu sau demo
thấy cần lưu/sửa tay Proposal độc lập khỏi Requirement/Estimate hiện
tại, đó là bổ sung rẻ, làm sau khi có bằng chứng (đúng A5) — không thiết
kế trước.

---

## 5. Export Strategy — Web Preview + In/PDF

**Không thêm dependency PDF mới** (`puppeteer`/`react-pdf`/`pdfkit`).
Đề xuất:

- Trang mới `app/projects/[id]/proposal/page.tsx` — render `Proposal`
  bằng antd (Card/Typography), giống style trang Brief hiện tại.
- CSS `@media print` riêng cho trang này (ẩn nav/nút, layout 1 cột sạch
  sẽ) + nút "In / Xuất PDF" gọi `window.print()` — trình duyệt tự cho
  "Save as PDF". Chi phí gần như bằng 0, không cần server-side rendering.
- Nếu sau demo thấy cần "tải PDF trực tiếp" không qua dialog in của
  trình duyệt, xem xét thêm lib nhẹ lúc đó — chưa có bằng chứng cần bây
  giờ.

---

## 6. Implementation Plan (Prototype — bước tiếp theo)

1. `apps/web/src/lib/proposal/types.ts` — Domain Model ở mục 3 (không
   phải `packages/shared-types`, vì Proposal đặc thù app-level, tái
   dùng type nội bộ của `lib/estimate`, giống cách `lib/estimate/` tự
   đứng riêng thay vì nằm trong shared-types).
2. `apps/web/src/lib/proposal/builder.ts` —
   `buildProposal(requirement, estimateDraft, project, contractorProfile, settings): Proposal`,
   Explicit Precondition (`status==="confirmed"` cho cả 2 input).
3. Fixtures: tái dùng 3 Requirement JSON đã có
   (`packages/shared-types/fixtures/constraint/{simple-house,townhouse,villa}/requirement.json`)
   — chạy qua `buildEstimateDraft()` (đã có) rồi `buildProposal()` (mới),
   viết `expected-proposal.json` tương ứng.
4. Script Manual POC kiểu `compiler-poc.mjs`, so sánh output (bỏ qua
   `generatedAt`).
5. Trang Web Preview + CSS in.

Sẽ implement ngay bước 1-4 (không cần vòng review thêm — thiết kế trên
rủi ro thấp, tái dùng phần lớn code có sẵn), trừ khi Founder muốn xem
lại Domain Model trước.

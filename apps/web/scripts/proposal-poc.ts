/**
 * Manual POC — Proposal Builder.
 *
 *   npm run poc:proposal
 *
 * Không so deep-equal với 1 file expected.json khổng lồ: 3/5 phần của
 * Proposal (projectSummary/proposedScope/estimateSummary) chỉ gọi lại
 * nguyên hàm brief-view.ts/estimate-view.ts đã có sẵn — hand-chép lại
 * output của chúng vào 1 fixture riêng sẽ tạo thêm 1 nơi phải giữ đồng
 * bộ với chính source code (đúng rủi ro desync đã tránh nhiều lần trong
 * dự án). Thay vào đó, assert có mục tiêu vào đúng phần MỚI của
 * `buildProposal` (assumptions/exclusions/timeline/validity/
 * precondition) — nơi thực sự có logic mới cần kiểm chứng.
 */
import { RequirementSchema } from "@acc/shared-types";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { buildEstimateDraft } from "@/lib/estimate/engine";
import { DEFAULT_ESTIMATE_SETTINGS } from "@/lib/estimate/sample-data/settings.sample";
import { DEMO_PRICE_BOOK } from "@/lib/estimate/sample-data/price-book.demo";
import { buildProposal, ProposalNotReadyError } from "@/lib/proposal/builder";

const fixturesDir = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "packages",
  "shared-types",
  "fixtures",
  "constraint",
);

const CONTRACTOR = {
  companyName: "[DEMO] Công ty Xây dựng ABC",
  phone: "0900 000 000",
  address: null,
};
const SETTINGS = { validityDays: 30 };

const cases = readdirSync(fixturesDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

console.log(`\nProposal Builder — Manual POC (${cases.length} fixtures)\n`);

let passed = 0;
for (const name of cases) {
  const rawRequirement = JSON.parse(
    readFileSync(path.join(fixturesDir, name, "requirement.json"), "utf8"),
  );
  const requirement = RequirementSchema.parse(rawRequirement);

  try {
    const estimateDraft = buildEstimateDraft(
      requirement,
      DEFAULT_ESTIMATE_SETTINGS,
      DEMO_PRICE_BOOK,
    );
    const proposal = buildProposal(
      requirement,
      estimateDraft,
      "confirmed",
      { name: "Anh " + name, phone: "090xxxxxxx" },
      CONTRACTOR,
      SETTINGS,
    );

    // exclusions phải khớp CHÍNH XÁC requirement.functional.excludedRooms — không được biến đổi.
    assert.deepStrictEqual(proposal.exclusions, requirement.functional.excludedRooms);

    // timeline pass-through nguyên vẹn.
    assert.equal(proposal.timeline.expectedStart, requirement.timeline.expectedStart);
    assert.equal(proposal.timeline.expectedFinish, requirement.timeline.expectedFinish);

    // assumptions: có đúng 1 dòng khi có hạng mục needs_survey/needs_measurement, không có khi = 0.
    const expectAssumption = proposal.estimateSummary.needsSurveyOrMeasurementCount > 0;
    assert.equal(proposal.assumptions.length > 0, expectAssumption);

    // validity = generatedAt + 30 ngày, sai lệch phải bằng 0 (tính bằng ms).
    const diffMs =
      new Date(proposal.validity.validUntil).getTime() - new Date(proposal.generatedAt).getTime();
    assert.equal(diffMs, SETTINGS.validityDays * 24 * 60 * 60 * 1000);

    // paymentPlan mặc định rỗng (MVP không suy đoán).
    assert.deepStrictEqual(proposal.paymentPlan, []);

    // projectSummary/proposedScope không rỗng vô lý (Requirement đã confirmed phải có ít nhất vài field).
    assert.ok(proposal.projectSummary.length > 0, "projectSummary rỗng bất thường");

    console.log(`  PASS  ${name}`);
    passed++;
  } catch (err) {
    console.log(`  FAIL  ${name}`);
    console.log(`        ${(err as Error).message}`);
  }
}

// Explicit Precondition — Requirement chưa confirmed phải bị chặn.
try {
  const draftRequirement = RequirementSchema.parse({ status: "draft" });
  const estimateDraft = buildEstimateDraft(
    draftRequirement,
    DEFAULT_ESTIMATE_SETTINGS,
    DEMO_PRICE_BOOK,
  );
  buildProposal(
    draftRequirement,
    estimateDraft,
    "confirmed",
    { name: null, phone: null },
    CONTRACTOR,
    SETTINGS,
  );
  console.log("  FAIL  precondition — lẽ ra phải throw ProposalNotReadyError");
} catch (err) {
  if (err instanceof ProposalNotReadyError) {
    console.log("  PASS  precondition (Requirement draft bị chặn đúng)");
    passed++;
  } else {
    console.log(`  FAIL  precondition — throw sai loại lỗi: ${(err as Error).message}`);
  }
  cases.push("precondition-check");
}

const failed = cases.length - passed;
console.log(`\n${passed}/${cases.length} pass${failed ? `, ${failed} FAIL` : ""}\n`);
process.exit(failed ? 1 : 0);

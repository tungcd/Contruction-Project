/**
 * Manual POC — Concept Drawing Stage 1 (Single-Floor Geometry POC).
 *
 *   npm run poc:drawing
 *
 * Chỉ target fixture `simple-house` (đúng phạm vi Stage 1 authorization
 * — không multi-floor, không cầu thang, không villa). Assert theo THUỘC
 * TÍNH hình học (không chồng lấn, trong envelope, đủ phòng, SVG sinh
 * được) thay vì hand-compute toạ độ — cùng lý do đã áp dụng ở
 * proposal-poc.ts: tránh tạo thêm 1 nơi phải giữ đồng bộ tay với chính
 * thuật toán.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { RequirementSchema, compileRequirementToConstraintSet } from "@acc/shared-types";
import { generateConceptDrawing } from "@/lib/drawing/generateDrawing";
import { renderFloorPlanToSvg } from "@/lib/drawing/svgRenderer";

const fixtureDir = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "packages",
  "shared-types",
  "fixtures",
  "constraint",
  "simple-house",
);

console.log("\nConcept Drawing — Manual POC (Stage 1, fixture: simple-house)\n");

let passed = 0;
let total = 0;
function check(name: string, ok: boolean, detail?: string) {
  total++;
  if (ok) {
    console.log(`  PASS  ${name}`);
    passed++;
  } else {
    console.log(`  FAIL  ${name}${detail ? `  (${detail})` : ""}`);
  }
}

try {
  const rawRequirement = JSON.parse(readFileSync(path.join(fixtureDir, "requirement.json"), "utf8"));
  const requirement = RequirementSchema.parse(rawRequirement);
  const constraintSet = compileRequirementToConstraintSet(requirement);

  const { drawingPackage, validation, templateId } = generateConceptDrawing(constraintSet, "Simple House Demo");

  check("template được chọn", templateId === "townhouse-single-floor-v1", templateId);
  check("geometry validation passed (không lỗi)", validation.passed, validation.errors.join("; "));
  check("có đúng 1 sheet (Stage 1: 1 tầng)", drawingPackage.sheets.length === 1);

  const sheet = drawingPackage.sheets[0];
  const roomTypes = sheet.floorPlan.rooms.map((r) => r.type);
  check("có phòng khách", roomTypes.includes("living"));
  check("có bếp", roomTypes.includes("kitchen"));
  check(
    "đủ 2 phòng ngủ",
    roomTypes.filter((t) => t === "bedroom").length === 2,
    `thực tế: ${roomTypes.filter((t) => t === "bedroom").length}`,
  );
  check("đủ 1 WC", roomTypes.filter((t) => t === "wc").length === 1);

  const totalArea = sheet.floorPlan.rooms.reduce((s, r) => s + r.areaM2, 0);
  const expectedArea = constraintSet.site.buildingFootprint?.value ?? 0;
  check(
    "tổng diện tích khớp buildingFootprint",
    Math.abs(totalArea - expectedArea) < 0.1,
    `${totalArea.toFixed(2)} vs ${expectedArea}`,
  );

  check("có title block + disclaimer", sheet.titleBlock.disclaimer.length > 0);
  check("có ít nhất 1 wall exterior", sheet.floorPlan.walls.some((w) => w.type === "exterior"));
  check("có ít nhất 1 wall interior", sheet.floorPlan.walls.some((w) => w.type === "interior"));

  const svg = renderFloorPlanToSvg(sheet);
  check("SVG sinh được, không rỗng", svg.includes("<svg") && svg.length > 200);

  // Cùng input -> cùng hình học (Deterministic — bất biến bắt buộc).
  const second = generateConceptDrawing(constraintSet, "Simple House Demo");
  const sameGeometry =
    JSON.stringify(drawingPackage.sheets[0].floorPlan.rooms) ===
    JSON.stringify(second.drawingPackage.sheets[0].floorPlan.rooms);
  check("deterministic — chạy lại cho cùng hình học", sameGeometry);
} catch (err) {
  console.log(`  FAIL  (crash) ${(err as Error).message}`);
  total++;
}

console.log(`\n${passed}/${total} pass${passed < total ? `, ${total - passed} FAIL` : ""}\n`);
process.exit(passed === total ? 0 : 1);

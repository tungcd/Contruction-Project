/**
 * Sinh artifact có thể review được (Stage 1.5/1.6/1.7/2A) — không chỉ
 * báo cáo PASS/FAIL, mà xuất ra file thật để xem trực tiếp.
 *
 *   npm run drawing:artifacts
 *
 * Output: apps/web/demo-output/<fixture>/
 *
 * Gọi ĐÚNG 1 entry point `generateConceptDrawing()` — không tự lặp lại
 * chuỗi bước pipeline (bài học thật: bản trước của file này tự gọi lại
 * generateLayout/deriveWalls/... riêng, và thiếu `validation.warnings`
 * khi `generateDrawing.ts` được cập nhật — lỗi 2-nơi-cùng-1-logic).
 *
 * Stage 2A: sinh cho CẢ 2 fixture (simple-house 1 tầng, townhouse nhiều
 * tầng) bằng CÙNG 1 vòng lặp — tránh lặp lại logic ở 2 file script khác
 * nhau (đúng lỗi đã học ở Stage 1.6).
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { RequirementSchema, compileRequirementToConstraintSet } from "@acc/shared-types";
import { generateConceptDrawing } from "@/lib/drawing/generateDrawing";
import { renderFloorPlanToSvg } from "@/lib/drawing/svgRenderer";

const FIXTURES: { dir: string; projectName: string; outName: string }[] = [
  { dir: "simple-house", projectName: "Simple House Demo", outName: "simple-house" },
  { dir: "townhouse", projectName: "Townhouse Demo", outName: "townhouse" },
];

for (const fixture of FIXTURES) {
  const fixtureDir = path.join(__dirname, "..", "..", "..", "packages", "shared-types", "fixtures", "constraint", fixture.dir);
  const outDir = path.join(__dirname, "..", "demo-output", fixture.outName);
  mkdirSync(outDir, { recursive: true });

  const rawRequirement = JSON.parse(readFileSync(path.join(fixtureDir, "requirement.json"), "utf8"));
  const requirement = RequirementSchema.parse(rawRequirement);
  const constraintSet = compileRequirementToConstraintSet(requirement);

  const { templateId, drawingPackage, validation, staircaseCore, intermediates } = generateConceptDrawing(
    constraintSet,
    fixture.projectName,
  );

  writeFileSync(
    path.join(outDir, `${fixture.outName}-layout-graphs.json`),
    JSON.stringify(intermediates.layoutGraphs, null, 2),
  );
  writeFileSync(
    path.join(outDir, `${fixture.outName}-geometry.json`),
    JSON.stringify(intermediates.geometry, null, 2),
  );
  writeFileSync(
    path.join(outDir, `${fixture.outName}-drawing-package.json`),
    JSON.stringify(drawingPackage, null, 2),
  );
  writeFileSync(
    path.join(outDir, `${fixture.outName}-staircase-core.json`),
    JSON.stringify(staircaseCore, null, 2),
  );

  const svgsBySheet = drawingPackage.sheets.map((sheet) => renderFloorPlanToSvg(sheet));
  svgsBySheet.forEach((svg, i) => {
    writeFileSync(path.join(outDir, `${fixture.outName}-floor-plan-${i}.svg`), svg);
  });

  const printHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8" />
<title>${fixture.projectName} — Concept Drawing</title>
<style>
  /* viewBox của mỗi SVG đã LUÔN đúng tỷ lệ A4 (595x842), tự chừa margin/
     vùng title/disclaimer BÊN TRONG chính nó (xem svgRenderer.ts) —
     @page ở đây chỉ set khổ giấy, margin=0 để viewBox ánh xạ 1:1 ra
     trang in. Stage 2A, Task 5 — mỗi sheet 1 trang in riêng
     (page-break-after), không dồn nhiều tầng vào 1 trang. */
  @page { size: A4 portrait; margin: 0; }
  html, body { margin: 0; padding: 0; font-family: system-ui, sans-serif; }
  .sheet { padding: 0; page-break-after: always; }
  .sheet:last-child { page-break-after: auto; }
  svg { width: 100%; height: auto; display: block; }
</style>
</head>
<body>
${svgsBySheet.map((svg) => `<div class="sheet">\n${svg}\n</div>`).join("\n")}
</body>
</html>`;
  writeFileSync(path.join(outDir, `${fixture.outName}-floor-plan-print.html`), printHtml);

  const readme = `# ${fixture.projectName} — Concept Drawing Artifacts

Sinh bởi \`npm run drawing:artifacts\`. Template: \`${templateId}\`.
Số tầng / sheet: ${drawingPackage.sheets.length}.
Geometry validation: ${validation.passed ? "PASSED" : "FAILED — " + validation.errors.join("; ")}.
${validation.warnings.length ? `Warnings (không chặn, vẫn PASS): ${validation.warnings.join(" | ")}` : ""}
${staircaseCore ? `Staircase: thẳng hàng ở các tầng [${staircaseCore.levels.join(", ")}], rộng ${staircaseCore.width.toFixed(2)}m.` : "Staircase: không áp dụng (nhà 1 tầng)."}

## Files

- \`${fixture.outName}-layout-graphs.json\` — LayoutGraph MỖI TẦNG (tô-pô, nodes/edges).
- \`${fixture.outName}-geometry.json\` — Geometry mọi tầng (toạ độ polygon, mét).
- \`${fixture.outName}-drawing-package.json\` — Drawing Document đầy đủ (rooms/walls/doors/windows/dimensions/titleBlock/warnings, 1 sheet/tầng).
- \`${fixture.outName}-staircase-core.json\` — Staircase Core đã xác nhận thẳng hàng (null nếu 1 tầng).
- \`${fixture.outName}-floor-plan-{N}.svg\` — SVG thô từng tầng (N = index sheet, 0 = tầng trệt), mở trực tiếp bằng trình duyệt hoặc image viewer.
- \`${fixture.outName}-floor-plan-print.html\` — mở bằng trình duyệt, dùng "In / Save as PDF" (Ctrl+P) — mỗi tầng tự động sang 1 trang riêng.

## Vì sao không có sẵn file .png/.pdf

Môi trường chạy script này không có trình duyệt/display — không thể tự
chụp ảnh hay xuất PDF thật (đúng quyết định đã chốt: PDF = in chuỗi SVG
qua trình duyệt, không dựng renderer PDF riêng). Mở
\`${fixture.outName}-floor-plan-print.html\` bằng trình duyệt bất kỳ và
Ctrl+P → Save as PDF để có file PDF thật kiểm tra bằng mắt.
`;
  writeFileSync(path.join(outDir, "README.md"), readme);

  console.log(`\n=== ${fixture.outName} ===`);
  console.log(`Đã sinh artifact tại: ${outDir}`);
  console.log(`Template: ${templateId}`);
  console.log(`Số sheet: ${drawingPackage.sheets.length}`);
  console.log(`Validation: ${validation.passed ? "PASSED" : "FAILED"}`);
  if (!validation.passed) console.log(validation.errors.join("\n"));
  if (validation.warnings.length) console.log(`Warnings: ${validation.warnings.join(" | ")}`);
}

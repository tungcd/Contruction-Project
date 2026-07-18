/**
 * Sinh artifact có thể review được (Stage 1.5, Task 1) — không chỉ báo
 * cáo PASS/FAIL, mà xuất ra file thật để xem trực tiếp.
 *
 *   npm run drawing:artifacts
 *
 * Output: apps/web/demo-output/simple-house/
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { RequirementSchema, compileRequirementToConstraintSet } from "@acc/shared-types";
import { generateLayout } from "@/lib/drawing/layoutGenerator";
import { deriveWalls } from "@/lib/drawing/wall";
import { placeDoors } from "@/lib/drawing/door";
import { validateGeometry } from "@/lib/drawing/geometryValidator";
import { buildDrawingPackage } from "@/lib/drawing/drawingDocument";
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
const outDir = path.join(__dirname, "..", "demo-output", "simple-house");
mkdirSync(outDir, { recursive: true });

const rawRequirement = JSON.parse(readFileSync(path.join(fixtureDir, "requirement.json"), "utf8"));
const requirement = RequirementSchema.parse(rawRequirement);
const constraintSet = compileRequirementToConstraintSet(requirement);

const { templateId, layoutGraph, geometry, warnings } = generateLayout(constraintSet);
const walls = deriveWalls(geometry);
const { doors, warnings: doorWarnings } = placeDoors(layoutGraph, walls);
const validation = validateGeometry(geometry, layoutGraph, walls, doors, constraintSet);
const drawingPackage = buildDrawingPackage(
  geometry,
  walls,
  doors,
  "Simple House Demo",
  [...warnings, ...doorWarnings, ...validation.errors],
  layoutGraph.envelope,
);

writeFileSync(
  path.join(outDir, "simple-house-layout-graph.json"),
  JSON.stringify(layoutGraph, null, 2),
);
writeFileSync(path.join(outDir, "simple-house-geometry.json"), JSON.stringify(geometry, null, 2));
writeFileSync(
  path.join(outDir, "simple-house-drawing-package.json"),
  JSON.stringify(drawingPackage, null, 2),
);

const svg = renderFloorPlanToSvg(drawingPackage.sheets[0]);
writeFileSync(path.join(outDir, "simple-house-floor-plan.svg"), svg);

const printHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8" />
<title>Simple House — Concept Drawing (Stage 1.5)</title>
<style>
  body { margin: 0; padding: 24px; font-family: system-ui, sans-serif; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
${svg}
</body>
</html>`;
writeFileSync(path.join(outDir, "simple-house-floor-plan-print.html"), printHtml);

const readme = `# Simple House — Concept Drawing Artifacts (Stage 1.5)

Sinh bởi \`npm run drawing:artifacts\`. Template: \`${templateId}\`.
Geometry validation: ${validation.passed ? "PASSED" : "FAILED — " + validation.errors.join("; ")}.

## Files

- \`simple-house-layout-graph.json\` — LayoutGraph (tô-pô, nodes/edges).
- \`simple-house-geometry.json\` — Geometry (toạ độ polygon, mét).
- \`simple-house-drawing-package.json\` — Drawing Document đầy đủ (rooms/walls/doors/dimensions/titleBlock/warnings).
- \`simple-house-floor-plan.svg\` — SVG thô, mở trực tiếp bằng trình duyệt hoặc image viewer bất kỳ để xem.
- \`simple-house-floor-plan-print.html\` — mở bằng trình duyệt, dùng "In / Save as PDF" (Ctrl+P) để tự tạo file PDF/ảnh chụp màn hình.

## Vì sao không có sẵn file .png/.pdf

Môi trường chạy script này không có trình duyệt/display — không thể tự
chụp ảnh hay xuất PDF thật (đúng quyết định đã chốt: PDF = in chuỗi SVG
qua trình duyệt, không dựng renderer PDF riêng). Mở
\`simple-house-floor-plan-print.html\` bằng trình duyệt bất kỳ và
Ctrl+P → Save as PDF để có file PDF thật kiểm tra bằng mắt.
`;
writeFileSync(path.join(outDir, "README.md"), readme);

console.log(`\nĐã sinh artifact tại: ${outDir}`);
console.log(`Template: ${templateId}`);
console.log(`Validation: ${validation.passed ? "PASSED" : "FAILED"}`);
if (!validation.passed) console.log(validation.errors.join("\n"));

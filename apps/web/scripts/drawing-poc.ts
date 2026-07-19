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
import { validateLayoutGraphTopology } from "@/lib/drawing/layoutGraphValidator";
import type { DesignIntentGraph } from "@/lib/drawing/designIntentGraph";
import type { LayoutGraph } from "@/lib/drawing/layoutGraph";

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

  // Stage 1.6, Task 2/3 — WC không còn là "khe hẹp" (đã 4.25:1 ở Stage 1.5).
  const wcRoom = sheet.floorPlan.rooms.find((r) => r.type === "wc");
  if (wcRoom) {
    const xs = wcRoom.polygon.map((p) => p.x);
    const ys = wcRoom.polygon.map((p) => p.y);
    const w = Math.max(...xs) - Math.min(...xs);
    const d = Math.max(...ys) - Math.min(...ys);
    const ratio = Math.max(w, d) / Math.min(w, d);
    check("WC không còn tỷ lệ khe hẹp (< 2.5:1)", ratio < 2.5, `${ratio.toFixed(2)}:1`);
  }

  check("có title block + disclaimer", sheet.titleBlock.disclaimer.length > 0);
  check("có ít nhất 1 wall exterior", sheet.floorPlan.walls.some((w) => w.type === "exterior"));
  check("có ít nhất 1 wall interior", sheet.floorPlan.walls.some((w) => w.type === "interior"));

  // Stage 1.5, Task 4 — Door phải là dữ liệu tường minh, mọi cửa phải
  // tham chiếu wall có thật và width dương.
  check("có Door được đặt (không chỉ cạnh ngữ nghĩa)", sheet.floorPlan.doors.length > 0);
  const wallIds = new Set(sheet.floorPlan.walls.map((w) => w.id));
  check(
    "mọi Door tham chiếu wall có thật",
    sheet.floorPlan.doors.every((d) => wallIds.has(d.wallId)),
  );
  check(
    "mọi Door có width dương",
    sheet.floorPlan.doors.every((d) => d.width > 0),
  );

  const svg = renderFloorPlanToSvg(sheet);
  check("SVG sinh được, không rỗng", svg.includes("<svg") && svg.length > 200);
  check("SVG có vẽ cửa (không chỉ tường liền mạch)", svg.includes("stroke-dasharray"));
  // Stage 1.6, Task 4 — cửa phải có lá cửa (line) + vòng cung mở (path arc),
  // và số đoạn wall phải NHIỀU HƠN số wall gốc (đã bị cắt khe hở tại cửa).
  check("SVG có vẽ vòng cung mở cửa (path arc)", svg.includes("<path"));
  const wallSegmentCount = (svg.match(/stroke-width="(3|1\.5)"/g) ?? []).length;
  check(
    "Wall bị cắt khe hở tại vị trí cửa (nhiều đoạn hơn số wall + door)",
    wallSegmentCount > sheet.floorPlan.walls.length,
    `${wallSegmentCount} đoạn vs ${sheet.floorPlan.walls.length} wall gốc`,
  );

  // Stage 1.7, Task 6 — viewBox PHẢI đúng tỷ lệ A4 cố định (595x842),
  // không còn "vẽ khít nội dung rồi width:100%" như Stage 1.6.
  check("SVG viewBox đúng khổ A4 cố định (0 0 595 842)", svg.includes('viewBox="0 0 595 842"'), svg.match(/viewBox="[^"]*"/)?.[0]);

  // Stage 1.7, Task 5 — Window model: mọi phòng living/kitchen/bedroom có
  // cạnh chạm tường ngoài phải có cửa sổ, tham chiếu đúng wall exterior.
  check("có Window được đặt", sheet.floorPlan.windows.length > 0, `số lượng: ${sheet.floorPlan.windows.length}`);
  const exteriorWallIds = new Set(sheet.floorPlan.walls.filter((w) => w.type === "exterior").map((w) => w.id));
  check(
    "mọi Window tham chiếu 1 exterior wall có thật",
    sheet.floorPlan.windows.every((w) => exteriorWallIds.has(w.wallId)),
  );
  const eligibleRoomIds = sheet.floorPlan.rooms
    .filter((r) => ["living", "kitchen", "bedroom"].includes(r.type))
    .map((r) => r.id);
  const roomIdsWithWindow = new Set(sheet.floorPlan.windows.map((w) => w.roomId));
  check(
    "living/bếp/mọi phòng ngủ đều có cửa sổ (có tường ngoài đủ điều kiện)",
    eligibleRoomIds.every((id) => roomIdsWithWindow.has(id)),
    `thiếu: ${eligibleRoomIds.filter((id) => !roomIdsWithWindow.has(id)).join(", ") || "không"}`,
  );

  // Stage 1.7, Task 3 (positive case) — circulation phải chạm ĐƯỢC bếp
  // VÀ mọi phòng ngủ VÀ wc trực tiếp (không phải qua chain) — kiểm tra
  // qua chính wall list: phải có wall giữa circulation và từng loại.
  const circulationWalls = sheet.floorPlan.walls.filter((w) => w.betweenRoomIds?.includes("circulation"));
  const circulationNeighbors = new Set(
    circulationWalls.flatMap((w) => w.betweenRoomIds ?? []).filter((id) => id !== "circulation"),
  );
  check(
    "circulation chạm trực tiếp bếp + cả 2 phòng ngủ + wc (không qua chain)",
    ["kitchen", "bedroom-1", "bedroom-2", "wc-1"].every((id) => circulationNeighbors.has(id)),
    `circulation chạm: ${[...circulationNeighbors].join(", ")}`,
  );

  // Stage 1.7, Task 3 — regression test bắt buộc (Tech Lead Review,
  // Stage 1.6 "Not Accepted"): tô-pô cũ "entrance -> living -> kitchen ->
  // bedroom-2 -> wc" (WC chỉ tới được bằng cách đi xuyên qua bedroom-2)
  // PHẢI bị chặn ở validateLayoutGraphTopology() — không được để lọt tới
  // Geometry Solver. Đây chính là lỗi kiến trúc thật đã xảy ra ở Stage
  // 1.6 trước khi sửa.
  const invalidDig: DesignIntentGraph = {
    buildingContext: { frontage: 6, depth: 10, floors: 1, roofType: null, architecturalStyle: null },
    floors: [
      {
        level: 0,
        spaces: [
          { id: "entrance", type: "entrance", zone: "public", areaWeight: 0, facadeExposure: [] },
          { id: "living", type: "living", zone: "public", areaWeight: 1.4, facadeExposure: [] },
          { id: "kitchen", type: "kitchen", zone: "public", areaWeight: 1.0, facadeExposure: [] },
          { id: "bedroom-2", type: "bedroom", zone: "private", areaWeight: 1.0, facadeExposure: [] },
          { id: "wc", type: "wc", zone: "service", areaWeight: 0.5, facadeExposure: [] },
        ],
      },
    ],
    relationships: [
      { type: "connection", from: "entrance", to: "living" },
      { type: "connection", from: "living", to: "kitchen" },
      { type: "connection", from: "kitchen", to: "bedroom-2" },
      { type: "connection", from: "bedroom-2", to: "wc" },
    ],
  };
  const invalidLayoutGraph: LayoutGraph = {
    envelope: { frontage: 6, depth: 10 },
    nodes: invalidDig.floors[0].spaces.map((s) => ({ id: s.id, type: s.type, floor: 0, priority: 0, areaWeight: s.areaWeight })),
    edges: invalidDig.relationships.map((r) => ({ type: "door" as const, from: r.from, to: r.to })),
  };
  const invalidResult = validateLayoutGraphTopology(invalidDig, invalidLayoutGraph);
  check(
    "REGRESSION: tô-pô 'wc chỉ tới qua bedroom-2' bị chặn (không lọt tới Geometry)",
    !invalidResult.passed,
    invalidResult.passed ? "validator KHÔNG phát hiện lỗi — regression!" : invalidResult.errors.join("; "),
  );

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

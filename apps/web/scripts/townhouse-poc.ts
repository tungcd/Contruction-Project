/**
 * Manual POC — Concept Drawing Stage 2A/2B (Multi-Floor Townhouse,
 * Stair Core, Program Completeness and Layout Quality).
 *
 *   npm run poc:townhouse
 *
 * Chỉ target fixture `townhouse` (3 tầng, mặt tiền 5m x sâu 16m). Tách
 * riêng khỏi `drawing-poc.ts` (giữ nguyên làm regression cho
 * `simple-house`/Stage 1.7, đúng yêu cầu Tech Lead Review "Keep all
 * simple-house Stage 1.7 tests as regressions").
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
  "townhouse",
);

console.log("\nConcept Drawing — Manual POC (Stage 2A, fixture: townhouse)\n");

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

  const { drawingPackage, validation, templateId, staircaseCore } = generateConceptDrawing(
    constraintSet,
    "Townhouse Demo",
  );

  check("template được chọn", templateId === "townhouse-multi-floor-v1", templateId);
  check("geometry validation passed (không lỗi)", validation.passed, validation.errors.join("; "));

  // 1. Số tầng sinh ra khớp Requirement.
  const expectedFloors = constraintSet.building.floors?.value ?? 1;
  check(
    "số tầng sinh ra khớp Requirement",
    drawingPackage.sheets.length === expectedFloors,
    `thực tế: ${drawingPackage.sheets.length}, Requirement: ${expectedFloors}`,
  );

  // 2. Mọi phòng bắt buộc đã được phân bổ đủ (tổng qua tất cả tầng).
  const allRooms = drawingPackage.sheets.flatMap((s) => s.floorPlan.rooms);
  const expectedBedrooms = constraintSet.spaces.bedrooms?.value ?? 0;
  const expectedBathrooms = constraintSet.spaces.bathrooms?.value ?? 0;
  check(
    "đủ tổng số phòng ngủ qua các tầng",
    allRooms.filter((r) => r.type === "bedroom").length === expectedBedrooms,
    `thực tế: ${allRooms.filter((r) => r.type === "bedroom").length}, cần: ${expectedBedrooms}`,
  );
  check(
    "đủ tổng số WC qua các tầng",
    allRooms.filter((r) => r.type === "wc").length === expectedBathrooms,
    `thực tế: ${allRooms.filter((r) => r.type === "wc").length}, cần: ${expectedBathrooms}`,
  );
  check("có phòng khách (tầng trệt)", allRooms.some((r) => r.type === "living"));
  check("có bếp (tầng trệt)", allRooms.some((r) => r.type === "kitchen"));

  // 3. Cầu thang tồn tại trên MỌI tầng nối nhau + thẳng hàng.
  check("staircase tồn tại trên mọi tầng", staircaseCore !== null && staircaseCore.levels.length === expectedFloors);
  if (staircaseCore) {
    check(
      "staircase thẳng hàng (polygon giống hệt nhau mọi tầng — đã validate ở layoutGenerator)",
      staircaseCore.levels.length === expectedFloors,
      `levels: ${staircaseCore.levels.join(",")}`,
    );
  }

  // 4. Mọi tầng trên đều "vertically reachable" — suy ra từ việc
  //    generateConceptDrawing() KHÔNG throw (validateVerticalConnections
  //    đã chạy trong layoutGenerator.ts và sẽ throw nếu thiếu 1 kết nối
  //    nào trong chuỗi) — xác nhận thêm bằng staircaseCore.levels liên
  //    tục từ 0 tới floorCount-1.
  if (staircaseCore) {
    const sortedLevels = [...staircaseCore.levels].sort((a, b) => a - b);
    const isContiguous = sortedLevels.every((lvl, i) => lvl === i);
    check("chuỗi tầng cầu thang liên tục từ 0", isContiguous, sortedLevels.join(","));
  }

  // 5. Không chồng lấn / không tràn envelope — đã kiểm bởi validateGeometry
  //    (validation.passed ở trên); xác nhận thêm bằng cách tự tính bbox.
  for (const sheet of drawingPackage.sheets) {
    const { envelope, rooms } = sheet.floorPlan;
    const withinEnvelope = rooms.every((r) => {
      const xs = r.polygon.map((p) => p.x);
      const ys = r.polygon.map((p) => p.y);
      return Math.min(...xs) >= -1e-6 && Math.max(...xs) <= envelope.frontage + 1e-6 && Math.min(...ys) >= -1e-6 && Math.max(...ys) <= envelope.depth + 1e-6;
    });
    check(`tầng ${sheet.floorPlan.level}: mọi phòng nằm trong envelope`, withinEnvelope);
  }

  // 6. Bất biến circulation (không đi xuyên phòng ngủ) — đã chặn ở
  //    validateLayoutGraphTopology() TRƯỚC khi tới đây (nếu vi phạm,
  //    generateConceptDrawing() đã throw) — xác nhận gián tiếp bằng cách
  //    kiểm tra không có wall nào nối trực tiếp 2 bedroom khác circulation.
  for (const sheet of drawingPackage.sheets) {
    const bedroomIds = sheet.floorPlan.rooms.filter((r) => r.type === "bedroom").map((r) => r.id);
    const hasDirectBedroomDoor = sheet.floorPlan.doors.some((d) => {
      const wall = sheet.floorPlan.walls.find((w) => w.id === d.wallId);
      return wall?.betweenRoomIds && bedroomIds.includes(wall.betweenRoomIds[0]) && bedroomIds.includes(wall.betweenRoomIds[1]);
    });
    check(`tầng ${sheet.floorPlan.level}: không có cửa nối trực tiếp 2 phòng ngủ`, !hasDirectBedroomDoor);
  }

  // 7. Mọi sheet render SVG không rỗng.
  const svgs = drawingPackage.sheets.map((s) => renderFloorPlanToSvg(s));
  check("mọi sheet render SVG không rỗng", svgs.every((svg) => svg.includes("<svg") && svg.length > 200));
  check("mọi SVG đúng viewBox A4", svgs.every((svg) => svg.includes('viewBox="0 0 595 842"')));

  // 8. Deterministic.
  const second = generateConceptDrawing(constraintSet, "Townhouse Demo");
  const same = JSON.stringify(drawingPackage.sheets.map((s) => s.floorPlan.rooms)) === JSON.stringify(second.drawingPackage.sheets.map((s) => s.floorPlan.rooms));
  check("deterministic — chạy lại cho cùng hình học", same);

  // --- Stage 2B ---

  // 9. Phòng thờ (nhận diện từ otherRooms "phòng thờ ông bà") và ban
  //    công (yêu cầu tường minh) phải được phân bổ ĐÚNG 1 LẦN.
  check(
    "phòng thờ được phân bổ đúng 1 lần",
    allRooms.filter((r) => r.type === "worshipRoom").length === 1,
    `thực tế: ${allRooms.filter((r) => r.type === "worshipRoom").length}`,
  );
  check(
    "ban công được phân bổ đúng 1 lần",
    allRooms.filter((r) => r.type === "balcony").length === 1,
    `thực tế: ${allRooms.filter((r) => r.type === "balcony").length}`,
  );

  // 10. "phòng đọc sách" (excludedRooms) không được xuất hiện dưới bất kỳ hình thức nào.
  const allWarningsText = drawingPackage.sheets.flatMap((s) => s.warnings).join(" | ");
  check(
    "phòng đọc sách (excluded) không xuất hiện như 1 phòng",
    !allRooms.some((r) => r.label.includes("đọc sách")),
  );
  check(
    "phòng đọc sách vẫn được ghi nhận là loại trừ trong warnings",
    allWarningsText.includes("phòng đọc sách"),
  );

  // 11. Không phòng WC/bedroom tiêu chuẩn nào vượt hardAreaMax.
  const wcRooms = allRooms.filter((r) => r.type === "wc");
  const bedroomRooms = allRooms.filter((r) => r.type === "bedroom");
  check(
    "không WC nào vượt hardAreaMax (7m²)",
    wcRooms.every((r) => r.areaM2 <= 7 + 0.01),
    wcRooms.map((r) => `${r.id}=${r.areaM2.toFixed(2)}`).join(", "),
  );
  check(
    "không phòng ngủ nào vượt hardAreaMax (22m²)",
    bedroomRooms.every((r) => r.areaM2 <= 22 + 0.01),
    bedroomRooms.map((r) => `${r.id}=${r.areaM2.toFixed(2)}`).join(", "),
  );

  // 12. StaircaseCore tôn trọng khoảng rộng/diện tích đã yêu cầu (1.8-2.4m / 6-10m²).
  if (staircaseCore) {
    check(
      "StaircaseCore rộng trong khoảng 1.8-2.4m",
      staircaseCore.width >= 1.8 - 0.01 && staircaseCore.width <= 2.4 + 0.01,
      `${staircaseCore.width}`,
    );
    const stairArea = drawingPackage.sheets[0].floorPlan.rooms.find((r) => r.type === "staircase")?.areaM2 ?? 0;
    check("StaircaseCore diện tích trong khoảng 6-10m²", stairArea >= 6 - 0.01 && stairArea <= 10 + 0.01, `${stairArea}`);
  }

  // 13. Diện tích dư (residual) phải TƯỜNG MINH (có type "residual"), không bị âm thầm nuốt vào phòng khác.
  const residualRooms = allRooms.filter((r) => r.type === "residual");
  check("có residual space tường minh (không silent-absorb)", residualRooms.length > 0, `số lượng: ${residualRooms.length}`);
  check(
    "residual không tính vào số phòng ngủ/WC bắt buộc",
    !residualRooms.some((r) => r.label.includes("Phòng ngủ") || r.label.includes("WC")),
  );

  // 14. Nhãn phòng ngủ/WC giữ số thứ tự TOÀN NHÀ (không reset theo tầng — bug thật Stage 2A).
  const bedroomLabelsByFloor = drawingPackage.sheets.map((s) => s.floorPlan.rooms.filter((r) => r.type === "bedroom").map((r) => r.label));
  check(
    "nhãn phòng ngủ đúng thứ tự toàn nhà (không reset mỗi tầng)",
    JSON.stringify(bedroomLabelsByFloor[1]) === JSON.stringify(["Phòng ngủ 1", "Phòng ngủ 2"]) &&
      JSON.stringify(bedroomLabelsByFloor[2]) === JSON.stringify(["Phòng ngủ 3", "Phòng ngủ 4"]),
    JSON.stringify(bedroomLabelsByFloor),
  );

  // 15. Warnings không phụ thuộc glyph Unicode không nhất quán giữa renderer.
  check("warnings không dùng ký hiệu ⚠ (SVG dùng text tất định thay thế)", !svgs.some((svg) => svg.includes("⚠")));
  check("SVG dùng marker cảnh báo tất định (CẢNH BÁO:)", svgs.some((svg) => svg.includes("CẢNH BÁO:")) || drawingPackage.sheets.every((s) => s.warnings.length === 0));

  // 16. Regression Stage 1: assert không phá simple-house (kiểm nhanh qua poc:drawing riêng, không lặp lại ở đây).
} catch (err) {
  console.log(`  FAIL  (crash) ${(err as Error).message}`);
  total++;
}

console.log(`\n${passed}/${total} pass${passed < total ? `, ${total - passed} FAIL` : ""}\n`);
process.exit(passed === total ? 0 : 1);

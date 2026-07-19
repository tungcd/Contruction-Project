import type { ConstraintSet } from "@acc/shared-types";
import { generateLayout } from "./layoutGenerator";
import { deriveWalls, type Wall } from "./wall";
import { placeDoors } from "./door";
import type { Door } from "./door";
import { placeWindows } from "./window";
import type { Window } from "./window";
import { validateGeometry, validateAggregateRoomCounts, type GeometryValidationResult } from "./geometryValidator";
import { buildDrawingPackage, type DrawingPackage } from "./drawingDocument";
import type { LayoutGraph } from "./layoutGraph";
import type { Geometry } from "./geometry";
import type { StaircaseCore } from "./staircase";

/**
 * Entry point DUY NHẤT cho pipeline Constraint Set -> Drawing Package.
 * Điều phối đúng thứ tự đã chốt: Design Intent Graph -> Layout Graph (1
 * MỖI TẦNG, Stage 2A) -> Geometry -> Wall (derived) -> Door/Window
 * (derived) -> Geometry Validation (per-floor + tổng hợp) -> Drawing
 * Document (nhiều sheet, 1/tầng).
 *
 * QUAN TRỌNG: đây là nơi DUY NHẤT được phép gọi tuần tự các bước trên —
 * script/trang nào cần Drawing Package (hoặc cần cả dữ liệu trung gian
 * để debug/export) PHẢI gọi hàm này, KHÔNG tự lặp lại chuỗi gọi. Bài học
 * thật từ Stage 1.6: `generate-drawing-artifacts.ts` từng tự gọi lại
 * đúng các bước này thay vì dùng hàm này, và bị thiếu
 * `validation.warnings` khi hàm này được cập nhật — lỗi 2-nơi-cùng-1-
 * logic kinh điển đã cảnh báo nhiều lần trong dự án.
 */

export interface ConceptDrawingResult {
  drawingPackage: DrawingPackage;
  validation: GeometryValidationResult;
  templateId: string;
  staircaseCore: StaircaseCore | null;
  /** Dữ liệu trung gian — chỉ để debug/export artifact, KHÔNG dùng để tính lại gì (đã tính đủ trong drawingPackage). */
  intermediates: { layoutGraphs: LayoutGraph[]; geometry: Geometry; walls: Wall[]; doors: Door[]; windows: Window[] };
}

export function generateConceptDrawing(
  constraintSet: ConstraintSet,
  projectName: string,
): ConceptDrawingResult {
  const { templateId, layoutGraphs, geometry, staircaseCore, warnings } = generateLayout(constraintSet);

  // Wall/Window đã multi-floor-safe nội bộ (lặp theo `geometry.floors`,
  // lọc theo id tiền tố `wall-${level}-` — xem window.ts) nên gọi 1 LẦN
  // trên dữ liệu đã gộp mọi tầng. Door thì CHƯA (nhận đúng 1 LayoutGraph
  // đơn tầng) nên phải gọi RIÊNG cho từng tầng, dùng đúng walls của tầng
  // đó (lọc theo tiền tố), rồi gộp lại — mỗi tầng có `idPrefix` riêng để
  // id cửa không trùng nhau giữa các tầng.
  const walls = deriveWalls(geometry);
  const doors: Door[] = [];
  const doorWarnings: string[] = [];
  for (const layoutGraph of layoutGraphs) {
    const level = layoutGraph.nodes[0]?.floor ?? 0;
    const wallsOnFloor = walls.filter((w) => w.id.startsWith(`wall-${level}-`));
    const result = placeDoors(layoutGraph, wallsOnFloor, `f${level}-`);
    doors.push(...result.doors);
    doorWarnings.push(...result.warnings.map((w) => `[Tầng ${level}] ${w}`));
  }
  const { windows, warnings: windowWarnings } = placeWindows(geometry, walls, doors, layoutGraphs[0].envelope);

  // Validation: mỗi tầng tự kiểm (diện tích/chồng lấn/cửa-tường nhất
  // quán) với ĐÚNG layoutGraph/walls/doors/windows của riêng nó
  // (checkAggregateCounts=false — số phòng ngủ/wc là tổng TOÀN NHÀ,
  // không so khớp được với 1 tầng riêng lẻ); sau đó kiểm tổng số phòng
  // MỘT LẦN trên Geometry đã gộp tất cả tầng.
  const perFloorErrors: string[] = [];
  const perFloorWarnings: string[] = [];
  for (const layoutGraph of layoutGraphs) {
    const level = layoutGraph.nodes[0]?.floor ?? 0;
    const floorGeometry: Geometry = { floors: geometry.floors.filter((f) => f.level === level) };
    const wallsOnFloor = walls.filter((w) => w.id.startsWith(`wall-${level}-`));
    const doorsOnFloor = doors.filter((d) => wallsOnFloor.some((w) => w.id === d.wallId));
    const windowsOnFloor = windows.filter((w) => wallsOnFloor.some((wall) => wall.id === w.wallId));
    const result = validateGeometry(
      floorGeometry,
      layoutGraph,
      wallsOnFloor,
      doorsOnFloor,
      constraintSet,
      windowsOnFloor,
      false,
    );
    perFloorErrors.push(...result.errors.map((e) => `[Tầng ${level}] ${e}`));
    perFloorWarnings.push(...result.warnings.map((w) => `[Tầng ${level}] ${w}`));
  }
  const aggregateErrors = validateAggregateRoomCounts(geometry, constraintSet);
  const validation = { passed: perFloorErrors.length === 0 && aggregateErrors.length === 0, errors: [...perFloorErrors, ...aggregateErrors], warnings: perFloorWarnings };

  const drawingPackage = buildDrawingPackage(
    geometry,
    walls,
    doors,
    windows,
    projectName,
    [...warnings, ...doorWarnings, ...windowWarnings, ...validation.errors, ...validation.warnings],
    layoutGraphs[0].envelope,
  );

  return {
    drawingPackage,
    validation,
    templateId,
    staircaseCore,
    intermediates: { layoutGraphs, geometry, walls, doors, windows },
  };
}

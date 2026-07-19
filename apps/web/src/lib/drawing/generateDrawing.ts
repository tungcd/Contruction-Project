import type { ConstraintSet } from "@acc/shared-types";
import { generateLayout } from "./layoutGenerator";
import { deriveWalls, type Wall } from "./wall";
import { placeDoors } from "./door";
import type { Door } from "./door";
import { validateGeometry, type GeometryValidationResult } from "./geometryValidator";
import { buildDrawingPackage, type DrawingPackage } from "./drawingDocument";
import type { LayoutGraph } from "./layoutGraph";
import type { Geometry } from "./geometry";

/**
 * Entry point DUY NHẤT cho pipeline Constraint Set -> Drawing Package
 * (Stage 1/1.5/1.6). Điều phối đúng thứ tự đã chốt: Design Intent Graph
 * -> Layout Graph -> Geometry -> Wall (derived) -> Door (derived) ->
 * Geometry Validation -> Drawing Document.
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
  /** Dữ liệu trung gian — chỉ để debug/export artifact, KHÔNG dùng để tính lại gì (đã tính đủ trong drawingPackage). */
  intermediates: { layoutGraph: LayoutGraph; geometry: Geometry; walls: Wall[]; doors: Door[] };
}

export function generateConceptDrawing(
  constraintSet: ConstraintSet,
  projectName: string,
): ConceptDrawingResult {
  const { templateId, layoutGraph, geometry, warnings } = generateLayout(constraintSet);
  const walls = deriveWalls(geometry);
  const { doors, warnings: doorWarnings } = placeDoors(layoutGraph, walls);
  const validation = validateGeometry(geometry, layoutGraph, walls, doors, constraintSet);
  const drawingPackage = buildDrawingPackage(
    geometry,
    walls,
    doors,
    projectName,
    [...warnings, ...doorWarnings, ...validation.errors, ...validation.warnings],
    layoutGraph.envelope,
  );

  return { drawingPackage, validation, templateId, intermediates: { layoutGraph, geometry, walls, doors } };
}

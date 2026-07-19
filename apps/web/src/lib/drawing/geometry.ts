import type { LayoutGraph, LayoutNode } from "./layoutGraph";
import { constraintFor } from "./roomConstraints";

/**
 * Geometry — Point[] polygon thay vì x/y/width/height (Tech Lead Review
 * mục 3): rectangle là trường hợp riêng của polygon, tránh breaking
 * change khi sau này hỗ trợ đất/phòng không phải hình chữ nhật.
 *
 * Geometry Solver CHỈ đọc LayoutGraph (tô-pô đã quyết định sẵn) — không
 * tự suy diễn quan hệ nào ("Geometry should only realize topology").
 * Chiến lược Stage 1: "sequential bar layout" — nhóm node theo
 * `priority` thành các dải ngang xếp chồng theo chiều sâu đất; dải
 * CUỐI CÙNG (nhiều node cùng priority cao nhất) chia đều chiều rộng
 * theo `areaWeight`. Thuật toán không biết "living"/"bedroom" là gì —
 * chỉ dùng priority/areaWeight, nên dùng lại được cho template khác có
 * cùng hình dạng tuyến tính.
 */

/**
 * COORDINATE & UNIT CONTRACT (Tech Lead Review — Stage 1.5, Task 2)
 * — bắt buộc mọi module trong `lib/drawing/` tuân theo, không được lẫn
 * lộn với đơn vị pixel của SVG:
 *
 * - Đơn vị domain: MÉT (m). Mọi `Point`, `Geometry`, `Wall`, `Door` đều
 *   ở đơn vị mét — KHÔNG module nào ngoài `svgRenderer.ts` được biết
 *   tới pixel.
 * - Gốc toạ độ (0,0) = góc trái-mặt tiền của envelope (góc nhìn từ
 *   đường vào công trình).
 * - Trục X tăng dọc theo mặt tiền (frontage), từ trái sang phải khi
 *   đứng ngoài nhìn vào.
 * - Trục Y tăng theo chiều sâu đất (depth), từ mặt tiền vào phía sau.
 * - Sai số dung sai (tolerance) cho so sánh hình học: `GEOMETRY_EPS`
 *   (1e-6 m) — dùng thống nhất ở `wall.ts`/`geometryValidator.ts`.
 * - Diện tích luôn tính từ toạ độ domain CHƯA làm tròn.
 * - Làm tròn CHỈ áp dụng khi hiển thị (dimension label `.toFixed(1)`,
 *   xem `drawingDocument.ts`) — không làm tròn trước khi tính toán.
 * - Quy đổi sang pixel (`SCALE`, `MARGIN`) chỉ xảy ra trong
 *   `svgRenderer.ts`, là bước cuối cùng, một chiều (domain -> pixel),
 *   không có module nào đọc ngược pixel về domain.
 */
export const GEOMETRY_EPS = 1e-6;

export interface Point {
  x: number;
  y: number;
}

export interface GeometrySpace {
  id: string;
  type: string;
  polygon: Point[]; // Stage 1: luôn 4 điểm (hình chữ nhật), theo chiều kim đồng hồ
}

export interface Geometry {
  floors: {
    level: number;
    spaces: GeometrySpace[];
  }[];
}

export class GeometrySolverError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeometrySolverError";
  }
}

function rect(x0: number, y0: number, x1: number, y1: number): Point[] {
  return [
    { x: x0, y: y0 },
    { x: x1, y: y0 },
    { x: x1, y: y1 },
    { x: x0, y: y1 },
  ];
}

const DEFAULT_TARGET_ASPECT_RATIO = 1.3;

/** Tỷ lệ khung hình mục tiêu (điểm giữa preferred min/max) cho 1 loại phòng. */
function targetAspectRatio(type: string): number {
  const c = constraintFor(type);
  if (!c) return DEFAULT_TARGET_ASPECT_RATIO;
  return (c.preferredAspectRatioMin + c.preferredAspectRatioMax) / 2;
}

/**
 * Đặt hình cho 1 dải (tier) rộng `frontage`, sâu `tierDepth`.
 *
 * - 1 node: chiếm trọn dải (như cũ).
 * - 2 node: chia rộng theo areaWeight (như cũ — đã cho tỷ lệ ổn với 2 node).
 * - >=3 node (Stage 1.6, Task 3 — sửa lỗi WC "khe hẹp" 4.25:1 đã phát
 *   hiện ở Stage 1.5): 1 node NẶNG NHẤT đứng riêng 1 cột (chiếm trọn
 *   chiều sâu dải), các node còn lại dồn vào 1 cột thứ 2, chia chiều sâu
 *   theo areaWeight bên trong cột đó. Chiều rộng mỗi cột tính từ tỷ lệ
 *   khung hình MỤC TIÊU của từng phòng (không phải areaWeight thô) rồi
 *   chuẩn hoá (normalize) để tổng đúng bằng `frontage` — lý do: cột chỉ
 *   có 1 phòng phải "gánh" trọn chiều sâu dải, cần rộng hơn tỷ lệ
 *   areaWeight thuần mới ra tỷ lệ khung hình hợp lý (xem
 *   23_Completion-Report-Concept-Drawing-Stage1.5.md — phân tích lỗi).
 */
function placeTierRow(
  tier: LayoutNode[],
  frontage: number,
  tierDepth: number,
  y0: number,
): GeometrySpace[] {
  if (tier.length === 1) {
    return [{ id: tier[0].id, type: tier[0].type, polygon: rect(0, y0, frontage, y0 + tierDepth) }];
  }

  if (tier.length === 2) {
    const tierWeight = tier[0].areaWeight + tier[1].areaWeight;
    let xCursor = 0;
    return tier.map((node) => {
      const width = (node.areaWeight / tierWeight) * frontage;
      const space = { id: node.id, type: node.type, polygon: rect(xCursor, y0, xCursor + width, y0 + tierDepth) };
      xCursor += width;
      return space;
    });
  }

  // >= 3 node: 1 node nặng nhất đứng riêng cột A, phần còn lại dồn cột B.
  const sorted = [...tier].sort((a, b) => b.areaWeight - a.areaWeight);
  const anchor = sorted[0];
  const rest = tier.filter((n) => n.id !== anchor.id); // giữ nguyên thứ tự gốc trong cột B, deterministic

  const restWeight = rest.reduce((s, n) => s + n.areaWeight, 0);
  const idealWidthA = tierDepth / targetAspectRatio(anchor.type);
  const restIdealWidths = rest.map((n) => {
    const subDepth = (n.areaWeight / restWeight) * tierDepth;
    return subDepth / targetAspectRatio(n.type);
  });
  // Lấy MAX (không phải trung bình): cột B dùng chung 1 chiều rộng cho
  // mọi phòng xếp chồng trong đó — nếu lấy trung bình, phòng cần rộng
  // nhất (thường là bedroom) bị thiếu hụt so với nhu cầu thật, còn phòng
  // cần ít hơn (thường là wc) chỉ bị "vuông hơn mục tiêu" — không vi
  // phạm gì (aspectRatioOf luôn >= 1, "quá vuông" không phải lỗi, chỉ
  // "quá dẹt" mới vi phạm preferred/hardAspectRatioMax) — nên ưu tiên
  // đáp ứng đúng phòng cần rộng nhất.
  const idealWidthB = Math.max(...restIdealWidths);

  const scale = frontage / (idealWidthA + idealWidthB);
  const widthA = idealWidthA * scale;
  const widthB = idealWidthB * scale;

  const spaces: GeometrySpace[] = [
    { id: anchor.id, type: anchor.type, polygon: rect(0, y0, widthA, y0 + tierDepth) },
  ];
  let subY = y0;
  for (const n of rest) {
    const subDepth = (n.areaWeight / restWeight) * tierDepth;
    spaces.push({ id: n.id, type: n.type, polygon: rect(widthA, subY, widthA + widthB, subY + subDepth) });
    subY += subDepth;
  }
  return spaces;
}

export function solveGeometry(layoutGraph: LayoutGraph, level = 0): Geometry {
  const { envelope } = layoutGraph;
  // entrance (areaWeight = 0) không chiếm diện tích — loại khỏi packing.
  const placeable = layoutGraph.nodes.filter((n) => n.areaWeight > 0);
  if (placeable.length === 0) {
    throw new GeometrySolverError("Không có phòng nào để đặt hình học (LayoutGraph rỗng).");
  }

  const tiers = groupByPriority(placeable);
  const totalWeight = placeable.reduce((s, n) => s + n.areaWeight, 0);

  const spaces: GeometrySpace[] = [];
  let yCursor = 0;
  tiers.forEach((tier, tierIndex) => {
    const isLastTier = tierIndex === tiers.length - 1;
    const tierWeight = tier.reduce((s, n) => s + n.areaWeight, 0);
    const tierDepth = (tierWeight / totalWeight) * envelope.depth;
    const yNext = isLastTier ? envelope.depth : yCursor + tierDepth;

    spaces.push(...placeTierRow(tier, envelope.frontage, yNext - yCursor, yCursor));
    yCursor = yNext;
  });

  return { floors: [{ level, spaces }] };
}

function groupByPriority(nodes: LayoutNode[]): LayoutNode[][] {
  const byPriority = new Map<number, LayoutNode[]>();
  for (const n of nodes) {
    const arr = byPriority.get(n.priority) ?? [];
    arr.push(n);
    byPriority.set(n.priority, arr);
  }
  return [...byPriority.entries()].sort(([a], [b]) => a - b).map(([, v]) => v);
}

import type { LayoutGraph, LayoutNode } from "./layoutGraph";

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

    if (tier.length === 1) {
      spaces.push({
        id: tier[0].id,
        type: tier[0].type,
        polygon: rect(0, yCursor, envelope.frontage, yNext),
      });
    } else {
      // Nhiều node cùng priority trong 1 dải — chia chiều rộng theo areaWeight.
      let xCursor = 0;
      for (const node of tier) {
        const width = (node.areaWeight / tierWeight) * envelope.frontage;
        spaces.push({
          id: node.id,
          type: node.type,
          polygon: rect(xCursor, yCursor, xCursor + width, yNext),
        });
        xCursor += width;
      }
    }
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

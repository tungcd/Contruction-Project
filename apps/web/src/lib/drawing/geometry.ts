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

/** Chiều rộng cố định của hành lang/sảnh (circulation) — không suy ra từ
 *  areaWeight (circulation không phải phòng khách hàng yêu cầu, xem
 *  designIntentGraph.ts), mà là 1 hằng số kích thước hành lang tối
 *  thiểu thông thường trong nhà ở dân dụng. */
const CIRCULATION_WIDTH = 1.0; // m

/**
 * Đặt hình cho 1 dải (tier) rộng `frontage`, sâu `tierDepth`.
 *
 * - 1 node: chiếm trọn dải (như cũ).
 * - 2 node: chia rộng theo areaWeight (như cũ — đã cho tỷ lệ ổn với 2 node).
 * - >=3 node, KHÔNG có circulation trong dải: 1 node NẶNG NHẤT đứng
 *   riêng 1 cột (chiếm trọn chiều sâu dải), các node còn lại dồn vào 1
 *   cột thứ 2, chia chiều sâu theo areaWeight bên trong cột đó. Chiều
 *   rộng mỗi cột tính từ tỷ lệ khung hình MỤC TIÊU của từng phòng rồi
 *   chuẩn hoá để tổng đúng bằng `frontage` (giữ lại cho tier khác không
 *   cần circulation — xem 23_...Stage1.5.md).
 * - Dải CÓ circulation (Stage 1.7, Task 2): xem `placeTierRowWithCirculation`.
 */
function placeTierRow(
  tier: LayoutNode[],
  frontage: number,
  tierDepth: number,
  y0: number,
): GeometrySpace[] {
  const circulation = tier.find((n) => n.type === "circulation");
  if (circulation) {
    const rest = tier.filter((n) => n.id !== circulation.id);
    return placeTierRowWithCirculation(circulation, rest, frontage, tierDepth, y0);
  }

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

/**
 * Dải có circulation (Stage 1.7, Task 2 — hiện thực hoá đúng tô-pô hub
 * "circulation nối mọi phòng còn lại" đã khai báo ở designIntentGraph.ts,
 * KHÔNG suy diễn ngược): circulation đặt thành 1 cột hẹp CHẠY SUỐT
 * chiều sâu dải, nằm GIỮA 2 cột phòng còn lại — cột trái/phải đều có 1
 * cạnh chung với TOÀN BỘ chiều dài cột circulation, nên MỌI phòng xếp
 * chồng trong cột trái lẫn cột phải đều chạm circulation, bất kể xếp
 * ở vị trí nào trong cột (không như Stage 1.6, nơi chỉ phòng đầu cột
 * mới chạm hub). Nhờ vậy không cần "chain" — mọi phòng chạm circulation
 * là hub thật, đúng 1-đường-đi-duy-nhất đã khai báo.
 *
 * Chia node còn lại vào 2 cột theo round-robin (không phải nặng/nhẹ):
 * tránh dồn 2 phòng cùng loại nặng (vd 2 bedroom) vào cùng 1 cột khiến
 * cột kia quá hẹp cho phòng còn lại (đã thử và thấy hỏng khi tính tay).
 * 2 cột luôn CHIA ĐỀU chiều rộng còn lại (không theo areaWeight) — vì
 * chiều rộng cột cần đủ minWidth cho loại phòng bất kỳ rơi vào cột đó
 * (vd bedroom cần >=2.4m); areaWeight chỉ quyết định chiều SÂU của từng
 * phòng bên trong cột của nó.
 */
function placeTierRowWithCirculation(
  circulation: LayoutNode,
  rest: LayoutNode[],
  frontage: number,
  tierDepth: number,
  y0: number,
): GeometrySpace[] {
  if (rest.length === 0) {
    return [{ id: circulation.id, type: circulation.type, polygon: rect(0, y0, frontage, y0 + tierDepth) }];
  }
  const roomsAreaWidth = frontage - CIRCULATION_WIDTH;

  // Stage 2A — bài học thật từ fixture `townhouse` (mặt tiền 5m, hẹp hơn
  // NHIỀU so với `simple-house` 6m): round-robin 2 cột luôn (thiết kế
  // gốc Stage 1.7) khiến 1 cột chỉ có ĐÚNG 1 phòng khi rest.length lẻ
  // hoặc nhỏ (vd 2-3 phòng) — phòng đó "gánh" trọn chiều sâu dải trong
  // 1 cột hẹp, ra tỷ lệ quá dẹt (đo được thật: WC 3.36:1, vượt hard
  // 2.5:1). Với LÔ ĐẤT SÂU (townhouse depth=16m), xếp CHỒNG tất cả rest
  // vào 1 CỘT DUY NHẤT (rộng = roomsAreaWidth, không chia đôi) cho tỷ lệ
  // tốt hơn nhiều (mỗi phòng có bề rộng đủ, chiều sâu chia theo
  // areaWeight như bình thường). Chỉ chia 2 cột khi rest.length >= 4 (đủ
  // để mỗi cột có >=2 phòng, đã xác nhận đúng cho `simple-house`) —
  // "small fixed candidate catalog", không phải solver tổng quát.
  if (rest.length <= 3) {
    const spaces: GeometrySpace[] = [];
    const restWeight = rest.reduce((s, n) => s + n.areaWeight, 0);
    let subY = y0;
    for (const n of rest) {
      const subDepth = restWeight > 0 ? (n.areaWeight / restWeight) * tierDepth : tierDepth / rest.length;
      spaces.push({ id: n.id, type: n.type, polygon: rect(0, subY, roomsAreaWidth, subY + subDepth) });
      subY += subDepth;
    }
    spaces.push({
      id: circulation.id,
      type: circulation.type,
      polygon: rect(roomsAreaWidth, y0, frontage, y0 + tierDepth),
    });
    return spaces;
  }

  const colWidth = roomsAreaWidth / 2;
  const columns: LayoutNode[][] = [[], []];
  rest.forEach((n, i) => columns[i % 2].push(n));
  const colXStarts = [0, colWidth + CIRCULATION_WIDTH];

  const spaces: GeometrySpace[] = [];
  columns.forEach((col, colIndex) => {
    if (col.length === 0) return;
    const colWeight = col.reduce((s, n) => s + n.areaWeight, 0);
    let subY = y0;
    for (const n of col) {
      const subDepth = colWeight > 0 ? (n.areaWeight / colWeight) * tierDepth : tierDepth / col.length;
      spaces.push({
        id: n.id,
        type: n.type,
        polygon: rect(colXStarts[colIndex], subY, colXStarts[colIndex] + colWidth, subY + subDepth),
      });
      subY += subDepth;
    }
  });

  spaces.push({
    id: circulation.id,
    type: circulation.type,
    polygon: rect(colWidth, y0, colWidth + CIRCULATION_WIDTH, y0 + tierDepth),
  });
  return spaces;
}

/**
 * Chiều sâu cố định của cầu thang (Stage 2A, Task 2) — dải TRỌN CHIỀU
 * RỘNG mặt tiền, đặt ở cuối cùng (xa mặt tiền nhất) của MỌI tầng có cầu
 * thang. Vị trí tính THUẦN theo `envelope` (không phụ thuộc phòng nào
 * khác trên tầng đó) — đây chính là cách đảm bảo "Staircase footprint is
 * aligned across connected floors" (yêu cầu bắt buộc của Task 2): cùng
 * 1 envelope -> cùng 1 công thức -> cùng 1 polygon, không cần thuật toán
 * căn chỉnh chéo tầng nào khác. Chiều rộng = trọn mặt tiền là đơn giản
 * hoá có chủ đích (thực tế cầu thang thường hẹp hơn nhiều) — xem "Giới
 * hạn còn lại" trong Completion Report.
 */
const STAIRCASE_DEPTH = 3.0; // m

export function solveGeometry(layoutGraph: LayoutGraph, level = 0): Geometry {
  const { envelope } = layoutGraph;
  const staircaseNode = layoutGraph.nodes.find((n) => n.type === "staircase");
  const usableDepth = staircaseNode ? envelope.depth - STAIRCASE_DEPTH : envelope.depth;
  if (usableDepth <= 0) {
    throw new GeometrySolverError(
      `Chiều sâu đất (${envelope.depth}m) không đủ chỗ cho cầu thang (${STAIRCASE_DEPTH}m) + các phòng còn lại.`,
    );
  }

  // entrance là node ảo, không chiếm diện tích thật — loại khỏi packing.
  // circulation CŨNG có areaWeight=0 (không suy ra từ nhu cầu diện tích,
  // xem CIRCULATION_WIDTH) nhưng VẪN cần 1 polygon thật (Stage 1.7) — lọc
  // theo type thay vì areaWeight > 0 để không loại nhầm circulation.
  // staircase (nếu có) được đặt RIÊNG bên dưới, không qua thuật toán dải
  // như các phòng khác (xem STAIRCASE_DEPTH).
  const placeable = layoutGraph.nodes.filter((n) => n.type !== "entrance" && n.type !== "staircase");
  if (placeable.length === 0 && !staircaseNode) {
    throw new GeometrySolverError("Không có phòng nào để đặt hình học (LayoutGraph rỗng).");
  }

  const tiers = groupByPriority(placeable);
  const totalWeight = placeable.reduce((s, n) => s + n.areaWeight, 0);

  const spaces: GeometrySpace[] = [];
  let yCursor = 0;
  tiers.forEach((tier, tierIndex) => {
    const isLastTier = tierIndex === tiers.length - 1;
    const tierWeight = tier.reduce((s, n) => s + n.areaWeight, 0);
    const tierDepth = totalWeight > 0 ? (tierWeight / totalWeight) * usableDepth : 0;
    const yNext = isLastTier ? usableDepth : yCursor + tierDepth;

    spaces.push(...placeTierRow(tier, envelope.frontage, yNext - yCursor, yCursor));
    yCursor = yNext;
  });

  if (staircaseNode) {
    spaces.push({
      id: staircaseNode.id,
      type: staircaseNode.type,
      polygon: rect(0, usableDepth, envelope.frontage, envelope.depth),
    });
  }

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

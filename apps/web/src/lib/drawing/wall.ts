import { GEOMETRY_EPS, type Geometry, type GeometrySpace, type Point } from "./geometry";

/**
 * Wall — derived tự động từ Geometry đã giải xong (Tech Lead Review mục
 * 4), KHÔNG do Layout Generator/Design Intent Graph hand-author. Chỉ
 * cần tô-pô (start/end/type) — không cần độ dày/vật liệu ở Stage 1.
 *
 * `betweenRoomIds` là bổ sung nhỏ so với đề xuất gốc: cửa (door) cần
 * biết wall nào nằm giữa 2 phòng cụ thể để đặt đúng chỗ và để
 * geometryValidator kiểm tra "mọi cặp connection đều có cạnh chung".
 *
 * HARDENING (Stage 1.5, Task 3): thuật toán hiện tại dùng bounding-box
 * overlap — CHỈ đúng cho hình chữ nhật trục-thẳng (axis-aligned). Thay
 * vì ngầm định hoạt động cho polygon bất kỳ (sai lặng lẽ nếu sau này có
 * phòng không phải chữ nhật), hàm này CHỦ ĐỘNG kiểm tra và throw rõ
 * ràng nếu gặp polygon không phải hình chữ nhật trục-thẳng — chọn
 * phương án "Temporary alternative" thay vì viết thuật toán polygon
 * tổng quát (collinear segment intersection), vì Stage 1-2 chỉ tạo hình
 * chữ nhật (không có hình học cong theo đúng phạm vi Founder đã giới
 * hạn) — viết thuật toán tổng quát bây giờ là suy đoán trước khi có nhu
 * cầu thật (Burden of Proof / Simplicity before Generality).
 */

export interface Wall {
  id: string;
  start: Point;
  end: Point;
  type: "exterior" | "interior";
  betweenRoomIds?: [string, string];
}

interface BBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export class WallDerivationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WallDerivationError";
  }
}

/**
 * Guard tường minh: chỉ chấp nhận polygon 4 điểm, các cạnh xen kẽ
 * ngang/dọc (hình chữ nhật trục-thẳng). KHÔNG cố gắng xử lý polygon
 * khác — throw rõ ràng thay vì suy diễn sai lặng lẽ.
 */
function assertAxisAlignedRectangle(space: GeometrySpace): void {
  if (space.polygon.length !== 4) {
    throw new WallDerivationError(
      `Phòng "${space.id}" có ${space.polygon.length} điểm — deriveWalls() chỉ hỗ trợ hình chữ nhật 4 điểm (Stage 1-2, chưa hỗ trợ polygon tổng quát).`,
    );
  }
  const b = bbox(space.polygon);
  const expectedCorners = [
    { x: b.x0, y: b.y0 },
    { x: b.x1, y: b.y0 },
    { x: b.x1, y: b.y1 },
    { x: b.x0, y: b.y1 },
  ];
  // Mỗi điểm của polygon phải trùng (trong sai số) đúng 1 trong 4 góc của
  // bounding box của chính nó — nếu không, đây không phải hình chữ nhật
  // trục-thẳng thật (vd polygon nghiêng nhưng có cùng bounding box).
  const allCornersMatch = space.polygon.every((p) =>
    expectedCorners.some((c) => Math.abs(c.x - p.x) < GEOMETRY_EPS && Math.abs(c.y - p.y) < GEOMETRY_EPS),
  );
  if (!allCornersMatch) {
    throw new WallDerivationError(
      `Phòng "${space.id}" không phải hình chữ nhật trục-thẳng (axis-aligned) — deriveWalls() chưa hỗ trợ polygon tổng quát.`,
    );
  }
}

function bbox(polygon: Point[]): BBox {
  const xs = polygon.map((p) => p.x);
  const ys = polygon.map((p) => p.y);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
}

function sharedEdge(a: BBox, b: BBox): { start: Point; end: Point } | null {
  if (Math.abs(a.y1 - b.y0) < GEOMETRY_EPS) {
    const x0 = Math.max(a.x0, b.x0);
    const x1 = Math.min(a.x1, b.x1);
    if (x1 - x0 > GEOMETRY_EPS) return { start: { x: x0, y: a.y1 }, end: { x: x1, y: a.y1 } };
  }
  if (Math.abs(b.y1 - a.y0) < GEOMETRY_EPS) {
    const x0 = Math.max(a.x0, b.x0);
    const x1 = Math.min(a.x1, b.x1);
    if (x1 - x0 > GEOMETRY_EPS) return { start: { x: x0, y: a.y0 }, end: { x: x1, y: a.y0 } };
  }
  if (Math.abs(a.x1 - b.x0) < GEOMETRY_EPS) {
    const y0 = Math.max(a.y0, b.y0);
    const y1 = Math.min(a.y1, b.y1);
    if (y1 - y0 > GEOMETRY_EPS) return { start: { x: a.x1, y: y0 }, end: { x: a.x1, y: y1 } };
  }
  if (Math.abs(b.x1 - a.x0) < GEOMETRY_EPS) {
    const y0 = Math.max(a.y0, b.y0);
    const y1 = Math.min(a.y1, b.y1);
    if (y1 - y0 > GEOMETRY_EPS) return { start: { x: b.x1, y: y0 }, end: { x: b.x1, y: y1 } };
  }
  return null;
}

/** Envelope = bao ngoài toàn bộ không gian trong tầng — 4 cạnh luôn là exterior. */
function envelopeBox(spaces: GeometrySpace[]): BBox {
  const boxes = spaces.map((s) => bbox(s.polygon));
  return {
    x0: Math.min(...boxes.map((b) => b.x0)),
    y0: Math.min(...boxes.map((b) => b.y0)),
    x1: Math.max(...boxes.map((b) => b.x1)),
    y1: Math.max(...boxes.map((b) => b.y1)),
  };
}

export function deriveWalls(geometry: Geometry): Wall[] {
  const walls: Wall[] = [];

  for (const floor of geometry.floors) {
    const spaces = floor.spaces;
    spaces.forEach(assertAxisAlignedRectangle);

    for (let i = 0; i < spaces.length; i++) {
      for (let j = i + 1; j < spaces.length; j++) {
        const edge = sharedEdge(bbox(spaces[i].polygon), bbox(spaces[j].polygon));
        if (edge) {
          // ID theo tên 2 phòng (sắp theo alphabet) — deterministic bất
          // kể thứ tự duyệt mảng, không phụ thuộc 1 bộ đếm tăng dần.
          const [a, b] = [spaces[i].id, spaces[j].id].sort();
          walls.push({
            id: `wall-${floor.level}-${a}-${b}`,
            start: edge.start,
            end: edge.end,
            type: "interior",
            betweenRoomIds: [spaces[i].id, spaces[j].id],
          });
        }
      }
    }

    const env = envelopeBox(spaces);
    const corners: Point[] = [
      { x: env.x0, y: env.y0 },
      { x: env.x1, y: env.y0 },
      { x: env.x1, y: env.y1 },
      { x: env.x0, y: env.y1 },
    ];
    const CORNER_NAME = ["top", "right", "bottom", "left"];
    for (let k = 0; k < 4; k++) {
      walls.push({
        id: `wall-${floor.level}-ext-${CORNER_NAME[k]}`,
        start: corners[k],
        end: corners[(k + 1) % 4],
        type: "exterior",
      });
    }
  }

  return walls;
}

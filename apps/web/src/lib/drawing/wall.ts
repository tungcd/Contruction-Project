import type { Geometry, GeometrySpace, Point } from "./geometry";

/**
 * Wall — derived tự động từ Geometry đã giải xong (Tech Lead Review mục
 * 4), KHÔNG do Layout Generator/Design Intent Graph hand-author. Chỉ
 * cần tô-pô (start/end/type) — không cần độ dày/vật liệu ở Stage 1.
 *
 * `betweenRoomIds` là bổ sung nhỏ so với đề xuất gốc: cửa (door) cần
 * biết wall nào nằm giữa 2 phòng cụ thể để đặt đúng chỗ và để
 * geometryValidator kiểm tra "mọi cặp connection đều có cạnh chung".
 */

const EPS = 1e-6;

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

function bbox(polygon: Point[]): BBox {
  const xs = polygon.map((p) => p.x);
  const ys = polygon.map((p) => p.y);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
}

function sharedEdge(a: BBox, b: BBox): { start: Point; end: Point } | null {
  if (Math.abs(a.y1 - b.y0) < EPS) {
    const x0 = Math.max(a.x0, b.x0);
    const x1 = Math.min(a.x1, b.x1);
    if (x1 - x0 > EPS) return { start: { x: x0, y: a.y1 }, end: { x: x1, y: a.y1 } };
  }
  if (Math.abs(b.y1 - a.y0) < EPS) {
    const x0 = Math.max(a.x0, b.x0);
    const x1 = Math.min(a.x1, b.x1);
    if (x1 - x0 > EPS) return { start: { x: x0, y: a.y0 }, end: { x: x1, y: a.y0 } };
  }
  if (Math.abs(a.x1 - b.x0) < EPS) {
    const y0 = Math.max(a.y0, b.y0);
    const y1 = Math.min(a.y1, b.y1);
    if (y1 - y0 > EPS) return { start: { x: a.x1, y: y0 }, end: { x: a.x1, y: y1 } };
  }
  if (Math.abs(b.x1 - a.x0) < EPS) {
    const y0 = Math.max(a.y0, b.y0);
    const y1 = Math.min(a.y1, b.y1);
    if (y1 - y0 > EPS) return { start: { x: b.x1, y: y0 }, end: { x: b.x1, y: y1 } };
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
    let wallIndex = 0;
    const spaces = floor.spaces;

    for (let i = 0; i < spaces.length; i++) {
      for (let j = i + 1; j < spaces.length; j++) {
        const edge = sharedEdge(bbox(spaces[i].polygon), bbox(spaces[j].polygon));
        if (edge) {
          walls.push({
            id: `wall-${floor.level}-${wallIndex++}`,
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
    for (let k = 0; k < 4; k++) {
      walls.push({
        id: `wall-${floor.level}-ext-${k}`,
        start: corners[k],
        end: corners[(k + 1) % 4],
        type: "exterior",
      });
    }
  }

  return walls;
}

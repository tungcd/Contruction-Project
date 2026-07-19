import { GEOMETRY_EPS, type Geometry, type GeometrySpace } from "./geometry";
import type { Wall } from "./wall";
import type { Door } from "./door";

/**
 * Window — mô hình tối thiểu (Stage 1.7, Task 5). KHÔNG vật liệu/kính/
 * lịch trình (schedule) — chỉ đủ để validate + vẽ 1 ký hiệu cửa sổ đơn
 * giản trên mặt bằng. Phải tham chiếu 1 exterior wall có thật, nằm gọn
 * trong wall đó, và không chồng lấn cửa đi (Door) trên cùng wall.
 */
export interface Window {
  id: string;
  wallId: string;
  roomId: string;
  offset: number; // khoảng cách từ wall.start tới TÂM cửa sổ, dọc theo wall (m)
  width: number; // m
}

export interface PlaceWindowsResult {
  windows: Window[];
  warnings: string[];
}

const STANDARD_WINDOW_WIDTH = 1.2; // m
const WINDOW_ELIGIBLE_TYPES = ["living", "kitchen", "bedroom"];
const MIN_CLEARANCE = 0.15; // m — khoảng hở tối thiểu giữa cửa sổ và cửa đi/mép tường

function wallLength(w: Wall): number {
  return Math.hypot(w.end.x - w.start.x, w.end.y - w.start.y);
}

function offsetAlongWall(wall: Wall, point: { x: number; y: number }): number {
  const length = wallLength(wall);
  const dirX = (wall.end.x - wall.start.x) / length;
  const dirY = (wall.end.y - wall.start.y) / length;
  return (point.x - wall.start.x) * dirX + (point.y - wall.start.y) * dirY;
}

/**
 * Tìm 1 exterior wall mà `room` có cạnh trùng, và khoảng offset dọc wall
 * đó mà room chiếm (để giới hạn cửa sổ nằm trong đúng đoạn của room, dù
 * wall có thể dài hơn — trường hợp nhiều phòng cùng chạm 1 exterior
 * wall). Kiểm tra theo thứ tự cố định top/left/right/bottom — deterministic.
 */
function findExteriorTouch(
  room: GeometrySpace,
  envelope: { frontage: number; depth: number },
  walls: Wall[],
): { wall: Wall; rangeStart: number; rangeEnd: number } | null {
  const xs = room.polygon.map((p) => p.x);
  const ys = room.polygon.map((p) => p.y);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);

  const touches: { suffix: string; a: { x: number; y: number }; b: { x: number; y: number } }[] = [];
  if (Math.abs(y0) < GEOMETRY_EPS) touches.push({ suffix: "-ext-top", a: { x: x0, y: y0 }, b: { x: x1, y: y0 } });
  if (Math.abs(x0) < GEOMETRY_EPS) touches.push({ suffix: "-ext-left", a: { x: x0, y: y0 }, b: { x: x0, y: y1 } });
  if (Math.abs(x1 - envelope.frontage) < GEOMETRY_EPS)
    touches.push({ suffix: "-ext-right", a: { x: x1, y: y0 }, b: { x: x1, y: y1 } });
  if (Math.abs(y1 - envelope.depth) < GEOMETRY_EPS)
    touches.push({ suffix: "-ext-bottom", a: { x: x0, y: y1 }, b: { x: x1, y: y1 } });

  for (const t of touches) {
    const wall = walls.find((w) => w.id.endsWith(t.suffix));
    if (!wall) continue;
    const offA = offsetAlongWall(wall, t.a);
    const offB = offsetAlongWall(wall, t.b);
    return { wall, rangeStart: Math.min(offA, offB), rangeEnd: Math.max(offA, offB) };
  }
  return null;
}

/** Các khoảng đã bị chiếm bởi cửa đi trên wall (có thêm khoảng hở tối thiểu 2 bên). */
function occupiedIntervals(wall: Wall, doors: Door[]): { start: number; end: number }[] {
  return doors
    .filter((d) => d.wallId === wall.id)
    .map((d) => ({ start: d.offset - d.width / 2 - MIN_CLEARANCE, end: d.offset + d.width / 2 + MIN_CLEARANCE }));
}

function fitsFree(start: number, end: number, occupied: { start: number; end: number }[]): boolean {
  return occupied.every((o) => end <= o.start || start >= o.end);
}

export function placeWindows(
  geometry: Geometry,
  walls: Wall[],
  doors: Door[],
  envelope: { frontage: number; depth: number },
): PlaceWindowsResult {
  const windows: Window[] = [];
  const warnings: string[] = [];
  let windowIndex = 0;

  for (const floor of geometry.floors) {
    for (const room of floor.spaces) {
      if (!WINDOW_ELIGIBLE_TYPES.includes(room.type)) continue;

      const touch = findExteriorTouch(room, envelope, walls);
      if (!touch) {
        warnings.push(`Phòng "${room.id}" không có cạnh nào chạm tường ngoài — không đặt được cửa sổ.`);
        continue;
      }
      const { wall, rangeStart, rangeEnd } = touch;
      const occupied = occupiedIntervals(wall, doors);
      const rangeLength = rangeEnd - rangeStart;
      const width = Math.min(STANDARD_WINDOW_WIDTH, Math.max(0, rangeLength - 2 * MIN_CLEARANCE));
      if (width <= 0) {
        warnings.push(`Phòng "${room.id}" không còn đủ chỗ trên tường ngoài để đặt cửa sổ (đã kín bởi cửa đi).`);
        continue;
      }

      const candidateCenters = [0.5, 0.25, 0.75].map((f) => rangeStart + rangeLength * f);
      const center = candidateCenters.find((c) => fitsFree(c - width / 2, c + width / 2, occupied));
      if (center === undefined) {
        warnings.push(`Phòng "${room.id}" không tìm được vị trí cửa sổ không chồng cửa đi trên cùng tường.`);
        continue;
      }

      windows.push({ id: `window-${windowIndex++}`, wallId: wall.id, roomId: room.id, offset: center, width });
    }
  }

  return { windows, warnings };
}

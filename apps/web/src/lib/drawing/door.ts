import type { LayoutGraph } from "./layoutGraph";
import type { Wall } from "./wall";

/**
 * Door — dữ liệu tường minh (Tech Lead Review Stage 1.5, Task 4). Cửa
 * KHÔNG được phép chỉ tồn tại như 1 cạnh ngữ nghĩa trong LayoutGraph —
 * phải có vị trí thật (wall + offset + width) để vẽ được trên SVG.
 *
 * `swingDirection`/`hingeSide` — KHÔNG bắt buộc ở Stage 1.5 (đã nêu rõ
 * là optional), chưa implement.
 */

const STANDARD_DOOR_WIDTH = 0.9; // m — cửa thông thường trong nhà ở

export interface Door {
  id: string;
  wallId: string;
  connects: [string, string]; // spaceId hoặc "exterior"
  offset: number; // khoảng cách từ wall.start tới TÂM cửa, dọc theo wall (m)
  width: number; // m
}

export interface PlaceDoorsResult {
  doors: Door[];
  warnings: string[];
}

function wallLength(w: Wall): number {
  return Math.hypot(w.end.x - w.start.x, w.end.y - w.start.y);
}

/**
 * Đặt 1 cửa ở giữa đoạn wall — nếu wall ngắn hơn `STANDARD_DOOR_WIDTH`,
 * KHÔNG tự ý thu nhỏ cửa âm thầm: ghi warning rõ ràng và vẫn đặt cửa
 * với width co lại đúng bằng chiều dài wall (geometryValidator sẽ tự
 * kiểm tra lại offset/width có hợp lệ không — door.ts không tự nhận là
 * "luôn đúng").
 */
function placeDoorOnWall(
  id: string,
  wall: Wall,
  connects: [string, string],
  warnings: string[],
): Door {
  const length = wallLength(wall);
  let width = STANDARD_DOOR_WIDTH;
  if (length < STANDARD_DOOR_WIDTH) {
    warnings.push(
      `Wall "${wall.id}" (dài ${length.toFixed(2)}m) ngắn hơn cửa tiêu chuẩn (${STANDARD_DOOR_WIDTH}m) — đã thu nhỏ cửa "${id}" cho vừa, cần kiến trúc sư xem lại.`,
    );
    width = length;
  }
  return { id, wallId: wall.id, connects, offset: length / 2, width };
}

export function placeDoors(layoutGraph: LayoutGraph, walls: Wall[]): PlaceDoorsResult {
  const doors: Door[] = [];
  const warnings: string[] = [];
  let doorIndex = 0;

  for (const edge of layoutGraph.edges) {
    if (edge.type !== "door") continue;

    if (edge.from === "entrance" || edge.to === "entrance") {
      const roomId = edge.from === "entrance" ? edge.to : edge.from;
      // Cửa chính nằm trên wall exterior mặt tiền (y=0 theo Coordinate
      // Contract — xem geometry.ts) — Stage 1 chỉ có 1 wall exterior
      // "top" (mặt tiền), tìm đúng wall đó.
      const facadeWall = walls.find((w) => w.type === "exterior" && w.id.endsWith("-ext-top"));
      if (!facadeWall) {
        warnings.push(`Không tìm thấy wall mặt tiền để đặt cửa chính cho "${roomId}".`);
        continue;
      }
      doors.push(
        placeDoorOnWall(`door-${doorIndex++}`, facadeWall, [roomId, "exterior"], warnings),
      );
      continue;
    }

    const wall = walls.find(
      (w) => w.type === "interior" && w.betweenRoomIds?.includes(edge.from) && w.betweenRoomIds?.includes(edge.to),
    );
    if (!wall) {
      warnings.push(`Không tìm thấy wall giữa "${edge.from}" và "${edge.to}" — không đặt được cửa.`);
      continue;
    }
    doors.push(placeDoorOnWall(`door-${doorIndex++}`, wall, [edge.from, edge.to], warnings));
  }

  return { doors, warnings };
}

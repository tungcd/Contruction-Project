import type { ConstraintSet } from "@acc/shared-types";
import { GEOMETRY_EPS, type Geometry, type GeometrySpace } from "./geometry";
import type { LayoutGraph } from "./layoutGraph";
import type { Wall } from "./wall";
import type { Door } from "./door";
import type { Window } from "./window";
import { aspectRatioOf, constraintFor } from "./roomConstraints";

/**
 * Geometry Validation — tái dùng quy tắc đã spec ở Golden Contract #6/#7
 * (Phase A, đóng băng), không thiết kế lại. "Do not silently correct
 * invalid geometry" — luôn trả lỗi cụ thể, không tự sửa.
 */

export interface GeometryValidationResult {
  passed: boolean;
  errors: string[];
  /** Stage 1.6, Task 2 — vi phạm preferred (không phải hard) aspect ratio: vẫn PASS, chỉ cảnh báo. */
  warnings: string[];
}

// Cố ý KHÁC GEOMETRY_EPS (1e-6, dùng cho so sánh toạ độ bằng nhau tuyệt
// đối — xem geometry.ts): AREA_EPS là ngưỡng "chồng lấn/lệch có ý nghĩa
// vật lý" (1cm), rộng hơn nhiều để không báo lỗi vì sai số làm tròn khi
// cộng dồn nhiều phép chia theo areaWeight.
const AREA_EPS = 0.01; // m²

function bboxArea(space: GeometrySpace): number {
  const xs = space.polygon.map((p) => p.x);
  const ys = space.polygon.map((p) => p.y);
  return (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys));
}

function overlaps(a: GeometrySpace, b: GeometrySpace): boolean {
  const ax = a.polygon.map((p) => p.x);
  const ay = a.polygon.map((p) => p.y);
  const bx = b.polygon.map((p) => p.x);
  const by = b.polygon.map((p) => p.y);
  const [ax0, ax1] = [Math.min(...ax), Math.max(...ax)];
  const [ay0, ay1] = [Math.min(...ay), Math.max(...ay)];
  const [bx0, bx1] = [Math.min(...bx), Math.max(...bx)];
  const [by0, by1] = [Math.min(...by), Math.max(...by)];
  const xOverlap = Math.min(ax1, bx1) - Math.max(ax0, bx0);
  const yOverlap = Math.min(ay1, by1) - Math.max(ay0, by0);
  return xOverlap > AREA_EPS && yOverlap > AREA_EPS;
}

/** Section 5 tách thành hàm riêng — Stage 2A gọi 1 LẦN trên Geometry gộp
 *  TẤT CẢ tầng, không gọi per-floor (constraintSet.spaces.bedrooms là
 *  tổng toàn nhà, không phải số phòng ngủ của riêng 1 tầng). */
export function validateAggregateRoomCounts(geometry: Geometry, constraintSet: ConstraintSet): string[] {
  const errors: string[] = [];
  const allSpaces = geometry.floors.flatMap((f) => f.spaces);
  const countByType = (type: string) => allSpaces.filter((s) => s.type === type).length;
  const expectedBedrooms = constraintSet.spaces.bedrooms?.value ?? 0;
  const expectedBathrooms = constraintSet.spaces.bathrooms?.value ?? 0;
  if (countByType("bedroom") !== expectedBedrooms) {
    errors.push(`Số phòng ngủ trong bản vẽ (${countByType("bedroom")}) khác Constraint Set (${expectedBedrooms}).`);
  }
  if (countByType("wc") !== expectedBathrooms) {
    errors.push(`Số WC trong bản vẽ (${countByType("wc")}) khác Constraint Set (${expectedBathrooms}).`);
  }
  if (constraintSet.spaces.livingRoom?.value && countByType("living") === 0) {
    errors.push(`Constraint Set yêu cầu phòng khách nhưng bản vẽ không có.`);
  }
  if (constraintSet.spaces.kitchen?.value && countByType("kitchen") === 0) {
    errors.push(`Constraint Set yêu cầu bếp nhưng bản vẽ không có.`);
  }
  return errors;
}

/**
 * Stage 2B, Task 9 — guard tường minh thay vì chỉ dựa vào quy ước gọi
 * đúng (call-site convention): `validateGeometry` phải luôn nhận dữ
 * liệu CỦA ĐÚNG 1 TẦNG. Trước đây (Stage 2A) đúng theo quy ước nhờ
 * `generateDrawing.ts` luôn lọc trước khi gọi, nhưng không có gì CHẶN
 * việc lỡ truyền LayoutGraph gộp nhiều tầng (id "circulation"/"staircase"
 * lặp lại giữa các tầng có thể khiến kiểm tra door-wall consistency
 * false-pass nhầm sang tầng khác — xem Completion Report Stage 2A, mục
 * "Giới hạn còn lại").
 */
function assertSingleFloorScope(geometry: Geometry, layoutGraph: LayoutGraph, checkAggregateCounts: boolean): void {
  const layoutFloorLevels = new Set(layoutGraph.nodes.map((n) => n.floor));
  if (layoutFloorLevels.size > 1) {
    throw new Error(
      `validateGeometry() nhận LayoutGraph gộp nhiều tầng (${[...layoutFloorLevels].join(",")}) — phải gọi RIÊNG cho từng tầng (xem generateDrawing.ts).`,
    );
  }
  if (!checkAggregateCounts && geometry.floors.length > 1) {
    throw new Error(
      `validateGeometry() với checkAggregateCounts=false phải nhận Geometry CHỈ 1 tầng (nhận ${geometry.floors.length} tầng) — lọc trước khi gọi.`,
    );
  }
}

export function validateGeometry(
  geometry: Geometry,
  layoutGraph: LayoutGraph,
  walls: Wall[],
  doors: Door[],
  constraintSet: ConstraintSet,
  windows: Window[] = [],
  checkAggregateCounts = true,
): GeometryValidationResult {
  assertSingleFloorScope(geometry, layoutGraph, checkAggregateCounts);
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const floor of geometry.floors) {
    const { spaces } = floor;

    // 1. Diện tích dương, nằm trong envelope.
    for (const s of spaces) {
      const area = bboxArea(s);
      if (area <= 0) errors.push(`Phòng "${s.id}" có diện tích không dương (${area}).`);
      const xs = s.polygon.map((p) => p.x);
      const ys = s.polygon.map((p) => p.y);
      if (Math.min(...xs) < -AREA_EPS || Math.min(...ys) < -AREA_EPS) {
        errors.push(`Phòng "${s.id}" vượt ra ngoài envelope (toạ độ âm).`);
      }
      if (Math.max(...xs) > layoutGraph.envelope.frontage + AREA_EPS) {
        errors.push(`Phòng "${s.id}" vượt quá chiều rộng đất (${layoutGraph.envelope.frontage}m).`);
      }
      if (Math.max(...ys) > layoutGraph.envelope.depth + AREA_EPS) {
        errors.push(`Phòng "${s.id}" vượt quá chiều sâu đất (${layoutGraph.envelope.depth}m).`);
      }

      // 1b. Room Geometry Constraint (Stage 1.6, Task 2) — chặn hình học
      //     "khe hẹp" phi lý (vd WC 1.2x5.1m phát hiện ở Stage 1.5).
      //     minWidth/minDepth/hardAspectRatioMax vi phạm -> fail cứng.
      //     Ngoài preferred (nhưng trong hard) -> chỉ cảnh báo, vẫn pass.
      const constraint = constraintFor(s.type);
      if (constraint) {
        const width = Math.max(...xs) - Math.min(...xs);
        const depth = Math.max(...ys) - Math.min(...ys);
        if (width < constraint.minWidth - AREA_EPS) {
          errors.push(
            `Phòng "${s.id}" (${s.type}) rộng ${width.toFixed(2)}m — nhỏ hơn tối thiểu ${constraint.minWidth}m.`,
          );
        }
        if (depth < constraint.minDepth - AREA_EPS) {
          errors.push(
            `Phòng "${s.id}" (${s.type}) sâu ${depth.toFixed(2)}m — nhỏ hơn tối thiểu ${constraint.minDepth}m.`,
          );
        }
        const ratio = aspectRatioOf(width, depth);
        if (ratio > constraint.hardAspectRatioMax + AREA_EPS) {
          errors.push(
            `Phòng "${s.id}" (${s.type}) tỷ lệ khung hình ${ratio.toFixed(2)}:1 — vượt ngưỡng cứng ${constraint.hardAspectRatioMax}:1 (hình "khe hẹp" phi lý).`,
          );
        } else if (ratio > constraint.preferredAspectRatioMax + AREA_EPS) {
          warnings.push(
            `Phòng "${s.id}" (${s.type}) tỷ lệ khung hình ${ratio.toFixed(2)}:1 — ngoài khoảng ưu tiên (tối đa ${constraint.preferredAspectRatioMax}:1), vẫn trong giới hạn chấp nhận được.`,
          );
        }

        // Stage 2B, Task 3 — giới hạn diện tích: aspect/minWidth/minDepth
        // chặn được "khe hẹp" nhưng KHÔNG chặn phòng phình to (bug thật:
        // WC 9-10.4m², phòng ngủ 20.8m² ở fixture `townhouse`). Vượt
        // hardAreaMax -> fail cứng; ngoài preferredAreaMax (không vượt
        // hard) -> chỉ cảnh báo.
        const area = width * depth;
        if (constraint.hardAreaMax && area > constraint.hardAreaMax + AREA_EPS) {
          errors.push(
            `Phòng "${s.id}" (${s.type}) diện tích ${area.toFixed(2)}m² — vượt ngưỡng cứng ${constraint.hardAreaMax}m².`,
          );
        } else if (constraint.preferredAreaMax && area > constraint.preferredAreaMax + AREA_EPS) {
          warnings.push(
            `Phòng "${s.id}" (${s.type}) diện tích ${area.toFixed(2)}m² — ngoài khoảng ưu tiên (tối đa ${constraint.preferredAreaMax}m²), vẫn trong giới hạn chấp nhận được.`,
          );
        } else if (constraint.preferredAreaMin && area < constraint.preferredAreaMin - AREA_EPS) {
          warnings.push(
            `Phòng "${s.id}" (${s.type}) diện tích ${area.toFixed(2)}m² — nhỏ hơn khoảng ưu tiên (tối thiểu ${constraint.preferredAreaMin}m²), vẫn trong giới hạn chấp nhận được.`,
          );
        }
      }
    }

    // 2. Không chồng lấn.
    for (let i = 0; i < spaces.length; i++) {
      for (let j = i + 1; j < spaces.length; j++) {
        if (overlaps(spaces[i], spaces[j])) {
          errors.push(`Phòng "${spaces[i].id}" và "${spaces[j].id}" chồng lấn.`);
        }
      }
    }

    // 3. Mọi cạnh "door" trong LayoutGraph phải có wall interior tương ứng.
    //    "entrance" là node ảo (không có polygon, areaWeight=0 — đại
    //    diện mặt tiền, không phải 1 phòng thật) — cạnh nối tới entrance
    //    kiểm tra khác: phòng còn lại phải chạm mặt tiền (y ≈ 0), không
    //    kiểm tra "có wall chung với entrance" (entrance không có wall).
    for (const edge of layoutGraph.edges) {
      if (edge.type !== "door") continue;
      if (edge.from === "entrance" || edge.to === "entrance") {
        const roomId = edge.from === "entrance" ? edge.to : edge.from;
        const room = spaces.find((s) => s.id === roomId);
        const touchesFacade = room ? Math.min(...room.polygon.map((p) => p.y)) < GEOMETRY_EPS : false;
        if (!touchesFacade) {
          errors.push(`Phòng "${roomId}" được nối với lối vào (entrance) nhưng không chạm mặt tiền.`);
        }
        continue;
      }
      const hasWall = walls.some(
        (w) =>
          w.type === "interior" &&
          w.betweenRoomIds &&
          w.betweenRoomIds.includes(edge.from) &&
          w.betweenRoomIds.includes(edge.to),
      );
      if (!hasWall) {
        errors.push(`Không tìm thấy cạnh chung giữa "${edge.from}" và "${edge.to}" để đặt cửa.`);
      }
    }

    // 4. Tổng diện tích khớp buildingFootprint/totalFloorArea (Stage 1: phép tính
    //    chính xác, không cần ngưỡng 10% như Contract #6 — chỉ cho phép sai số làm tròn).
    const totalArea = spaces.reduce((s, sp) => s + bboxArea(sp), 0);
    const expected =
      constraintSet.site.buildingFootprint?.value ?? constraintSet.site.totalFloorArea?.value ?? null;
    if (expected !== null && Math.abs(totalArea - expected) > AREA_EPS * spaces.length) {
      errors.push(
        `Tổng diện tích hình học (${totalArea.toFixed(2)}m²) không khớp buildingFootprint (${expected}m²).`,
      );
    }
  }

  // 4b. Door validation (Stage 1.5, Task 4) — cửa phải tham chiếu wall
  //     có thật, offset/width nằm gọn trong wall, và mọi cạnh "door"
  //     của LayoutGraph phải có đúng 1 Door tương ứng (No Silent Drop —
  //     không được có cạnh "door" mà không có cửa vẽ được).
  const wallById = new Map(walls.map((w) => [w.id, w]));
  for (const door of doors) {
    const wall = wallById.get(door.wallId);
    if (!wall) {
      errors.push(`Cửa "${door.id}" tham chiếu wall "${door.wallId}" không tồn tại.`);
      continue;
    }
    const length = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
    if (door.width <= 0) {
      errors.push(`Cửa "${door.id}" có width không dương (${door.width}).`);
    }
    if (door.offset < 0 || door.offset > length + AREA_EPS) {
      errors.push(`Cửa "${door.id}" có offset (${door.offset}) nằm ngoài wall "${wall.id}" (dài ${length.toFixed(2)}m).`);
    }
    if (door.offset - door.width / 2 < -AREA_EPS || door.offset + door.width / 2 > length + AREA_EPS) {
      errors.push(`Cửa "${door.id}" vượt quá 2 đầu wall "${wall.id}".`);
    }
    if (wall.type === "interior" && wall.betweenRoomIds) {
      const matchesConnection =
        wall.betweenRoomIds.includes(door.connects[0]) && wall.betweenRoomIds.includes(door.connects[1]);
      if (!matchesConnection) {
        errors.push(`Cửa "${door.id}" đặt trên wall không đúng cặp phòng dự kiến (${door.connects.join(" <-> ")}).`);
      }
    }
  }
  const requiredDoorEdges = layoutGraph.edges.filter((e) => e.type === "door");
  for (const edge of requiredDoorEdges) {
    const hasDoor = doors.some(
      (d) =>
        (d.connects.includes(edge.from) && d.connects.includes(edge.to)) ||
        (edge.from === "entrance" && d.connects.includes(edge.to) && d.connects.includes("exterior")) ||
        (edge.to === "entrance" && d.connects.includes(edge.from) && d.connects.includes("exterior")),
    );
    if (!hasDoor) {
      errors.push(`Cạnh "door" giữa "${edge.from}" và "${edge.to}" trong LayoutGraph không có Door tương ứng nào được vẽ.`);
    }
  }

  // 4c. Window validation (Stage 1.7, Task 5) — phải tham chiếu wall có
  //     thật (VÀ là exterior — cửa sổ không đặt trên tường trong nhà),
  //     nằm gọn trong wall, và không chồng lấn cửa đi trên cùng wall.
  for (const win of windows) {
    const wall = wallById.get(win.wallId);
    if (!wall) {
      errors.push(`Cửa sổ "${win.id}" tham chiếu wall "${win.wallId}" không tồn tại.`);
      continue;
    }
    if (wall.type !== "exterior") {
      errors.push(`Cửa sổ "${win.id}" đặt trên wall "${win.wallId}" không phải tường ngoài.`);
    }
    const length = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
    if (win.width <= 0) {
      errors.push(`Cửa sổ "${win.id}" có width không dương (${win.width}).`);
    }
    if (win.offset - win.width / 2 < -AREA_EPS || win.offset + win.width / 2 > length + AREA_EPS) {
      errors.push(`Cửa sổ "${win.id}" vượt quá 2 đầu wall "${wall.id}".`);
    }
    const overlapsDoor = doors.some(
      (d) =>
        d.wallId === win.wallId &&
        win.offset - win.width / 2 < d.offset + d.width / 2 - AREA_EPS &&
        win.offset + win.width / 2 > d.offset - d.width / 2 + AREA_EPS,
    );
    if (overlapsDoor) {
      errors.push(`Cửa sổ "${win.id}" chồng lấn 1 cửa đi trên cùng wall "${wall.id}".`);
    }
  }

  // 5. Số lượng phòng khớp Constraint Set (đếm theo type) — Stage 2A: chỉ
  //    kiểm tra khi gọi ở mức TOÀ NHÀ (checkAggregateCounts=true, mặc
  //    định giữ nguyên hành vi Stage 1.7 cho nhà 1 tầng); khi gọi
  //    per-floor cho nhà nhiều tầng, bỏ qua ở đây, gọi
  //    `validateAggregateRoomCounts()` riêng 1 lần trên Geometry gộp.
  if (checkAggregateCounts) {
    errors.push(...validateAggregateRoomCounts(geometry, constraintSet));
  }

  // 6. hasElderly proximity — Stage 1 chưa có ngưỡng Founder xác nhận
  //    (xem 20_Architecture-Concept-Drawing-MVP.md Phần E); bỏ qua nếu
  //    không có yêu cầu người già (đúng trường hợp mọi fixture Stage 1).
  if (constraintSet.household.hasElderly?.value) {
    errors.push(
      "Constraint Set có hasElderly=true nhưng Stage 1 chưa implement rule kiểm tra khoảng cách tới lối vào (cần Founder xác nhận ngưỡng trước) — không tự bịa, báo lỗi rõ thay vì bỏ qua âm thầm.",
    );
  }

  return { passed: errors.length === 0, errors, warnings };
}

import type { ConstraintSet } from "@acc/shared-types";
import type { Geometry, GeometrySpace } from "./geometry";
import type { LayoutGraph } from "./layoutGraph";
import type { Wall } from "./wall";

/**
 * Geometry Validation — tái dùng quy tắc đã spec ở Golden Contract #6/#7
 * (Phase A, đóng băng), không thiết kế lại. "Do not silently correct
 * invalid geometry" — luôn trả lỗi cụ thể, không tự sửa.
 */

export interface GeometryValidationResult {
  passed: boolean;
  errors: string[];
}

const AREA_EPS = 0.01; // m² — sai số làm tròn, Stage 1 là phép tính chính xác nên KHÔNG cần ngưỡng 10%/1% của Phase A.

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

export function validateGeometry(
  geometry: Geometry,
  layoutGraph: LayoutGraph,
  walls: Wall[],
  constraintSet: ConstraintSet,
): GeometryValidationResult {
  const errors: string[] = [];

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
        const touchesFacade = room ? Math.min(...room.polygon.map((p) => p.y)) < AREA_EPS : false;
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

  // 5. Số lượng phòng khớp Constraint Set (đếm theo type).
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

  // 6. hasElderly proximity — Stage 1 chưa có ngưỡng Founder xác nhận
  //    (xem 20_Architecture-Concept-Drawing-MVP.md Phần E); bỏ qua nếu
  //    không có yêu cầu người già (đúng trường hợp mọi fixture Stage 1).
  if (constraintSet.household.hasElderly?.value) {
    errors.push(
      "Constraint Set có hasElderly=true nhưng Stage 1 chưa implement rule kiểm tra khoảng cách tới lối vào (cần Founder xác nhận ngưỡng trước) — không tự bịa, báo lỗi rõ thay vì bỏ qua âm thầm.",
    );
  }

  return { passed: errors.length === 0, errors };
}

import type { DesignIntentGraph, VerticalConnection } from "./designIntentGraph";
import { GEOMETRY_EPS, type Geometry, type Point } from "./geometry";

/**
 * Staircase Domain — Stage 2A, Task 2. Đại diện tối thiểu cho cầu thang
 * nhiều tầng: KHÔNG tính kết cấu (bậc/chiếu nghỉ thật), chỉ đủ để: (a)
 * đảm bảo cùng 1 vị trí xuyên suốt các tầng nối nhau, (b) validate mọi
 * tầng trên đều tới được qua cầu thang, (c) vẽ 1 ký hiệu khái niệm.
 *
 * `StaircaseCore` là dữ liệu DẪN XUẤT (derived) từ Geometry đã giải —
 * giống triết lý Wall/Door: không hand-author, chỉ tổng hợp lại từ các
 * GeometrySpace type="staircase" trên từng tầng để xác nhận chúng THỰC
 * SỰ thẳng hàng (không chỉ giả định đúng vì cùng công thức).
 */
export interface StaircaseCore {
  id: string;
  polygon: Point[];
  levels: number[]; // các tầng có mặt bằng cầu thang này (đã xác nhận thẳng hàng)
  width: number; // m — chiều rộng theo mặt tiền (Stage 2A: luôn = frontage, xem geometry.ts)
  direction: "vertical"; // Stage 2A: chỉ 1 thang thẳng duy nhất, chưa có thang dích dắc/xoắn ốc
}

export interface StaircaseValidationResult {
  passed: boolean;
  errors: string[];
  staircaseCore: StaircaseCore | null;
}

function bboxOf(polygon: Point[]) {
  const xs = polygon.map((p) => p.x);
  const ys = polygon.map((p) => p.y);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
}

function sameRect(a: Point[], b: Point[]): boolean {
  const ba = bboxOf(a);
  const bb = bboxOf(b);
  return (
    Math.abs(ba.x0 - bb.x0) < GEOMETRY_EPS &&
    Math.abs(ba.y0 - bb.y0) < GEOMETRY_EPS &&
    Math.abs(ba.x1 - bb.x1) < GEOMETRY_EPS &&
    Math.abs(ba.y1 - bb.y1) < GEOMETRY_EPS
  );
}

/**
 * Task 4 — validate ở mức toà nhà (không phải từng tầng riêng lẻ):
 * - mọi tầng > 0 phải reachable từ tầng 0 qua 1 chuỗi VerticalConnection liên tục.
 * - polygon cầu thang phải THẲNG HÀNG (trùng khít) giữa các tầng có nó —
 *   xác nhận lại bằng số liệu thật, không chỉ tin thuật toán luôn đúng.
 */
export function validateVerticalConnections(
  dig: DesignIntentGraph,
  geometry: Geometry,
): StaircaseValidationResult {
  const errors: string[] = [];
  const floorCount = dig.buildingContext.floors;

  if (floorCount <= 1) {
    return { passed: true, errors: [], staircaseCore: null };
  }

  // Chuỗi liên tục: phải có đúng 1 VerticalConnection cho mỗi (level, level+1).
  for (let level = 0; level < floorCount - 1; level++) {
    const hasConn = dig.verticalConnections.some((c) => c.fromLevel === level && c.toLevel === level + 1);
    if (!hasConn) {
      errors.push(`Tầng ${level + 1} không có VerticalConnection từ tầng ${level} — không thể lên tầng này qua cầu thang.`);
    }
  }

  const staircaseSpacesByLevel = geometry.floors
    .map((f) => ({ level: f.level, space: f.spaces.find((s) => s.type === "staircase") }))
    .filter((x): x is { level: number; space: NonNullable<typeof x.space> } => !!x.space);

  for (let level = 0; level < floorCount - 1; level++) {
    const hasHere = staircaseSpacesByLevel.some((x) => x.level === level);
    const hasAbove = staircaseSpacesByLevel.some((x) => x.level === level + 1);
    if (!hasHere || !hasAbove) {
      errors.push(`Cầu thang không có mặt bằng liên tục giữa tầng ${level} và tầng ${level + 1}.`);
    }
  }

  let staircaseCore: StaircaseCore | null = null;
  if (staircaseSpacesByLevel.length > 0) {
    const reference = staircaseSpacesByLevel[0].space.polygon;
    for (const { level, space } of staircaseSpacesByLevel) {
      if (!sameRect(reference, space.polygon)) {
        errors.push(`Mặt bằng cầu thang ở tầng ${level} không thẳng hàng với tầng ${staircaseSpacesByLevel[0].level}.`);
      }
    }
    const b = bboxOf(reference);
    staircaseCore = {
      id: "staircase",
      polygon: reference,
      levels: staircaseSpacesByLevel.map((x) => x.level),
      width: b.x1 - b.x0,
      direction: "vertical",
    };
  }

  return { passed: errors.length === 0, errors, staircaseCore };
}

export type { VerticalConnection };

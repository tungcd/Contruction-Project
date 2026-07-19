import type { DesignIntentGraph } from "./designIntentGraph";

/**
 * Layout Graph — tầng MỚI theo Tech Lead Review (21_...md mục 1-2).
 * LUÔN deterministic bất kể Design Intent Graph phía trên do rule hay
 * AI sinh ra — quyết định tô-pô VẬT LÝ cụ thể (cửa/hành lang/liên kết
 * đứng), không phải ý định ngữ nghĩa (adjacency/connection trừu tượng).
 *
 * Geometry Solver (bước sau) CHỈ đọc LayoutGraph, không đọc lại
 * DesignIntentGraph — giữ đúng ranh giới "Geometry only realizes
 * topology, does not infer it".
 */

export type LayoutEdgeType = "adjacency" | "connection" | "corridor" | "door" | "verticalConnection";

export interface LayoutNode {
  id: string;
  type: string;
  floor: number;
  priority: number;
  /** Bổ sung so với đề xuất gốc của Tech Lead — Geometry cần biết tỷ
   *  trọng diện tích, và theo đúng nguyên tắc "Geometry chỉ đọc
   *  LayoutGraph", areaWeight phải đi cùng LayoutNode thay vì Geometry
   *  quay lại đọc DesignIntentGraph. */
  areaWeight: number;
}

export interface LayoutEdge {
  type: LayoutEdgeType;
  from: string;
  to: string;
}

export interface LayoutGraph {
  /** Bổ sung so với đề xuất gốc — cùng lý do areaWeight: Geometry Solver
   *  chỉ được đọc LayoutGraph, nên kích thước đất phải đi kèm ở đây,
   *  không quay lại đọc ConstraintSet. */
  envelope: { frontage: number; depth: number };
  nodes: LayoutNode[];
  edges: LayoutEdge[];
}

// circulation/kitchen/bedroom/wc CÙNG priority (2) có chủ đích (Stage
// 1.7, Task 2): Design Intent Graph nối bếp/mọi phòng ngủ/wc trực tiếp
// tới hub "circulation" — Geometry Solver (nhóm node theo priority
// thành từng dải) phải xếp chúng CÙNG 1 dải để circulation thực sự đặt
// được thành 1 cột chạy suốt dải đó, chạm mọi phòng còn lại (xem
// geometry.ts `placeTierRowWithCirculation`). Khác priority sẽ tách
// circulation ra 1 dải riêng, làm mất đúng lý do nó tồn tại.
const TYPE_PRIORITY: Record<string, number> = {
  entrance: 0,
  living: 1,
  circulation: 2,
  kitchen: 2,
  bedroom: 2,
  wc: 2,
  worshipRoom: 2,
  balcony: 2,
  staircase: 2,
};

function priorityOf(type: string): number {
  return TYPE_PRIORITY[type] ?? 9;
}

/**
 * Mỗi `relationship.type = "connection"` trong Design Intent Graph trở
 * thành 1 `door` edge. Stage 2A: 1 LayoutGraph riêng cho MỖI TẦNG (Task
 * 4 — "Generate and validate one Layout Graph per floor") — id như
 * "circulation"/"staircase" lặp lại ở mỗi tầng nên phải tách riêng biệt,
 * không gộp chung 1 đồ thị (xem ghi chú ở designIntentGraph.ts).
 */
export function buildLayoutGraphForFloor(dig: DesignIntentGraph, level: number): LayoutGraph {
  const floor = dig.floors.find((f) => f.level === level);
  if (!floor) throw new Error(`Design Intent Graph không có tầng ${level}.`);

  const nodes: LayoutNode[] = floor.spaces.map((s) => ({
    id: s.id,
    type: s.type,
    floor: floor.level,
    priority: priorityOf(s.type),
    areaWeight: s.areaWeight,
  }));

  const edges: LayoutEdge[] = floor.relationships
    .filter((r) => r.type === "connection" || r.type === "adjacency")
    .map((r) => ({
      type: r.type === "connection" ? "door" : "adjacency",
      from: r.from,
      to: r.to,
    }));

  return {
    envelope: { frontage: dig.buildingContext.frontage, depth: dig.buildingContext.depth },
    nodes,
    edges,
  };
}

/** Tiện ích: dựng LayoutGraph cho TẤT CẢ tầng, đúng thứ tự level tăng dần. */
export function buildLayoutGraphsPerFloor(dig: DesignIntentGraph): LayoutGraph[] {
  return [...dig.floors].sort((a, b) => a.level - b.level).map((f) => buildLayoutGraphForFloor(dig, f.level));
}

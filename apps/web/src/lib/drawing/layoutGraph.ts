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

// bedroom/wc CÙNG priority (3) có chủ đích — Design Intent Graph nối cả
// hai loại này trực tiếp tới cùng 1 hub (kitchen), nên Geometry Solver
// (nhóm node theo priority thành từng dải) phải xếp chúng cùng 1 dải để
// dải đó thực sự liền kề hub — khác priority sẽ tách thành 2 dải riêng,
// khiến 1 trong 2 loại không còn chạm hub (bug phát hiện qua Manual POC
// Stage 1, xem 22_Completion-Report-Concept-Drawing-Stage1.md).
const TYPE_PRIORITY: Record<string, number> = {
  entrance: 0,
  living: 1,
  kitchen: 2,
  bedroom: 3,
  wc: 3,
};

function priorityOf(type: string): number {
  return TYPE_PRIORITY[type] ?? 9;
}

/**
 * Stage 1: mỗi `relationship.type = "connection"` trong Design Intent
 * Graph trở thành 1 `door` edge (chưa có hành lang/cầu thang ở Stage
 * này — 2 loại `corridor`/`verticalConnection` giữ trong enum cho Stage
 * 2, chưa dùng).
 */
export function buildLayoutGraph(dig: DesignIntentGraph): LayoutGraph {
  const nodes: LayoutNode[] = dig.floors.flatMap((floor) =>
    floor.spaces.map((s) => ({
      id: s.id,
      type: s.type,
      floor: floor.level,
      priority: priorityOf(s.type),
      areaWeight: s.areaWeight,
    })),
  );

  const edges: LayoutEdge[] = dig.relationships
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

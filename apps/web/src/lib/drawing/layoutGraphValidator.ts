import type { DesignIntentGraph } from "./designIntentGraph";
import type { LayoutGraph } from "./layoutGraph";

/**
 * Layout Graph Functional Validation — Stage 1.7, Task 3. Chạy TRƯỚC
 * Geometry Solver (Design Intent -> Layout Graph -> [VALIDATE] ->
 * Geometry), đúng hướng đã chốt ở Critical Architecture Correction: nếu
 * tô-pô không đạt các bất biến chức năng bắt buộc, phải FAIL ở đây —
 * KHÔNG được để Geometry sinh ra rồi mới phát hiện, càng không được sửa
 * Design Intent ngược lại để né lỗi (đó chính là lỗi Stage 1.6 đã mắc).
 *
 * Bất biến kiểm tra (Tech Lead Review — Stage 1.6 "Not Accepted"):
 * 1. Mọi phòng phải reachable từ entrance.
 * 2. Đường đi không được PHỤ THUỘC đi xuyên qua 1 phòng ngủ (private) để
 *    tới bếp/wc dùng chung/phòng ngủ khác — kiểm tra bằng cách loại bỏ
 *    từng bedroom khỏi đồ thị và xem các node còn lại có còn reachable
 *    không.
 * 3. Phòng service/dùng chung không được có DUY NHẤT 1 hàng xóm là 1
 *    phòng ngủ riêng tư (nếu vậy, lối vào duy nhất của nó xuyên qua
 *    phòng ngủ đó).
 */

export interface LayoutGraphValidationResult {
  passed: boolean;
  errors: string[];
}

function buildUndirectedAdjacency(
  edges: LayoutGraph["edges"],
  excludeIds: string[],
): Map<string, string[]> {
  const adj = new Map<string, string[]>();
  for (const e of edges) {
    if (excludeIds.includes(e.from) || excludeIds.includes(e.to)) continue;
    if (!adj.has(e.from)) adj.set(e.from, []);
    if (!adj.has(e.to)) adj.set(e.to, []);
    adj.get(e.from)!.push(e.to);
    adj.get(e.to)!.push(e.from);
  }
  return adj;
}

function reachableFrom(startId: string, adj: Map<string, string[]>): Set<string> {
  const visited = new Set<string>();
  const queue = [startId];
  while (queue.length) {
    const cur = queue.shift()!;
    if (visited.has(cur)) continue;
    visited.add(cur);
    for (const next of adj.get(cur) ?? []) if (!visited.has(next)) queue.push(next);
  }
  return visited;
}

/**
 * @param dig Design Intent Graph — nguồn xác định zone (bedroom = zone
 *   "private") để biết phòng nào là "riêng tư", không tự đoán qua type.
 *   Stage 2A: `dig` có thể chứa NHIỀU tầng, mỗi tầng có id lặp lại
 *   ("circulation"/"staircase") — CHỈ lấy đúng không gian của tầng ứng
 *   với `layoutGraph` này (lọc theo id có mặt trong `layoutGraph.nodes`,
 *   không dùng `dig.floors.flatMap(...)` gộp hết mọi tầng, tránh nhiễu
 *   chéo tầng khi id trùng nhau).
 */
export function validateLayoutGraphTopology(
  dig: DesignIntentGraph,
  layoutGraph: LayoutGraph,
): LayoutGraphValidationResult {
  const errors: string[] = [];
  const nodeIdsOnThisFloor = new Set(layoutGraph.nodes.map((n) => n.id));
  const allSpaces = dig.floors.flatMap((f) => f.spaces).filter((s) => nodeIdsOnThisFloor.has(s.id));
  const bedroomIds = allSpaces.filter((s) => s.zone === "private").map((s) => s.id);
  // Tầng có entrance (tầng trệt) lấy entrance làm gốc; tầng không có
  // entrance (tầng trên) lấy staircase làm gốc — đây là điểm vào duy
  // nhất của tầng đó (đi lên từ tầng dưới).
  const rootId = allSpaces.some((s) => s.id === "entrance") ? "entrance" : "staircase";
  const nonBedroomIds = allSpaces.filter((s) => s.zone !== "private" && s.id !== rootId).map((s) => s.id);

  // 1. Mọi node (trừ gốc của tầng) phải reachable từ gốc, không loại trừ gì.
  const fullAdj = buildUndirectedAdjacency(layoutGraph.edges, []);
  const allReachable = reachableFrom(rootId, fullAdj);
  for (const s of allSpaces) {
    if (s.id !== rootId && !allReachable.has(s.id)) {
      errors.push(`"${s.id}" không thể tới được từ "${rootId}" (đồ thị không liên thông).`);
    }
  }

  // 2. Với MỖI bedroom, loại nó khỏi đồ thị rồi kiểm tra: các node còn
  //    lại (không phải chính bedroom đó) vẫn phải reachable — nếu KHÔNG,
  //    nghĩa là đường đi gốc phụ thuộc đi xuyên qua bedroom này.
  for (const bedroomId of bedroomIds) {
    const adjWithout = buildUndirectedAdjacency(layoutGraph.edges, [bedroomId]);
    const reachableWithout = reachableFrom(rootId, adjWithout);
    for (const otherId of nonBedroomIds) {
      if (!reachableWithout.has(otherId)) {
        errors.push(
          `"${otherId}" chỉ tới được bằng cách đi xuyên qua phòng riêng tư "${bedroomId}" — vi phạm bất biến circulation (phòng dùng chung/bếp không được phụ thuộc đi qua phòng ngủ).`,
        );
      }
    }
    for (const otherBedroomId of bedroomIds) {
      if (otherBedroomId === bedroomId) continue;
      if (!reachableWithout.has(otherBedroomId)) {
        errors.push(
          `"${otherBedroomId}" chỉ tới được bằng cách đi xuyên qua phòng riêng tư khác "${bedroomId}" — mỗi phòng ngủ phải là nút cuối (terminal), không phải trạm trung chuyển.`,
        );
      }
    }
  }

  // 3. Phòng service/dùng chung (zone !== private, !== public "entrance")
  //    không được có DUY NHẤT 1 hàng xóm là bedroom.
  for (const s of allSpaces.filter((s) => s.zone === "service" || s.zone === "semiPrivate")) {
    const neighbors = layoutGraph.edges
      .filter((e) => e.from === s.id || e.to === s.id)
      .map((e) => (e.from === s.id ? e.to : e.from));
    if (neighbors.length === 1 && bedroomIds.includes(neighbors[0])) {
      errors.push(
        `"${s.id}" (dùng chung) chỉ kết nối duy nhất qua phòng riêng tư "${neighbors[0]}" — lối vào duy nhất của phòng dùng chung không được là 1 phòng ngủ.`,
      );
    }
  }

  return { passed: errors.length === 0, errors };
}

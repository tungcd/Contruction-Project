import type { ConstraintSet } from "@acc/shared-types";

/**
 * Design Intent Graph — Stage 1 (rule-based, KHÔNG AI). Schema tái dùng
 * từ Golden Contract #5 (Phase A, đã đóng băng), Owner đổi từ AI sang
 * deterministic rule cho Stage 1-2 (xem
 * documents/CHATGPT_CONTEXT/2026-07/2026-W29/2026-07-18/
 * 21_Architecture-Concept-Drawing-MVP-Revised.md).
 *
 * Đại diện Ý ĐỊNH không gian (không phải toạ độ) — Layout Graph (bước
 * sau) mới quyết định tô-pô vật lý cụ thể.
 */

export type Zone = "public" | "semiPrivate" | "private" | "service";
export type RelationshipType = "adjacency" | "connection" | "visualOpenTo" | "sequence";

export interface DesignIntentSpace {
  id: string;
  type: string; // "entrance" | "living" | "kitchen" | "bedroom" | "wc" | ...
  zone: Zone;
  areaWeight: number;
  facadeExposure: string[]; // Stage 1: luôn [] — chỉ cần cho Stage 4 Elevation
}

export interface DesignIntentGraph {
  buildingContext: {
    frontage: number;
    depth: number;
    floors: number;
    roofType: string | null;
    architecturalStyle: string | null;
  };
  floors: { level: number; spaces: DesignIntentSpace[] }[];
  relationships: { type: RelationshipType; from: string; to: string }[];
}

export class DesignIntentGraphError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DesignIntentGraphError";
  }
}

/**
 * Stage 1 — chỉ hỗ trợ 1 tầng, layout tuyến tính (entrance -> living ->
 * kitchen -> {bedrooms, wc}). Không xử lý otherRooms/excludedRooms (đưa
 * vào warnings, không tự bịa vị trí — No Silent Drop).
 */
export function generateDesignIntentGraph(
  constraintSet: ConstraintSet,
  warnings: string[],
): DesignIntentGraph {
  const { site, building, spaces, structure, style } = constraintSet;

  if (!site.frontage || !site.depth) {
    throw new DesignIntentGraphError(
      "Thiếu frontage/depth trong Constraint Set — Stage 1 cần đất hình chữ nhật có đủ 2 kích thước.",
    );
  }
  if ((building.floors?.value ?? 1) !== 1) {
    throw new DesignIntentGraphError(
      "Stage 1 chỉ hỗ trợ nhà 1 tầng — vượt phạm vi cho phép của Stage này.",
    );
  }

  const designSpaces: DesignIntentSpace[] = [
    { id: "entrance", type: "entrance", zone: "public", areaWeight: 0, facadeExposure: [] },
  ];
  const relationships: DesignIntentGraph["relationships"] = [];
  let lastHub = "entrance";

  if (spaces.livingRoom?.value) {
    designSpaces.push({ id: "living", type: "living", zone: "public", areaWeight: 1.4, facadeExposure: [] });
    relationships.push({ type: "connection", from: lastHub, to: "living" });
    lastHub = "living";
  }
  if (spaces.kitchen?.value) {
    designSpaces.push({ id: "kitchen", type: "kitchen", zone: "public", areaWeight: 1.0, facadeExposure: [] });
    relationships.push({ type: "connection", from: lastHub, to: "kitchen" });
    lastHub = "kitchen";
  }

  // Tầng private/service (bedroom + wc) — CÙNG priority ở Layout Graph
  // (xem layoutGraph.ts), Geometry Solver xếp chúng vào 1 dải: 1 phòng
  // nặng nhất đứng riêng 1 cột (luôn chạm hub phía trước), phòng đầu
  // tiên của nhóm còn lại CŨNG chạm hub (đầu cột thứ 2), các phòng sau
  // đó trong cột thứ 2 chỉ chạm phòng liền trước (xếp chồng theo chiều
  // sâu, không chạm lại hub) — xem geometry.ts `placeTierRow`. Vì vậy ở
  // đây KHÔNG thể nối mọi phòng thẳng tới hub như 1 ngôi sao — phải khai
  // báo đúng tô-pô sẽ thực sự đạt được về mặt hình học (Stage 1.6, sửa
  // lỗi "kitchen-wc không có cạnh chung" phát hiện khi đổi thuật toán
  // Stage 1.6 Task 3). Vì bedroom (weight 1.0) luôn nặng hơn wc (weight
  // 0.5), phòng "nặng nhất" luôn là bedroom-1 khi có >=1 bedroom.
  const privateServiceRooms: { id: string; type: string; zone: Zone; areaWeight: number }[] = [];
  const bedroomCount = spaces.bedrooms?.value ?? 0;
  for (let i = 1; i <= bedroomCount; i++) {
    privateServiceRooms.push({ id: `bedroom-${i}`, type: "bedroom", zone: "private", areaWeight: 1.0 });
  }
  const bathroomCount = spaces.bathrooms?.value ?? 0;
  for (let i = 1; i <= bathroomCount; i++) {
    privateServiceRooms.push({ id: `wc-${i}`, type: "wc", zone: "service", areaWeight: 0.5 });
  }

  privateServiceRooms.forEach((room, index) => {
    designSpaces.push({ ...room, facadeExposure: [] });
    // Phòng nặng nhất (luôn ở index 0 vì bedroom được thêm trước, nặng
    // hơn wc) và phòng đầu tiên của nhóm còn lại (index 1, nếu có) đều
    // chạm hub. Từ index 2 trở đi: chạm phòng ngay trước nó, không chạm
    // hub nữa (đúng thực tế cột 2 xếp chồng theo chiều sâu).
    const from = index <= 1 ? lastHub : privateServiceRooms[index - 1].id;
    relationships.push({ type: "connection", from, to: room.id });
  });

  if ((spaces.otherRooms?.value?.length ?? 0) > 0) {
    warnings.push(
      `Stage 1 chưa hỗ trợ đặt vị trí cho phòng tự do: ${spaces.otherRooms!.value.join(", ")} — chưa xuất hiện trong bản vẽ.`,
    );
  }
  if ((spaces.excludedRooms?.value?.length ?? 0) > 0) {
    warnings.push(
      `Ghi nhận loại trừ (chưa cần xử lý hình học ở Stage 1): ${spaces.excludedRooms!.value.join(", ")}.`,
    );
  }

  return {
    buildingContext: {
      frontage: site.frontage.value,
      depth: site.depth.value,
      floors: building.floors?.value ?? 1,
      roofType: structure.roofType?.value ?? null,
      architecturalStyle: style.architecturalStyle?.value ?? null,
    },
    floors: [{ level: 0, spaces: designSpaces }],
    relationships,
  };
}

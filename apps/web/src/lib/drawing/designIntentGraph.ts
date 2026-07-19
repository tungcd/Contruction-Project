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

export type Zone = "public" | "semiPrivate" | "private" | "service" | "circulation";
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

  if (spaces.livingRoom?.value) {
    designSpaces.push({ id: "living", type: "living", zone: "public", areaWeight: 1.4, facadeExposure: [] });
    relationships.push({ type: "connection", from: "entrance", to: "living" });
  }

  // CRITICAL ARCHITECTURE CORRECTION (Stage 1.7, Task 1/2 — Tech Lead
  // Review, Stage 1.6 "Not Accepted"): Stage 1.6 từng đổi tô-pô ở đây
  // (nối "chỉ 2 phòng đầu chạm hub, còn lại chạm phòng liền trước") để
  // KHỚP với thuật toán hình học đã chọn — Tech Lead xác nhận đây là lỗi
  // kiến trúc: không được đổi Ý ĐỊNH kiến trúc để geometry pass được
  // validation. Hướng đúng: Design Intent -> Layout Graph -> Geometry,
  // KHÔNG BAO GIỜ ngược lại.
  //
  // Sửa đúng: khai báo tường minh 1 node "circulation" (sảnh/hành lang) —
  // hub DUY NHẤT nối bếp/phòng ngủ/wc. Đây là bất biến chức năng bắt
  // buộc (không phải chi tiết hình học): lối vào bếp/mọi phòng ngủ/wc
  // dùng chung phải KHÔNG đi xuyên qua bất kỳ phòng ngủ nào — 1 phòng
  // ngủ riêng tư chỉ được là nút CUỐI (terminal) trong đường đi, không
  // bao giờ là trạm trung chuyển tới phòng khác. KHÔNG "sửa" yêu cầu này
  // bằng cách gắn nhãn WC là riêng tư (private) trừ khi Requirement nói
  // rõ đây là WC riêng (ensuite) — fixture hiện tại không có yêu cầu đó.
  //
  // Geometry Solver (geometry.ts, `placeTierRowWithCirculation`) đặt
  // circulation thành 1 cột hẹp CHẠY SUỐT chiều sâu của cả dải, nằm GIỮA
  // 2 cột phòng còn lại — nhờ vậy circulation chạm được TẤT CẢ các phòng
  // trong dải (không phụ thuộc phòng nào ở cột nào), hiện thực hoá đúng
  // tô-pô hub-and-spoke khai báo ở đây, không cần "chain" như Stage 1.6.
  const needsCirculation =
    (spaces.kitchen?.value ? 1 : 0) + (spaces.bedrooms?.value ?? 0) + (spaces.bathrooms?.value ?? 0) >= 2;
  let hub = "living";
  if (needsCirculation) {
    designSpaces.push({ id: "circulation", type: "circulation", zone: "circulation", areaWeight: 0, facadeExposure: [] });
    relationships.push({ type: "connection", from: hub, to: "circulation" });
    hub = "circulation";
  }

  if (spaces.kitchen?.value) {
    designSpaces.push({ id: "kitchen", type: "kitchen", zone: "public", areaWeight: 1.0, facadeExposure: [] });
    relationships.push({ type: "connection", from: hub, to: "kitchen" });
  }

  const bedroomCount = spaces.bedrooms?.value ?? 0;
  for (let i = 1; i <= bedroomCount; i++) {
    designSpaces.push({ id: `bedroom-${i}`, type: "bedroom", zone: "private", areaWeight: 1.0, facadeExposure: [] });
    relationships.push({ type: "connection", from: hub, to: `bedroom-${i}` });
  }
  const bathroomCount = spaces.bathrooms?.value ?? 0;
  for (let i = 1; i <= bathroomCount; i++) {
    designSpaces.push({ id: `wc-${i}`, type: "wc", zone: "service", areaWeight: 0.5, facadeExposure: [] });
    relationships.push({ type: "connection", from: hub, to: `wc-${i}` });
  }

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

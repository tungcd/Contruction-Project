import type { ConstraintSet } from "@acc/shared-types";
import { allocateFloors, type FloorRoomAllocation } from "./floorAllocation";

/**
 * Design Intent Graph — Stage 1 (rule-based, KHÔNG AI). Schema tái dùng
 * từ Golden Contract #5 (Phase A, đã đóng băng), Owner đổi từ AI sang
 * deterministic rule cho Stage 1-2 (xem
 * documents/CHATGPT_CONTEXT/2026-07/2026-W29/2026-07-18/
 * 21_Architecture-Concept-Drawing-MVP-Revised.md).
 *
 * Đại diện Ý ĐỊNH không gian (không phải toạ độ) — Layout Graph (bước
 * sau) mới quyết định tô-pô vật lý cụ thể.
 *
 * Stage 2A: `relationships` chuyển vào TỪNG TẦNG (không còn 1 mảng phẳng
 * dùng chung) — lý do: id như "circulation"/"staircase" LẶP LẠI ở mỗi
 * tầng (mỗi tầng có sảnh/cầu thang riêng), nên quan hệ phải được khai
 * báo trong đúng phạm vi tầng của nó, tránh id trùng giữa các tầng gây
 * mơ hồ khi Layout Graph Solver đọc lại. `verticalConnections` là khái
 * niệm MỚI, tách riêng (không phải 1 RelationshipType) — nối 2 node
 * "staircase" ở 2 tầng liền kề, đại diện việc di chuyển giữa tầng.
 */

export type Zone = "public" | "semiPrivate" | "private" | "service" | "circulation";
export type RelationshipType = "adjacency" | "connection" | "visualOpenTo" | "sequence";

export interface DesignIntentSpace {
  id: string;
  type: string; // "entrance" | "living" | "kitchen" | "bedroom" | "wc" | "circulation" | "staircase" | ...
  zone: Zone;
  areaWeight: number;
  facadeExposure: string[]; // Stage 1: luôn [] — chỉ cần cho Stage 4 Elevation
}

export interface VerticalConnection {
  staircaseId: string; // luôn "staircase" — id lặp lại có chủ đích ở mỗi tầng, xem ghi chú trên
  fromLevel: number;
  toLevel: number;
}

export interface DesignIntentGraph {
  buildingContext: {
    frontage: number;
    depth: number;
    floors: number;
    roofType: string | null;
    architecturalStyle: string | null;
  };
  floors: {
    level: number;
    spaces: DesignIntentSpace[];
    relationships: { type: RelationshipType; from: string; to: string }[];
  }[];
  verticalConnections: VerticalConnection[];
}

export class DesignIntentGraphError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DesignIntentGraphError";
  }
}

const STAIRCASE_TYPE = "staircase";

/** Dựng spaces + relationships cho ĐÚNG 1 tầng, tái dùng nguyên tắc circulation-là-hub đã chốt ở Stage 1.7. */
function buildFloorDesignIntent(
  floorAlloc: FloorRoomAllocation,
  hasStaircaseUp: boolean,
  hasStaircaseDown: boolean,
): { spaces: DesignIntentSpace[]; relationships: DesignIntentGraph["floors"][number]["relationships"] } {
  const spaces: DesignIntentSpace[] = [];
  const relationships: DesignIntentGraph["floors"][number]["relationships"] = [];
  let hub: string;

  if (floorAlloc.hasEntrance) {
    spaces.push({ id: "entrance", type: "entrance", zone: "public", areaWeight: 0, facadeExposure: [] });
    hub = "entrance";
    if (floorAlloc.hasLiving) {
      spaces.push({ id: "living", type: "living", zone: "public", areaWeight: 1.4, facadeExposure: [] });
      relationships.push({ type: "connection", from: hub, to: "living" });
      hub = "living";
    }
  } else {
    // Tầng không có lối vào riêng (tầng > 0) — điểm vào tầng là cầu
    // thang (đi lên từ tầng dưới), không phải "entrance".
    spaces.push({ id: STAIRCASE_TYPE, type: STAIRCASE_TYPE, zone: "circulation", areaWeight: 0, facadeExposure: [] });
    hub = STAIRCASE_TYPE;
  }

  // Danh sách "phòng" cần gắn vào hub của tầng này qua circulation (nếu
  // cần) — bếp/wc ở tầng trệt, phòng ngủ/wc ở tầng trên. Cầu thang ĐI
  // LÊN (nếu tầng này không phải tầng cao nhất) cũng là 1 điểm đến cần
  // gắn vào circulation của tầng trệt/tầng giữa — tầng đã dùng cầu thang
  // làm hub (floorAlloc.hasEntrance === false) thì KHÔNG cần thêm 1 cầu
  // thang nữa vào danh sách này (đã có sẵn ở vai trò hub).
  const attachments: { id: string; type: string; zone: Zone; areaWeight: number }[] = [];
  if (floorAlloc.hasKitchen) attachments.push({ id: "kitchen", type: "kitchen", zone: "public", areaWeight: 1.0 });
  for (const id of floorAlloc.bedroomIds) attachments.push({ id, type: "bedroom", zone: "private", areaWeight: 1.0 });
  for (const id of floorAlloc.bathroomIds) attachments.push({ id, type: "wc", zone: "service", areaWeight: 0.5 });
  if (floorAlloc.hasEntrance && hasStaircaseUp) {
    attachments.push({ id: STAIRCASE_TYPE, type: STAIRCASE_TYPE, zone: "circulation", areaWeight: 0 });
  }

  const needsCirculation = attachments.length >= 2;
  if (needsCirculation) {
    spaces.push({ id: "circulation", type: "circulation", zone: "circulation", areaWeight: 0, facadeExposure: [] });
    relationships.push({ type: "connection", from: hub, to: "circulation" });
    hub = "circulation";
  }
  for (const a of attachments) {
    spaces.push({ ...a, facadeExposure: [] });
    relationships.push({ type: "connection", from: hub, to: a.id });
  }

  return { spaces, relationships };
}

/**
 * Tầng 1 (Stage 1): entrance -> living -> circulation -> {kitchen,
 * bedrooms, wc}. Tầng nhiều hơn 1 (Stage 2A): mỗi tầng tự có
 * circulation/cầu thang riêng; entrance chỉ tồn tại ở tầng 0.
 * `otherRooms`/`excludedRooms` không xử lý hình học — đưa vào warnings
 * (No Silent Drop), giữ nguyên chính sách Stage 1.
 */
export function generateDesignIntentGraph(
  constraintSet: ConstraintSet,
  warnings: string[],
): DesignIntentGraph {
  const { site, building, spaces, structure, style } = constraintSet;

  if (!site.frontage || !site.depth) {
    throw new DesignIntentGraphError(
      "Thiếu frontage/depth trong Constraint Set — cần đất hình chữ nhật có đủ 2 kích thước.",
    );
  }

  const floorCount = building.floors?.value ?? 1;
  const allocation = allocateFloors(constraintSet);
  warnings.push(...allocation.assumptions);

  const floors: DesignIntentGraph["floors"] = allocation.floors.map((floorAlloc) => {
    const { spaces: floorSpaces, relationships } = buildFloorDesignIntent(
      floorAlloc,
      /* hasStaircaseUp */ floorAlloc.level < floorCount - 1,
      /* hasStaircaseDown */ floorAlloc.level > 0,
    );
    return { level: floorAlloc.level, spaces: floorSpaces, relationships };
  });

  const verticalConnections: VerticalConnection[] = [];
  for (let level = 0; level < floorCount - 1; level++) {
    verticalConnections.push({ staircaseId: STAIRCASE_TYPE, fromLevel: level, toLevel: level + 1 });
  }

  if ((spaces.otherRooms?.value?.length ?? 0) > 0) {
    warnings.push(
      `Chưa hỗ trợ đặt vị trí cho phòng tự do: ${spaces.otherRooms!.value.join(", ")} — chưa xuất hiện trong bản vẽ.`,
    );
  }
  if ((spaces.excludedRooms?.value?.length ?? 0) > 0) {
    warnings.push(`Ghi nhận loại trừ (chưa cần xử lý hình học): ${spaces.excludedRooms!.value.join(", ")}.`);
  }

  return {
    buildingContext: {
      frontage: site.frontage.value,
      depth: site.depth.value,
      floors: floorCount,
      roofType: structure.roofType?.value ?? null,
      architecturalStyle: style.architecturalStyle?.value ?? null,
    },
    floors,
    verticalConnections,
  };
}

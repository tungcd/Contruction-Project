import type { ConstraintSet } from "@acc/shared-types";
import { normalizeRoomProgram } from "./roomProgramNormalizer";

/**
 * Floor Allocation — Stage 2A, Task 1 (mở rộng Stage 2B, Task 1/2). Bước
 * xảy ra TRƯỚC khi dựng Design Intent Graph cho nhà nhiều tầng: quyết
 * định phòng nào (bếp/phòng ngủ/wc/phòng thờ/ban công) thuộc tầng nào,
 * TRƯỚC khi tính tô-pô/hình học.
 *
 * Ưu tiên (theo Tech Lead Review — Stage 2A Task 1):
 * 1. Thông tin phòng-theo-tầng tường minh trong Requirement, nếu có.
 * 2. Dữ liệu clarification đã xác nhận, nếu có.
 * 3. Heuristic fallback (dưới đây).
 *
 * Fixture `townhouse` hiện tại KHÔNG có chi tiết phòng-theo-tầng trong
 * Requirement (chỉ có tổng số phòng ngủ/wc) — luôn rơi vào fallback.
 * Mọi phân bổ heuristic đều được ghi vào `assumptions[]` (No Silent
 * Drop — không âm thầm quyết định thay khách hàng mà không nói rõ).
 */

export interface FloorRoomAllocation {
  level: number;
  hasEntrance: boolean;
  hasLiving: boolean;
  hasKitchen: boolean;
  bedroomIds: string[];
  bathroomIds: string[];
  hasWorshipRoom: boolean;
  hasBalcony: boolean;
}

export interface FloorAllocationResult {
  floors: FloorRoomAllocation[];
  assumptions: string[];
}

/** Chia `total` thành `n` phần gần bằng nhau nhất, dồn số dư vào các phần CUỐI (gần mái) — deterministic. */
function distributeEvenly(total: number, n: number): number[] {
  if (n <= 0) return [];
  const base = Math.floor(total / n);
  const remainder = total % n;
  return Array.from({ length: n }, (_, i) => base + (i >= n - remainder ? 1 : 0));
}

export function allocateFloors(constraintSet: ConstraintSet): FloorAllocationResult {
  const { spaces, building } = constraintSet;
  const floorCount = building.floors?.value ?? 1;
  const totalBedrooms = spaces.bedrooms?.value ?? 0;
  const totalBathrooms = spaces.bathrooms?.value ?? 0;
  const assumptions: string[] = [];
  const roomProgram = normalizeRoomProgram(constraintSet);

  const floors: FloorRoomAllocation[] = Array.from({ length: floorCount }, (_, level) => ({
    level,
    hasEntrance: level === 0,
    hasLiving: false,
    hasKitchen: false,
    bedroomIds: [],
    bathroomIds: [],
    hasWorshipRoom: false,
    hasBalcony: false,
  }));

  // Tầng trệt: phòng khách/bếp + 1 WC (nếu có) — Requirement không cho
  // chi tiết hơn nên áp dụng nguyên tắc phổ biến nhất cho nhà ống VN.
  floors[0].hasLiving = !!spaces.livingRoom?.value;
  floors[0].hasKitchen = !!spaces.kitchen?.value;
  let remainingBathrooms = totalBathrooms;
  let bathroomCounter = 1;
  if (floorCount > 1 && remainingBathrooms > 0) {
    floors[0].bathroomIds.push(`wc-${bathroomCounter++}`);
    remainingBathrooms -= 1;
  }

  if (floorCount === 1) {
    // Nhà 1 tầng (Stage 1 fixture `simple-house`) — giữ nguyên hành vi cũ:
    // toàn bộ phòng ngủ/wc dồn hết vào tầng duy nhất, không qua fallback
    // phân bổ nhiều tầng (không áp dụng, không có gì để "chia"). Phòng
    // thờ/ban công (Stage 2B) vẫn áp dụng được ngay cả ở nhà 1 tầng —
    // đặt vào tầng duy nhất luôn có.
    floors[0].bedroomIds = Array.from({ length: totalBedrooms }, (_, i) => `bedroom-${i + 1}`);
    floors[0].bathroomIds = Array.from({ length: totalBathrooms }, (_, i) => `wc-${i + 1}`);
    floors[0].hasWorshipRoom = roomProgram.hasWorshipRoom;
    floors[0].hasBalcony = !!spaces.balcony?.value;
    if (roomProgram.unrecognizedOtherRooms.length > 0) {
      assumptions.push(
        `Phòng tự do chưa nhận diện được (chưa xuất hiện trong bản vẽ): ${roomProgram.unrecognizedOtherRooms.join(", ")}.`,
      );
    }
    return { floors, assumptions };
  }

  const upperLevels = floors.slice(1); // tầng 1..N-1
  const bedroomSplit = distributeEvenly(totalBedrooms, upperLevels.length);
  const bathroomSplit = distributeEvenly(remainingBathrooms, upperLevels.length);

  let bedroomCounter = 1;
  upperLevels.forEach((floor, i) => {
    for (let k = 0; k < bedroomSplit[i]; k++) floor.bedroomIds.push(`bedroom-${bedroomCounter++}`);
    for (let k = 0; k < bathroomSplit[i]; k++) floor.bathroomIds.push(`wc-${bathroomCounter++}`);
  });

  // Task 1/2 (Stage 2B): phòng thờ (đã nhận diện từ otherRooms) và ban
  // công đặt ở TẦNG TRÊN CÙNG (đúng gợi ý fallback của Tech Lead Review).
  const topFloor = floors[floors.length - 1];
  topFloor.hasWorshipRoom = roomProgram.hasWorshipRoom;
  topFloor.hasBalcony = !!spaces.balcony?.value;

  assumptions.push(
    "Phân bổ phòng theo tầng dùng heuristic mặc định (Requirement không có chi tiết phòng theo từng tầng): tầng trệt = phòng khách/bếp/1 WC, các tầng còn lại chia đều phòng ngủ/WC còn lại, phòng thờ/ban công (nếu có) đặt ở tầng trên cùng.",
  );
  if (roomProgram.unrecognizedOtherRooms.length > 0) {
    assumptions.push(
      `Phòng tự do chưa nhận diện được (chưa xuất hiện trong bản vẽ): ${roomProgram.unrecognizedOtherRooms.join(", ")}.`,
    );
  }

  return { floors, assumptions };
}

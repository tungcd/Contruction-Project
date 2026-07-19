import type { ConstraintSet } from "@acc/shared-types";

/**
 * Room Program Normalizer — Stage 2B, Task 1. Chuẩn hoá TẠI RANH GIỚI
 * Drawing/Floor Allocation (KHÔNG sửa Requirement/ConstraintSet — 2 mô
 * hình đó đã đóng băng, xem [[project_requirement_domain_model_freeze]]).
 *
 * `otherRooms` là text tự do do người dùng nhập — 1 số tên phổ biến
 * thực ra tương ứng 1 loại phòng đã có chỗ đứng trong pipeline vẽ (vd
 * "phòng thờ ông bà" = worshipRoom). Nhận diện được thì coi là yêu cầu
 * CHÍNH THỨC (phải phân bổ, không chỉ cảnh báo); không nhận diện được
 * thì vẫn giữ nguyên chính sách cũ — chỉ cảnh báo, không tự bịa vị trí.
 */

const OTHER_ROOM_ALIASES: Record<string, "worshipRoom"> = {
  "phòng thờ ông bà": "worshipRoom",
  "phòng thờ": "worshipRoom",
  "phòng thờ gia tiên": "worshipRoom",
  "phòng thờ cúng": "worshipRoom",
};

export interface NormalizedRoomProgram {
  hasWorshipRoom: boolean;
  /** otherRooms KHÔNG nhận diện được — vẫn chỉ lên warning, không phân bổ (giữ đúng chính sách Stage 1). */
  unrecognizedOtherRooms: string[];
}

function normalizeKey(raw: string): string {
  return raw.trim().toLowerCase();
}

export function normalizeRoomProgram(constraintSet: ConstraintSet): NormalizedRoomProgram {
  const otherRooms = constraintSet.spaces.otherRooms?.value ?? [];
  let hasWorshipRoom = !!constraintSet.spaces.worshipRoom?.value;
  const unrecognizedOtherRooms: string[] = [];

  for (const raw of otherRooms) {
    const canonical = OTHER_ROOM_ALIASES[normalizeKey(raw)];
    if (canonical === "worshipRoom") {
      hasWorshipRoom = true;
    } else {
      unrecognizedOtherRooms.push(raw);
    }
  }

  return { hasWorshipRoom, unrecognizedOtherRooms };
}

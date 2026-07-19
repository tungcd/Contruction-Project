/**
 * Room Geometry Constraint — Stage 1.6, Task 2. KHÔNG phải Constraint
 * Solver tổng quát — chỉ đủ ràng buộc tối thiểu để chặn hình học phi
 * lý (phòng dạng "khe hẹp"), áp dụng SAU KHI Layout Generator đã đặt
 * hình (dùng để validate + để thuật toán tự điều chỉnh mục tiêu kích
 * thước — xem `geometry.ts`).
 *
 * Giá trị dưới đây là hằng số đề xuất của Claude (dựa trên kích thước
 * tối thiểu thông thường trong nhà ở dân dụng Việt Nam), KHÔNG phải số
 * liệu thị trường đã Founder xác nhận — giống tinh thần các "Open
 * Decision" đã nêu ở Phase A. Có thể chỉnh lại qua chính object này,
 * không rải rác trong code.
 */

export interface RoomGeometryConstraint {
  minWidth: number; // m
  minDepth: number; // m
  preferredAspectRatioMin: number; // cạnh dài / cạnh ngắn
  preferredAspectRatioMax: number;
  hardAspectRatioMax: number; // vượt ngưỡng này = fail cứng, không chỉ warning
}

export const ROOM_GEOMETRY_CONSTRAINTS: Record<string, RoomGeometryConstraint> = {
  living: {
    minWidth: 2.8,
    minDepth: 2.8,
    preferredAspectRatioMin: 1.0,
    preferredAspectRatioMax: 1.8,
    hardAspectRatioMax: 3.0,
  },
  kitchen: {
    minWidth: 1.8,
    minDepth: 1.8,
    preferredAspectRatioMin: 1.0,
    preferredAspectRatioMax: 2.2,
    hardAspectRatioMax: 3.5, // bếp chữ I/dài theo mặt tiền là bình thường, cho phép rộng hơn
  },
  bedroom: {
    minWidth: 2.4,
    minDepth: 2.4,
    preferredAspectRatioMin: 1.0,
    preferredAspectRatioMax: 1.5,
    hardAspectRatioMax: 2.0,
  },
  wc: {
    minWidth: 0.9,
    minDepth: 1.2,
    preferredAspectRatioMin: 1.0,
    preferredAspectRatioMax: 1.8,
    hardAspectRatioMax: 2.5,
  },
};

export function constraintFor(roomType: string): RoomGeometryConstraint | null {
  return ROOM_GEOMETRY_CONSTRAINTS[roomType] ?? null;
}

export function aspectRatioOf(width: number, depth: number): number {
  return Math.max(width, depth) / Math.min(width, depth);
}

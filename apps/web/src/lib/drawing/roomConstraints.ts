/**
 * Room Geometry Constraint — Stage 1.6, Task 2. KHÔNG phải Constraint
 * Solver tổng quát — chỉ đủ ràng buộc tối thiểu để chặn hình học phi
 * lý (phòng dạng "khe hẹp"), áp dụng SAU KHI Layout Generator đã đặt
 * hình (dùng để validate + để thuật toán tự điều chỉnh mục tiêu kích
 * thước — xem `geometry.ts`).
 *
 * Stage 2B, Task 3: thêm `preferredAreaMin/Max`/`hardAreaMax` — ràng
 * buộc trước đó (minWidth/minDepth/aspect ratio) chặn được phòng "khe
 * hẹp" nhưng KHÔNG chặn phòng phình to vô lý khi lô đất dư diện tích
 * (bug thật: WC 9-10.4m², phòng ngủ 20.8m² ở fixture `townhouse`, xem
 * Completion Report Stage 2B). `geometry.ts` dùng `preferredAreaMax` để
 * CHỦ ĐỘNG giới hạn kích thước khi đặt hình (không chỉ validate sau khi
 * đã lỡ đặt to), phần diện tích dư ra trở thành "residual" tường minh
 * (Task 4) thay vì bị các phòng khác âm thầm nuốt hết.
 *
 * Giá trị dưới đây là hằng số đề xuất của Claude (dựa trên kích thước
 * tối thiểu/hợp lý thông thường trong nhà ở dân dụng Việt Nam), KHÔNG
 * phải số liệu thị trường đã Founder xác nhận — giống tinh thần các
 * "Open Decision" đã nêu ở Phase A. Có thể chỉnh lại qua chính object
 * này, không rải rác trong code.
 */

export interface RoomGeometryConstraint {
  minWidth: number; // m
  minDepth: number; // m
  preferredAspectRatioMin: number; // cạnh dài / cạnh ngắn
  preferredAspectRatioMax: number;
  hardAspectRatioMax: number; // vượt ngưỡng này = fail cứng, không chỉ warning
  preferredAreaMin?: number; // m²
  preferredAreaMax?: number; // m² — geometry.ts dùng để giới hạn kích thước khi đặt hình
  hardAreaMax?: number; // m² — vượt ngưỡng này = fail cứng
}

export const ROOM_GEOMETRY_CONSTRAINTS: Record<string, RoomGeometryConstraint> = {
  living: {
    minWidth: 2.8,
    minDepth: 2.8,
    preferredAspectRatioMin: 1.0,
    preferredAspectRatioMax: 1.8,
    hardAspectRatioMax: 3.0,
    preferredAreaMin: 18,
    preferredAreaMax: 30,
    hardAreaMax: 35,
  },
  kitchen: {
    minWidth: 1.8,
    minDepth: 1.8,
    preferredAspectRatioMin: 1.0,
    preferredAspectRatioMax: 2.2,
    hardAspectRatioMax: 3.5, // bếp chữ I/dài theo mặt tiền là bình thường, cho phép rộng hơn
    preferredAreaMin: 10,
    preferredAreaMax: 18,
    hardAreaMax: 22,
  },
  bedroom: {
    minWidth: 2.4,
    minDepth: 2.4,
    preferredAspectRatioMin: 1.0,
    preferredAspectRatioMax: 1.5,
    hardAspectRatioMax: 2.0,
    preferredAreaMin: 9,
    preferredAreaMax: 18,
    hardAreaMax: 22,
  },
  wc: {
    minWidth: 0.9,
    minDepth: 1.2,
    preferredAspectRatioMin: 1.0,
    preferredAspectRatioMax: 1.8,
    hardAspectRatioMax: 2.5,
    preferredAreaMin: 2,
    preferredAreaMax: 6,
    hardAreaMax: 7,
  },
  worshipRoom: {
    minWidth: 2.0,
    minDepth: 2.0,
    preferredAspectRatioMin: 1.0,
    preferredAspectRatioMax: 1.8,
    hardAspectRatioMax: 2.5,
    preferredAreaMin: 8,
    preferredAreaMax: 15,
    hardAreaMax: 18,
  },
  balcony: {
    minWidth: 1.2,
    minDepth: 1.0,
    preferredAspectRatioMin: 1.0,
    preferredAspectRatioMax: 3.0, // ban công thường dẹt (rộng theo mặt tiền, sâu ít) — bình thường
    hardAspectRatioMax: 4.5,
    preferredAreaMin: 2,
    preferredAreaMax: 8,
    hardAreaMax: 10,
  },
};

export function constraintFor(roomType: string): RoomGeometryConstraint | null {
  return ROOM_GEOMETRY_CONSTRAINTS[roomType] ?? null;
}

export function aspectRatioOf(width: number, depth: number): number {
  return Math.max(width, depth) / Math.min(width, depth);
}

import type { Geometry, GeometrySpace, Point } from "./geometry";
import type { Wall } from "./wall";
import type { Door } from "./door";
import type { Window } from "./window";

/**
 * Drawing Document Model — dữ liệu thuần, KHÔNG biết gì về SVG/PDF
 * (Tech Lead Review mục 5). Renderer (svgRenderer.ts) đọc type này để
 * vẽ; đổi renderer không cần đổi type này.
 */

const ROOM_LABEL: Record<string, string> = {
  living: "Phòng khách",
  kitchen: "Bếp",
  bedroom: "Phòng ngủ",
  wc: "WC",
  entrance: "Lối vào",
  circulation: "Sảnh / Hành lang",
};

function labelFor(space: GeometrySpace, indexInType: number): string {
  const base = ROOM_LABEL[space.type] ?? space.type;
  return indexInType > 0 ? `${base} ${indexInType + 1}` : base;
}

function bboxOf(polygon: Point[]) {
  const xs = polygon.map((p) => p.x);
  const ys = polygon.map((p) => p.y);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
}

function areaOf(polygon: Point[]): number {
  const b = bboxOf(polygon);
  return (b.x1 - b.x0) * (b.y1 - b.y0);
}

export interface FloorPlanRoom {
  id: string;
  type: string;
  label: string;
  areaM2: number;
  polygon: Point[];
}

export interface Dimension {
  from: Point;
  to: Point;
  label: string;
}

export interface FloorPlanView {
  level: number;
  rooms: FloorPlanRoom[];
  walls: Wall[];
  doors: Door[];
  windows: Window[];
  dimensions: Dimension[];
  envelope: { frontage: number; depth: number };
}

export interface TitleBlock {
  projectName: string;
  scale: "NOT TO SCALE";
  disclaimer: string;
  generatedAt: string;
}

export interface DrawingSheet {
  floorPlan: FloorPlanView;
  titleBlock: TitleBlock;
  warnings: string[];
  assumptions: string[];
}

export interface DrawingPackage {
  sheets: DrawingSheet[];
}

const DISCLAIMER =
  "Bản vẽ khái niệm sơ bộ — dựa trên thông tin và giả định đã cung cấp, cần kiến trúc sư/kỹ sư kiểm tra lại, KHÔNG dùng để thi công trực tiếp.";

function buildFloorPlan(
  geometryFloor: Geometry["floors"][number],
  wallsOnFloor: Wall[],
  doorsOnFloor: Door[],
  windowsOnFloor: Window[],
  envelope: { frontage: number; depth: number },
): FloorPlanView {
  const typeCounter = new Map<string, number>();
  const rooms: FloorPlanRoom[] = geometryFloor.spaces
    .filter((s) => s.type !== "entrance") // entrance không có diện tích, không vẽ như 1 phòng
    .map((s) => {
      const idx = typeCounter.get(s.type) ?? 0;
      typeCounter.set(s.type, idx + 1);
      return { id: s.id, type: s.type, label: labelFor(s, idx), areaM2: areaOf(s.polygon), polygon: s.polygon };
    });

  // Stage 1.6, Task 6 (Visual QA) — phát hiện qua kiểm tra file
  // drawing-package.json thật: khi 1 phòng chiếm TRỌN cạnh mặt tiền
  // (vd "Phòng khách" ở tầng đầu), dimension riêng của nó trùng khít
  // dimension tổng của envelope (cùng toạ độ, nhãn khác định dạng "6 m"
  // vs "6.0 m") — 2 đường/2 label đè lên nhau khi vẽ. Bỏ dimension riêng
  // của phòng nếu nó trùng đúng cạnh envelope, không vẽ trùng lặp.
  const isRedundantWithEnvelope = (b: { x0: number; y0: number; x1: number }) =>
    b.y0 === 0 && b.x0 === 0 && b.x1 === envelope.frontage;

  const dimensions: Dimension[] = [
    { from: { x: 0, y: 0 }, to: { x: envelope.frontage, y: 0 }, label: `${envelope.frontage} m` },
    { from: { x: 0, y: 0 }, to: { x: 0, y: envelope.depth }, label: `${envelope.depth} m` },
    ...rooms
      .map((r) => bboxOf(r.polygon))
      .filter((b) => !isRedundantWithEnvelope(b))
      .map((b) => ({ from: { x: b.x0, y: b.y0 }, to: { x: b.x1, y: b.y0 }, label: `${(b.x1 - b.x0).toFixed(1)} m` })),
  ];

  return { level: geometryFloor.level, rooms, walls: wallsOnFloor, doors: doorsOnFloor, windows: windowsOnFloor, dimensions, envelope };
}

export function buildDrawingPackage(
  geometry: Geometry,
  walls: Wall[],
  doors: Door[],
  windows: Window[],
  projectName: string,
  warnings: string[],
  envelope: { frontage: number; depth: number },
): DrawingPackage {
  const generatedAt = new Date().toISOString();
  const sheets: DrawingSheet[] = geometry.floors.map((floor) => {
    const wallsOnFloor = walls.filter((w) => w.id.startsWith(`wall-${floor.level}-`));
    const wallIdsOnFloor = new Set(wallsOnFloor.map((w) => w.id));
    return {
      floorPlan: buildFloorPlan(
        floor,
        wallsOnFloor,
        doors.filter((d) => wallIdsOnFloor.has(d.wallId)),
        windows.filter((w) => wallIdsOnFloor.has(w.wallId)),
        envelope,
      ),
      titleBlock: { projectName, scale: "NOT TO SCALE", disclaimer: DISCLAIMER, generatedAt },
      warnings,
      assumptions: [
        "Vị trí cầu thang chưa áp dụng ở Stage 1 (nhà 1 tầng).",
        "Tỷ lệ diện tích từng phòng theo công thức mặc định, chưa qua kiến trúc sư duyệt.",
        "Vị trí cửa lấy tâm mỗi wall, chưa tối ưu theo lối đi thực tế.",
        "Đã tự thêm 1 sảnh/hành lang (circulation) làm lối đi chung tới bếp/phòng ngủ/WC để đảm bảo không phải đi xuyên qua phòng ngủ nào — đây là giả định bố trí, không phải phòng khách hàng yêu cầu.",
      ],
    };
  });
  return { sheets };
}

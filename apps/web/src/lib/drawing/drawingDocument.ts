import type { Geometry, GeometrySpace, Point } from "./geometry";
import type { Wall } from "./wall";

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

  const dimensions: Dimension[] = [
    { from: { x: 0, y: 0 }, to: { x: envelope.frontage, y: 0 }, label: `${envelope.frontage} m` },
    { from: { x: 0, y: 0 }, to: { x: 0, y: envelope.depth }, label: `${envelope.depth} m` },
    ...rooms.map((r) => {
      const b = bboxOf(r.polygon);
      return { from: { x: b.x0, y: b.y0 }, to: { x: b.x1, y: b.y0 }, label: `${(b.x1 - b.x0).toFixed(1)} m` };
    }),
  ];

  return { level: geometryFloor.level, rooms, walls: wallsOnFloor, dimensions, envelope };
}

export function buildDrawingPackage(
  geometry: Geometry,
  walls: Wall[],
  projectName: string,
  warnings: string[],
  envelope: { frontage: number; depth: number },
): DrawingPackage {
  const generatedAt = new Date().toISOString();
  const sheets: DrawingSheet[] = geometry.floors.map((floor) => ({
    floorPlan: buildFloorPlan(
      floor,
      walls.filter((w) => w.id.startsWith(`wall-${floor.level}-`)),
      envelope,
    ),
    titleBlock: { projectName, scale: "NOT TO SCALE", disclaimer: DISCLAIMER, generatedAt },
    warnings,
    assumptions: [
      "Vị trí cầu thang/hành lang chưa áp dụng ở Stage 1 (nhà 1 tầng).",
      "Tỷ lệ diện tích từng phòng theo công thức mặc định, chưa qua kiến trúc sư duyệt.",
    ],
  }));
  return { sheets };
}

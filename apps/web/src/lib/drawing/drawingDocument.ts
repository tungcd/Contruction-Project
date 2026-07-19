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
  staircase: "Cầu thang",
  worshipRoom: "Phòng thờ",
  balcony: "Ban công",
  residual: "Không gian chưa phân bổ",
};

/** Loại không cần đánh số toàn nhà (Stage 2B, Task 6) — hạ tầng dùng chung, không phải phòng khách hàng đếm số lượng. */
const NO_GLOBAL_NUMBERING_TYPES = new Set(["circulation", "staircase", "residual", "entrance"]);

/** Stage 2A, Task 5 — tên tầng hiển thị trên title block/selector. */
function floorLabel(level: number, floorCount: number): string {
  if (level === 0) return "Tầng trệt";
  if (level === floorCount - 1 && floorCount > 1) return `Tầng ${level} (Tầng trên cùng)`;
  return `Tầng ${level}`;
}

/**
 * Stage 2B, Task 6 — sửa lỗi thật: đánh số theo bộ đếm RIÊNG TỪNG TẦNG
 * (typeCounter reset mỗi tầng) khiến `bedroom-3` (tầng 2, phòng ngủ đầu
 * tiên NHÌN THẤY Ở TẦNG ĐÓ) hiển thị "Phòng ngủ" (không số) còn
 * `bedroom-4` hiển thị "Phòng ngủ 2" — số nhảy lộn xộn giữa các tầng.
 * Sửa: lấy số thứ tự TỪ CHÍNH id (vd "bedroom-3" -> số 3) — id đã global
 * duy nhất xuyên suốt toà nhà (do `floorAllocation.ts` đánh số), nên
 * label cũng nhất quán xuyên suốt, không phụ thuộc thứ tự duyệt trong 1
 * tầng. Hạ tầng dùng chung (circulation/staircase/residual/entrance)
 * không đánh số (không cần, luôn chỉ có 1 cái/tầng).
 */
function labelFor(space: GeometrySpace): string {
  const base = ROOM_LABEL[space.type] ?? space.type;
  if (NO_GLOBAL_NUMBERING_TYPES.has(space.type)) return base;
  const match = space.id.match(/-(\d+)$/);
  if (!match) return base;
  return `${base} ${match[1]}`;
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
  /** Stage 2A, Task 3 — hướng mũi tên cho ký hiệu cầu thang: tầng này có nối lên/xuống hay không. */
  hasStairUp: boolean;
  hasStairDown: boolean;
}

export interface TitleBlock {
  projectName: string;
  scale: "NOT TO SCALE";
  disclaimer: string;
  generatedAt: string;
  floorLabel: string;
  floorLevel: number;
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
  floorCount: number,
): FloorPlanView {
  const rooms: FloorPlanRoom[] = geometryFloor.spaces
    .filter((s) => s.type !== "entrance") // entrance không có diện tích, không vẽ như 1 phòng
    .map((s) => ({ id: s.id, type: s.type, label: labelFor(s), areaM2: areaOf(s.polygon), polygon: s.polygon }));

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

  return {
    level: geometryFloor.level,
    rooms,
    walls: wallsOnFloor,
    doors: doorsOnFloor,
    windows: windowsOnFloor,
    dimensions,
    envelope,
    hasStairUp: geometryFloor.level < floorCount - 1,
    hasStairDown: geometryFloor.level > 0,
  };
}

/** Stage 2B, Task 8 — cảnh báo gắn tiền tố "[Tầng N]" (xem generateDrawing.ts) chỉ hiện trên ĐÚNG sheet đó; cảnh báo KHÔNG có tiền tố tầng nào (heuristic phân bổ tầng, v.v.) coi là toàn nhà, hiện trên mọi sheet. */
function warningsForFloor(allWarnings: string[], level: number): string[] {
  const floorTagPattern = /^\[Tầng \d+\]/;
  return allWarnings.filter((w) => !floorTagPattern.test(w) || w.startsWith(`[Tầng ${level}]`));
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
  const floorCount = geometry.floors.length;
  const sheets: DrawingSheet[] = geometry.floors.map((floor) => {
    const wallsOnFloor = walls.filter((w) => w.id.startsWith(`wall-${floor.level}-`));
    const wallIdsOnFloor = new Set(wallsOnFloor.map((w) => w.id));
    const floorPlan = buildFloorPlan(
      floor,
      wallsOnFloor,
      doors.filter((d) => wallIdsOnFloor.has(d.wallId)),
      windows.filter((w) => wallIdsOnFloor.has(w.wallId)),
      envelope,
      floorCount,
    );

    const assumptions = [
      "Tỷ lệ diện tích từng phòng theo công thức mặc định, chưa qua kiến trúc sư duyệt.",
      "Vị trí cửa lấy tâm mỗi wall, chưa tối ưu theo lối đi thực tế.",
      "Đã tự thêm 1 sảnh/hành lang (circulation) làm lối đi chung tới bếp/phòng ngủ/WC để đảm bảo không phải đi xuyên qua phòng ngủ nào — đây là giả định bố trí, không phải phòng khách hàng yêu cầu.",
    ];
    if (floorCount > 1) {
      assumptions.push(
        "Nhà nhiều tầng: cầu thang đặt cố định 1 vị trí (rộng 2.0m x sâu 4.0m ~ 8m², góc phải sau) ở cuối mỗi tầng để đảm bảo thẳng hàng giữa các tầng — kích thước mẫu cho bản demo, chưa phải tính toán cầu thang thực tế.",
        "Phân bổ phòng theo tầng dùng heuristic mặc định (xem warnings) — chưa qua kiến trúc sư duyệt.",
      );
    }
    // Task 8 — giả định gắn ĐÚNG tầng có phòng đó, không lặp lại ở mọi sheet.
    if (floorPlan.rooms.some((r) => r.type === "worshipRoom")) {
      assumptions.push("Phòng thờ đặt ở tầng này theo heuristic mặc định (tầng trên cùng) — chưa qua kiến trúc sư duyệt vị trí phong thuỷ/tâm linh.");
    }
    if (floorPlan.rooms.some((r) => r.type === "balcony")) {
      assumptions.push("Ban công thể hiện dạng ban công lõm vào trong (inset) ở mặt tiền tầng này — mô hình sơ bộ, chưa tính công-xôn/kết cấu.");
    }
    if (floorPlan.rooms.some((r) => r.type === "residual")) {
      assumptions.push(
        "Còn diện tích chưa được phân bổ vào phòng nào cụ thể ở tầng này (hiển thị là \"Không gian chưa phân bổ\") — cần khách hàng/kiến trúc sư xác nhận công năng, KHÔNG tự ý gán cho 1 phòng nào.",
      );
    }

    return {
      floorPlan,
      titleBlock: {
        projectName,
        scale: "NOT TO SCALE",
        disclaimer: DISCLAIMER,
        generatedAt,
        floorLabel: floorLabel(floor.level, floorCount),
        floorLevel: floor.level,
      },
      warnings: warningsForFloor(warnings, floor.level),
      assumptions,
    };
  });
  return { sheets };
}

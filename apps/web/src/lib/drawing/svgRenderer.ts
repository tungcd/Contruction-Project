import type { DrawingSheet, FloorPlanView } from "./drawingDocument";
import type { Door } from "./door";
import type { Wall } from "./wall";

/**
 * SVG Renderer — hàm thuần, sinh chuỗi SVG thô (không phải React
 * component) để dùng lại nguyên vẹn cho cả hiển thị web LẪN in/PDF
 * (window.print() trên chính chuỗi này — xem Tech Lead Review mục 5,
 * tái dùng pattern Proposal Task 3, KHÔNG dựng renderer PDF riêng).
 *
 * Chỉ module NÀY được biết pixel (SCALE/MARGIN) — mọi input đều ở đơn
 * vị mét, đúng Coordinate & Unit Contract (xem geometry.ts). SVG dùng
 * `viewBox` + `width="100%"` (Stage 1.6, Task 5) — không phụ thuộc
 * canvas pixel cố định, co giãn theo khung chứa (web hoặc trang in).
 */

const SCALE = 30; // px / m (chỉ ảnh hưởng toạ độ NỘI BỘ viewBox, không phải kích thước hiển thị thật)
const MARGIN = 60; // px — chỗ cho dimension + title block

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

interface DoorOnWall {
  door: Door;
  offsetStart: number; // dọc theo wall, từ wall.start
  offsetEnd: number;
}

function doorsOnWall(wall: Wall, doors: Door[]): DoorOnWall[] {
  return doors
    .filter((d) => d.wallId === wall.id)
    .map((d) => ({ door: d, offsetStart: d.offset - d.width / 2, offsetEnd: d.offset + d.width / 2 }))
    .sort((a, b) => a.offsetStart - b.offsetStart);
}

/**
 * Stage 1.6, Task 4 — wall phải THỰC SỰ có khe hở tại vị trí cửa (không
 * chỉ đè 1 đoạn màu trắng lên tường liền mạch như Stage 1.5). Trả về
 * các đoạn "đặc" (solid) còn lại sau khi trừ đi các khoảng cửa.
 */
function wallSolidSegments(wall: Wall, doors: Door[]): { start: { x: number; y: number }; end: { x: number; y: number } }[] {
  const length = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
  if (length === 0) return [];
  const dirX = (wall.end.x - wall.start.x) / length;
  const dirY = (wall.end.y - wall.start.y) / length;
  const pointAt = (offset: number) => ({ x: wall.start.x + dirX * offset, y: wall.start.y + dirY * offset });

  const gaps = doorsOnWall(wall, doors);
  const segments: { start: { x: number; y: number }; end: { x: number; y: number } }[] = [];
  let cursor = 0;
  for (const gap of gaps) {
    if (gap.offsetStart > cursor) segments.push({ start: pointAt(cursor), end: pointAt(gap.offsetStart) });
    cursor = Math.max(cursor, gap.offsetEnd);
  }
  if (cursor < length) segments.push({ start: pointAt(cursor), end: pointAt(length) });
  return segments;
}

/** Ký hiệu cửa: đoạn cắt (đã xử lý ở wallSolidSegments) + lá cửa + vòng cung mở 90°. */
function doorSymbol(door: Door, wall: Wall, toPx: (m: number) => number): string {
  const length = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
  if (length === 0) return "";
  const dirX = (wall.end.x - wall.start.x) / length;
  const dirY = (wall.end.y - wall.start.y) / length;
  // Vuông góc với wall — quy ước cố định (xoay 90° ngược chiều kim đồng
  // hồ). Đơn giản hoá có chủ đích: KHÔNG thêm hingeSide/swingDirection
  // vào Door domain model (giữ nguyên như đã chốt) — renderer tự chọn 1
  // quy ước hiển thị nhất quán, không lưu lại quyết định này ở domain.
  const perpX = -dirY;
  const perpY = dirX;

  const hingeOffset = door.offset - door.width / 2;
  const openOffset = door.offset + door.width / 2;
  const hinge = { x: wall.start.x + dirX * hingeOffset, y: wall.start.y + dirY * hingeOffset };
  const openEnd = { x: wall.start.x + dirX * openOffset, y: wall.start.y + dirY * openOffset };
  const leafEnd = { x: hinge.x + perpX * door.width, y: hinge.y + perpY * door.width };

  const hingePx = { x: toPx(hinge.x), y: toPx(hinge.y) };
  const leafPx = { x: toPx(leafEnd.x), y: toPx(leafEnd.y) };
  const openPx = { x: toPx(openEnd.x), y: toPx(openEnd.y) };
  const radiusPx = door.width * SCALE;

  return `
    <line x1="${hingePx.x}" y1="${hingePx.y}" x2="${leafPx.x}" y2="${leafPx.y}" stroke="#374151" stroke-width="1.5" />
    <path d="M ${leafPx.x} ${leafPx.y} A ${radiusPx} ${radiusPx} 0 0 1 ${openPx.x} ${openPx.y}" fill="none" stroke="#9ca3af" stroke-width="1" stroke-dasharray="2,2" />
  `;
}

export function renderFloorPlanToSvg(sheet: DrawingSheet): string {
  const { floorPlan, titleBlock, warnings } = sheet;
  const width = floorPlan.envelope.frontage * SCALE + MARGIN * 2;
  const height = floorPlan.envelope.depth * SCALE + MARGIN * 2 + 120; // +120: title block/warnings dưới bản vẽ

  const toPx = (m: number) => m * SCALE + MARGIN;

  const roomRects = floorPlan.rooms
    .map((r) => {
      const xs = r.polygon.map((p) => toPx(p.x));
      const ys = r.polygon.map((p) => toPx(p.y));
      const x = Math.min(...xs);
      const y = Math.min(...ys);
      const w = Math.max(...xs) - x;
      const h = Math.max(...ys) - y;
      const cx = x + w / 2;
      const cy = y + h / 2;
      return `
        <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fafafa" stroke="none" />
        <text x="${cx}" y="${cy - 6}" text-anchor="middle" font-size="12" font-weight="600">${esc(r.label)}</text>
        <text x="${cx}" y="${cy + 10}" text-anchor="middle" font-size="10" fill="#666">${r.areaM2.toFixed(1)} m²</text>
      `;
    })
    .join("");

  // Exterior: đen, dày (3px). Interior: xám, mảnh (1.5px) — phân biệt cả
  // màu lẫn độ dày. Mỗi wall được cắt thành nhiều đoạn "đặc" quanh vị
  // trí cửa (Stage 1.6, Task 4) — không còn là 1 đường liền bị đè màu.
  const wallLines = floorPlan.walls
    .flatMap((w) => {
      const isExterior = w.type === "exterior";
      const strokeWidth = isExterior ? 3 : 1.5;
      const stroke = isExterior ? "#111827" : "#6b7280";
      return wallSolidSegments(w, floorPlan.doors).map(
        (seg) =>
          `<line x1="${toPx(seg.start.x)}" y1="${toPx(seg.start.y)}" x2="${toPx(seg.end.x)}" y2="${toPx(seg.end.y)}" stroke="${stroke}" stroke-width="${strokeWidth}" />`,
      );
    })
    .join("");

  const doorSymbols = floorPlan.doors
    .map((d) => {
      const wall = floorPlan.walls.find((w) => w.id === d.wallId);
      return wall ? doorSymbol(d, wall, toPx) : "";
    })
    .join("");

  const dimensionLines = floorPlan.dimensions
    .map((d) => {
      const x1 = toPx(d.from.x);
      const y1 = toPx(d.from.y) - 14;
      const x2 = toPx(d.to.x);
      const y2 = toPx(d.to.y) - 14;
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      return `
        <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#999" stroke-width="0.5" />
        <text x="${midX}" y="${midY - 4}" text-anchor="middle" font-size="9" fill="#999">${esc(d.label)}</text>
      `;
    })
    .join("");

  const warningsText = warnings
    .map((w, i) => `<text x="${MARGIN}" y="${height - 90 + i * 14}" font-size="10" fill="#b45309">⚠ ${esc(w)}</text>`)
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
    <rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff" />
    ${dimensionLines}
    ${roomRects}
    ${wallLines}
    ${doorSymbols}
    ${warningsText}
    <text x="${MARGIN}" y="${height - 40}" font-size="11" font-weight="600">${esc(titleBlock.projectName)} — Mặt bằng tầng (Concept)</text>
    <text x="${MARGIN}" y="${height - 24}" font-size="9" fill="#666">${esc(titleBlock.scale)} — Lập ngày ${new Date(titleBlock.generatedAt).toLocaleDateString("vi-VN")}</text>
    <text x="${MARGIN}" y="${height - 8}" font-size="9" fill="#b91c1c">${esc(titleBlock.disclaimer)}</text>
  </svg>`;
}

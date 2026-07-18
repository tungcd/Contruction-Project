import type { DrawingSheet, FloorPlanView } from "./drawingDocument";
import type { Door } from "./door";

/**
 * SVG Renderer — hàm thuần, sinh chuỗi SVG thô (không phải React
 * component) để dùng lại nguyên vẹn cho cả hiển thị web LẪN in/PDF
 * (window.print() trên chính chuỗi này — xem Tech Lead Review mục 5,
 * tái dùng pattern Proposal Task 3, KHÔNG dựng renderer PDF riêng).
 *
 * Chỉ module NÀY được biết pixel (SCALE/MARGIN) — mọi input đều ở đơn
 * vị mét, đúng Coordinate & Unit Contract (xem geometry.ts).
 */

const SCALE = 30; // px / m
const MARGIN = 60; // px — chỗ cho dimension + title block

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function doorSegment(door: Door, floorPlan: FloorPlanView, toPx: (m: number) => number): string {
  const wall = floorPlan.walls.find((w) => w.id === door.wallId);
  if (!wall) return "";
  const length = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
  if (length === 0) return "";
  const dirX = (wall.end.x - wall.start.x) / length;
  const dirY = (wall.end.y - wall.start.y) / length;
  const half = door.width / 2;
  const cx = wall.start.x + dirX * door.offset;
  const cy = wall.start.y + dirY * door.offset;
  const p1 = { x: cx - dirX * half, y: cy - dirY * half };
  const p2 = { x: cx + dirX * half, y: cy + dirY * half };
  // Đè 1 đoạn trắng lên wall để tạo khe hở, rồi vẽ 1 đường nét đứt xanh
  // đánh dấu vị trí cửa — đơn giản, không cần ký hiệu vòng cung mở cửa
  // (swingDirection là optional ở Stage 1.5, chưa implement).
  return `
    <line x1="${toPx(p1.x)}" y1="${toPx(p1.y)}" x2="${toPx(p2.x)}" y2="${toPx(p2.y)}" stroke="#ffffff" stroke-width="5" />
    <line x1="${toPx(p1.x)}" y1="${toPx(p1.y)}" x2="${toPx(p2.x)}" y2="${toPx(p2.y)}" stroke="#2563eb" stroke-width="1.5" stroke-dasharray="3,2" />
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

  // Exterior: đen, dày (3px). Interior: xám, mảnh (1.5px) — phân biệt
  // được cả bằng màu lẫn độ dày (Stage 1.5 Task 5 — trước đó chỉ khác
  // độ dày, cùng màu, khó phân biệt khi thu nhỏ/in đen trắng nhạt).
  const wallLines = floorPlan.walls
    .map((w) => {
      const isExterior = w.type === "exterior";
      const strokeWidth = isExterior ? 3 : 1.5;
      const stroke = isExterior ? "#111827" : "#6b7280";
      return `<line x1="${toPx(w.start.x)}" y1="${toPx(w.start.y)}" x2="${toPx(w.end.x)}" y2="${toPx(w.end.y)}" stroke="${stroke}" stroke-width="${strokeWidth}" />`;
    })
    .join("");

  const doorLines = floorPlan.doors.map((d) => doorSegment(d, floorPlan, toPx)).join("");

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

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff" />
    ${dimensionLines}
    ${roomRects}
    ${wallLines}
    ${doorLines}
    ${warningsText}
    <text x="${MARGIN}" y="${height - 40}" font-size="11" font-weight="600">${esc(titleBlock.projectName)} — Mặt bằng tầng (Concept)</text>
    <text x="${MARGIN}" y="${height - 24}" font-size="9" fill="#666">${esc(titleBlock.scale)} — Lập ngày ${new Date(titleBlock.generatedAt).toLocaleDateString("vi-VN")}</text>
    <text x="${MARGIN}" y="${height - 8}" font-size="9" fill="#b91c1c">${esc(titleBlock.disclaimer)}</text>
  </svg>`;
}

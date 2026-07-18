import type { DrawingSheet } from "./drawingDocument";

/**
 * SVG Renderer — hàm thuần, sinh chuỗi SVG thô (không phải React
 * component) để dùng lại nguyên vẹn cho cả hiển thị web LẪN in/PDF
 * (window.print() trên chính chuỗi này — xem Tech Lead Review mục 5,
 * tái dùng pattern Proposal Task 3, KHÔNG dựng renderer PDF riêng).
 */

const SCALE = 30; // px / m
const MARGIN = 60; // px — chỗ cho dimension + title block

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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

  const wallLines = floorPlan.walls
    .map((w) => {
      const strokeWidth = w.type === "exterior" ? 3 : 1.5;
      return `<line x1="${toPx(w.start.x)}" y1="${toPx(w.start.y)}" x2="${toPx(w.end.x)}" y2="${toPx(w.end.y)}" stroke="#222" stroke-width="${strokeWidth}" />`;
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

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff" />
    ${dimensionLines}
    ${roomRects}
    ${wallLines}
    ${warningsText}
    <text x="${MARGIN}" y="${height - 40}" font-size="11" font-weight="600">${esc(titleBlock.projectName)} — Mặt bằng tầng (Concept)</text>
    <text x="${MARGIN}" y="${height - 24}" font-size="9" fill="#666">${esc(titleBlock.scale)} — Lập ngày ${new Date(titleBlock.generatedAt).toLocaleDateString("vi-VN")}</text>
    <text x="${MARGIN}" y="${height - 8}" font-size="9" fill="#b91c1c">${esc(titleBlock.disclaimer)}</text>
  </svg>`;
}

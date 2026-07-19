import type { DrawingSheet, Dimension } from "./drawingDocument";
import type { Door } from "./door";
import type { Wall } from "./wall";
import type { Window } from "./window";
import type { Point } from "./geometry";

/**
 * SVG Renderer — hàm thuần, sinh chuỗi SVG thô, dùng lại nguyên vẹn cho
 * cả hiển thị web LẪN in/PDF (window.print() trên chính chuỗi này — Tech
 * Lead Review mục 5, tái dùng pattern Proposal Task 3, KHÔNG dựng
 * renderer PDF riêng).
 *
 * Stage 1.7, Task 6 (Critical fix — Stage 1.6 SVG không fit 1 trang A4,
 * bị cắt chữ): KHÔNG còn "vẽ khít nội dung rồi width:100%" — viewBox
 * LUÔN đúng tỷ lệ A4 (595x842, đơn vị pt), chia thành các VÙNG cố định
 * (header/viewport/warnings/disclaimer). `scale` (m -> px) tính từ CẢ 2
 * chiều rộng/sâu của khung vẽ còn lại (`Math.min`), không chỉ 1 chiều —
 * đảm bảo mặt bằng luôn nằm gọn trong vùng viewport, không tràn trang.
 *
 * Chỉ module NÀY được biết pixel/toạ độ trang in — mọi input đều ở đơn
 * vị mét, đúng Coordinate & Unit Contract (xem geometry.ts).
 */

// Kích thước trang A4 chân phương ở đơn vị "point" (1/72 inch) — cùng hệ
// quy ước @page { size: A4 } trong globals.css, KHÔNG lẫn với mét domain.
const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const PAGE_MARGIN = 24;
const HEADER_HEIGHT = 46;
// Khoảng chừa bên trong viewport CHO dimension tổng (width phía trên,
// depth phía trái) — tách biệt khỏi vùng mặt bằng thực tế.
const DIM_TOP = 28;
const DIM_LEFT = 42;

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Task 7 — bọc dòng theo ước lượng bề rộng ký tự trung bình (không có
 * font-metrics thật trong hàm sinh chuỗi thuần) — đủ để KHÔNG chữ nào
 * tràn ra ngoài khung chứa, không cần chính xác tuyệt đối (bản vẽ khái
 * niệm, không phải typesetting engine).
 */
function wrapText(text: string, maxWidthPx: number, fontSize: number): string[] {
  const avgCharWidth = fontSize * 0.55;
  const maxChars = Math.max(4, Math.floor(maxWidthPx / avgCharWidth));
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function tspanBlock(x: number, yCenter: number, lines: string[], fontSize: number, attrs: string): string {
  const lineHeight = fontSize * 1.2;
  const totalHeight = lines.length * lineHeight;
  const startY = yCenter - totalHeight / 2 + lineHeight * 0.8;
  const tspans = lines.map((l, i) => `<tspan x="${x}" y="${startY + i * lineHeight}">${esc(l)}</tspan>`).join("");
  return `<text x="${x}" font-size="${fontSize}" ${attrs}>${tspans}</text>`;
}

/**
 * Task 7 — nhãn phòng phải nằm gọn trong polygon: bọc dòng theo bề rộng
 * phòng, GIẢM font-size dần (có sàn tối thiểu) nếu vẫn không vừa chiều
 * cao dành cho nhãn (~55% chiều cao phòng, phần còn lại cho dòng diện
 * tích). Cụ thể sửa lỗi "Phòng ngủ 2" tràn ra ngoài polygon ở Stage 1.6.
 */
function fitLabel(label: string, pxWidth: number, pxHeight: number): { fontSize: number; lines: string[] } {
  const minFontSize = 8;
  let fontSize = 12;
  const padding = 10;
  let lines = wrapText(label, pxWidth - padding, fontSize);
  while (
    fontSize > minFontSize &&
    (lines.length * fontSize * 1.2 > pxHeight * 0.55 || lines.some((l) => l.length * fontSize * 0.55 > pxWidth - padding + 1))
  ) {
    fontSize -= 1;
    lines = wrapText(label, pxWidth - padding, fontSize);
  }
  return { fontSize, lines };
}

interface Opening {
  start: number;
  end: number;
}

function openingsOnWall(wall: Wall, doors: Door[], windows: Window[]): Opening[] {
  const doorOpenings = doors.filter((d) => d.wallId === wall.id).map((d) => ({ start: d.offset - d.width / 2, end: d.offset + d.width / 2 }));
  const windowOpenings = windows.filter((w) => w.wallId === wall.id).map((w) => ({ start: w.offset - w.width / 2, end: w.offset + w.width / 2 }));
  return [...doorOpenings, ...windowOpenings].sort((a, b) => a.start - b.start);
}

/** Wall phải THỰC SỰ có khe hở tại vị trí cửa/cửa sổ, không chỉ đè màu trắng. */
function wallSolidSegments(wall: Wall, doors: Door[], windows: Window[]): { start: Point; end: Point }[] {
  const length = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
  if (length === 0) return [];
  const dirX = (wall.end.x - wall.start.x) / length;
  const dirY = (wall.end.y - wall.start.y) / length;
  const pointAt = (offset: number) => ({ x: wall.start.x + dirX * offset, y: wall.start.y + dirY * offset });

  const gaps = openingsOnWall(wall, doors, windows);
  const segments: { start: Point; end: Point }[] = [];
  let cursor = 0;
  for (const gap of gaps) {
    if (gap.start > cursor) segments.push({ start: pointAt(cursor), end: pointAt(gap.start) });
    cursor = Math.max(cursor, gap.end);
  }
  if (cursor < length) segments.push({ start: pointAt(cursor), end: pointAt(length) });
  return segments;
}

/** Ký hiệu cửa đi: lá cửa (line) + vòng cung mở 90° — quy ước hiển thị cố định, KHÔNG lưu ở Door domain model. */
function doorSymbol(door: Door, wall: Wall, toPx: (p: Point) => Point, scale: number): string {
  const length = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
  if (length === 0) return "";
  const dirX = (wall.end.x - wall.start.x) / length;
  const dirY = (wall.end.y - wall.start.y) / length;
  const perpX = -dirY;
  const perpY = dirX;

  const hingeOffset = door.offset - door.width / 2;
  const openOffset = door.offset + door.width / 2;
  const hinge = { x: wall.start.x + dirX * hingeOffset, y: wall.start.y + dirY * hingeOffset };
  const openEnd = { x: wall.start.x + dirX * openOffset, y: wall.start.y + dirY * openOffset };
  const leafEnd = { x: hinge.x + perpX * door.width, y: hinge.y + perpY * door.width };

  const hingePx = toPx(hinge);
  const leafPx = toPx(leafEnd);
  const openPx = toPx(openEnd);
  const radiusPx = door.width * scale;

  return `
    <line x1="${hingePx.x}" y1="${hingePx.y}" x2="${leafPx.x}" y2="${leafPx.y}" stroke="#374151" stroke-width="1.5" />
    <path d="M ${leafPx.x} ${leafPx.y} A ${radiusPx} ${radiusPx} 0 0 1 ${openPx.x} ${openPx.y}" fill="none" stroke="#9ca3af" stroke-width="1" stroke-dasharray="2,2" />
  `;
}

/** Ký hiệu cửa sổ đơn giản (Stage 1.7, Task 5) — 1 đoạn màu riêng biệt bắc qua khe hở, KHÔNG lá/vòng cung (phân biệt trực quan với cửa đi). */
function windowSymbol(win: Window, wall: Wall, toPx: (p: Point) => Point): string {
  const length = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
  if (length === 0) return "";
  const dirX = (wall.end.x - wall.start.x) / length;
  const dirY = (wall.end.y - wall.start.y) / length;
  const p1 = { x: wall.start.x + dirX * (win.offset - win.width / 2), y: wall.start.y + dirY * (win.offset - win.width / 2) };
  const p2 = { x: wall.start.x + dirX * (win.offset + win.width / 2), y: wall.start.y + dirY * (win.offset + win.width / 2) };
  const p1px = toPx(p1);
  const p2px = toPx(p2);
  return `<line x1="${p1px.x}" y1="${p1px.y}" x2="${p2px.x}" y2="${p2px.y}" stroke="#2563eb" stroke-width="2.5" />`;
}

/**
 * Ký hiệu cầu thang khái niệm (Stage 2A, Task 3) — KHÔNG phải bản vẽ
 * kết cấu thật: vài đường kẻ mô phỏng bậc thang (đều nhau, ngang qua
 * chiều sâu phòng cầu thang) + 1 mũi tên chỉ hướng lên/xuống + nhãn nối
 * tầng. Nếu tầng vừa nối lên vừa nối xuống, vẽ mũi tên 2 CHIỀU đơn giản
 * (2 đầu mũi tên).
 */
function stairSymbol(x: number, y: number, w: number, h: number, hasUp: boolean, hasDown: boolean): string {
  const STEP_COUNT = 8;
  const stepLines: string[] = [];
  for (let i = 1; i < STEP_COUNT; i++) {
    const stepY = y + (h / STEP_COUNT) * i;
    stepLines.push(`<line x1="${x + w * 0.15}" y1="${stepY}" x2="${x + w * 0.85}" y2="${stepY}" stroke="#bbb" stroke-width="0.75" />`);
  }
  const arrowX = x + w / 2;
  const arrowTop = y + h * 0.15;
  const arrowBottom = y + h * 0.85;
  const arrowHeadSize = Math.min(6, w * 0.08, h * 0.08);
  let arrow = `<line x1="${arrowX}" y1="${arrowTop}" x2="${arrowX}" y2="${arrowBottom}" stroke="#374151" stroke-width="1.2" />`;
  if (hasUp) {
    arrow += `<path d="M ${arrowX - arrowHeadSize} ${arrowTop + arrowHeadSize} L ${arrowX} ${arrowTop} L ${arrowX + arrowHeadSize} ${arrowTop + arrowHeadSize}" fill="none" stroke="#374151" stroke-width="1.2" />`;
  }
  if (hasDown) {
    arrow += `<path d="M ${arrowX - arrowHeadSize} ${arrowBottom - arrowHeadSize} L ${arrowX} ${arrowBottom} L ${arrowX + arrowHeadSize} ${arrowBottom - arrowHeadSize}" fill="none" stroke="#374151" stroke-width="1.2" />`;
  }
  return `${stepLines.join("")}${arrow}`;
}

const OVERALL_EPS = 1e-6;

function isOverallWidth(d: Dimension, envelope: { frontage: number; depth: number }): boolean {
  return (
    Math.abs(d.from.x) < OVERALL_EPS &&
    Math.abs(d.from.y) < OVERALL_EPS &&
    Math.abs(d.to.y) < OVERALL_EPS &&
    Math.abs(d.to.x - envelope.frontage) < OVERALL_EPS
  );
}

function isOverallDepth(d: Dimension, envelope: { frontage: number; depth: number }): boolean {
  return (
    Math.abs(d.from.x) < OVERALL_EPS &&
    Math.abs(d.from.y) < OVERALL_EPS &&
    Math.abs(d.to.x) < OVERALL_EPS &&
    Math.abs(d.to.y - envelope.depth) < OVERALL_EPS
  );
}

export function renderFloorPlanToSvg(sheet: DrawingSheet): string {
  const { floorPlan, titleBlock, warnings } = sheet;
  const { envelope } = floorPlan;
  const contentWidth = PAGE_WIDTH - 2 * PAGE_MARGIN;

  // Task 8 — bọc trước disclaimer/warnings để biết chính xác chiều cao
  // vùng footer cần chừa (không đoán 1 số cố định như Stage 1.6).
  const disclaimerLines = wrapText(titleBlock.disclaimer, contentWidth, 8);
  const warningLines = warnings.flatMap((w) => wrapText(`⚠ ${w}`, contentWidth, 9));
  const disclaimerHeight = disclaimerLines.length * 11 + 8;
  const warningsHeight = warningLines.length > 0 ? warningLines.length * 12 + 12 : 0;
  const footerHeight = 16 + warningsHeight + disclaimerHeight + 8;

  const viewportX0 = PAGE_MARGIN;
  const viewportX1 = PAGE_WIDTH - PAGE_MARGIN;
  const viewportY0 = PAGE_MARGIN + HEADER_HEIGHT;
  const viewportY1 = PAGE_HEIGHT - PAGE_MARGIN - footerHeight;
  const viewportWidth = viewportX1 - viewportX0;
  const viewportHeight = viewportY1 - viewportY0;

  const planAreaX0 = viewportX0 + DIM_LEFT;
  const planAreaY0 = viewportY0 + DIM_TOP;
  const planAreaWidth = viewportWidth - DIM_LEFT;
  const planAreaHeight = viewportHeight - DIM_TOP;

  // Scale tính từ CẢ 2 chiều (Task 6) — đảm bảo mặt bằng luôn fit gọn
  // trong vùng viewport còn lại, không phụ thuộc chiều nào chiếm ưu thế.
  const scale = Math.min(planAreaWidth / envelope.frontage, planAreaHeight / envelope.depth);
  const planPxWidth = envelope.frontage * scale;
  const planPxHeight = envelope.depth * scale;
  const offsetX = planAreaX0 + (planAreaWidth - planPxWidth) / 2;
  const offsetY = planAreaY0 + (planAreaHeight - planPxHeight) / 2;

  const toPx = (p: Point): Point => ({ x: offsetX + p.x * scale, y: offsetY + p.y * scale });

  const roomRects = floorPlan.rooms
    .map((r) => {
      const xs = r.polygon.map((p) => toPx(p).x);
      const ys = r.polygon.map((p) => toPx(p).y);
      const x = Math.min(...xs);
      const y = Math.min(...ys);
      const w = Math.max(...xs) - x;
      const h = Math.max(...ys) - y;
      const cx = x + w / 2;
      const labelCy = y + h * 0.38;
      const areaCy = y + h * 0.72;
      const { fontSize, lines } = fitLabel(r.label, w, h);
      const labelBlock = tspanBlock(cx, labelCy, lines, fontSize, `text-anchor="middle" font-weight="600"`);
      const fill = r.type === "staircase" ? "#f0f0f0" : "#fafafa";
      const stairLines = r.type === "staircase" ? stairSymbol(x, y, w, h, floorPlan.hasStairUp, floorPlan.hasStairDown) : "";
      return `
        <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="none" />
        ${stairLines}
        ${labelBlock}
        <text x="${cx}" y="${areaCy}" text-anchor="middle" font-size="9" fill="#666">${r.areaM2.toFixed(1)} m²</text>
      `;
    })
    .join("");

  const wallLines = floorPlan.walls
    .flatMap((w) => {
      const isExterior = w.type === "exterior";
      const strokeWidth = isExterior ? 3 : 1.5;
      const stroke = isExterior ? "#111827" : "#6b7280";
      return wallSolidSegments(w, floorPlan.doors, floorPlan.windows).map((seg) => {
        const a = toPx(seg.start);
        const b = toPx(seg.end);
        return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${stroke}" stroke-width="${strokeWidth}" />`;
      });
    })
    .join("");

  const doorSymbols = floorPlan.doors
    .map((d) => {
      const wall = floorPlan.walls.find((w) => w.id === d.wallId);
      return wall ? doorSymbol(d, wall, toPx, scale) : "";
    })
    .join("");

  const windowSymbols = floorPlan.windows
    .map((win) => {
      const wall = floorPlan.walls.find((w) => w.id === win.wallId);
      return wall ? windowSymbol(win, wall, toPx) : "";
    })
    .join("");

  // Task 8 — dimension tổng (width/depth) tách biệt: có extension line
  // ra khỏi mặt bằng, đặt ở vùng DIM_TOP/DIM_LEFT đã chừa riêng; depth
  // dùng label xoay dọc để không đè lên chính đường dimension.
  const overallWidthDim = floorPlan.dimensions.find((d) => isOverallWidth(d, envelope));
  const overallDepthDim = floorPlan.dimensions.find((d) => isOverallDepth(d, envelope));
  const subDimensions = floorPlan.dimensions.filter((d) => d !== overallWidthDim && d !== overallDepthDim);

  let overallDimSvg = "";
  if (overallWidthDim) {
    const y = planAreaY0 - 8;
    const x0 = offsetX;
    const x1 = offsetX + planPxWidth;
    overallDimSvg += `
      <line x1="${x0}" y1="${y}" x2="${x0}" y2="${offsetY}" stroke="#bbb" stroke-width="0.5" />
      <line x1="${x1}" y1="${y}" x2="${x1}" y2="${offsetY}" stroke="#bbb" stroke-width="0.5" />
      <line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="#666" stroke-width="0.6" />
      <text x="${(x0 + x1) / 2}" y="${y - 4}" text-anchor="middle" font-size="9" fill="#333">${esc(overallWidthDim.label)}</text>
    `;
  }
  if (overallDepthDim) {
    const x = planAreaX0 - 10;
    const y0 = offsetY;
    const y1 = offsetY + planPxHeight;
    overallDimSvg += `
      <line x1="${x}" y1="${y0}" x2="${offsetX}" y2="${y0}" stroke="#bbb" stroke-width="0.5" />
      <line x1="${x}" y1="${y1}" x2="${offsetX}" y2="${y1}" stroke="#bbb" stroke-width="0.5" />
      <line x1="${x}" y1="${y0}" x2="${x}" y2="${y1}" stroke="#666" stroke-width="0.6" />
      <text x="0" y="0" text-anchor="middle" font-size="9" fill="#333" transform="translate(${x - 5}, ${(y0 + y1) / 2}) rotate(-90)">${esc(overallDepthDim.label)}</text>
    `;
  }

  const subDimensionLines = subDimensions
    .map((d) => {
      const a = toPx(d.from);
      const b = toPx(d.to);
      const y = a.y - 10;
      const midX = (a.x + b.x) / 2;
      return `
        <line x1="${a.x}" y1="${y}" x2="${b.x}" y2="${y}" stroke="#ccc" stroke-width="0.5" />
        <text x="${midX}" y="${y - 3}" text-anchor="middle" font-size="8" fill="#999">${esc(d.label)}</text>
      `;
    })
    .join("");

  // Header — tên dự án + scale/ngày, bọc dòng nếu tên dự án dài (Task 7).
  const titleLines = wrapText(`${titleBlock.projectName} — ${titleBlock.floorLabel}`, contentWidth, 12);
  const titleBlockSvg = `
    ${tspanBlock(PAGE_MARGIN, PAGE_MARGIN + 8, titleLines, 12, `font-weight="700"`)}
    <text x="${PAGE_MARGIN}" y="${PAGE_MARGIN + 8 + titleLines.length * 14 + 12}" font-size="9" fill="#666">${esc(titleBlock.scale)} — Mặt bằng tầng (Concept) — Lập ngày ${new Date(titleBlock.generatedAt).toLocaleDateString("vi-VN")}</text>
  `;

  // Footer — warnings (nếu có) rồi disclaimer, mọi dòng đã bọc sẵn ở trên.
  let footerY = viewportY1 + 16;
  const warningsSvg = warningLines
    .map((line) => {
      const svg = `<text x="${PAGE_MARGIN}" y="${footerY}" font-size="9" fill="#b45309">${esc(line)}</text>`;
      footerY += 12;
      return svg;
    })
    .join("");
  if (warningLines.length > 0) footerY += 4;
  const disclaimerSvg = disclaimerLines
    .map((line) => {
      const svg = `<text x="${PAGE_MARGIN}" y="${footerY}" font-size="8" fill="#b91c1c">${esc(line)}</text>`;
      footerY += 11;
      return svg;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}" preserveAspectRatio="xMidYMid meet">
    <rect x="0" y="0" width="${PAGE_WIDTH}" height="${PAGE_HEIGHT}" fill="#ffffff" />
    ${titleBlockSvg}
    ${overallDimSvg}
    ${subDimensionLines}
    ${roomRects}
    ${wallLines}
    ${doorSymbols}
    ${windowSymbols}
    ${warningsSvg}
    ${disclaimerSvg}
  </svg>`;
}

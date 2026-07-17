import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Hiển thị số trong input editable dạng "210.000" (vi-VN, phân cách nghìn). */
export function formatThousandsInput(v: number | null): string {
  if (v === null || Number.isNaN(v)) return "";
  return v.toLocaleString("vi-VN");
}

/** Đọc ngược lại từ input đã format — bỏ mọi ký tự không phải số/dấu trừ. */
export function parseThousandsInput(raw: string): number | null {
  const cleaned = raw.replace(/[^\d-]/g, "");
  if (cleaned === "" || cleaned === "-") return null;
  const parsed = Number(cleaned);
  return Number.isNaN(parsed) ? null : parsed;
}

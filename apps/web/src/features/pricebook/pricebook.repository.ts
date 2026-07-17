import type { MaterialTier as PrismaMaterialTier } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "@/lib/http";
import type { PriceBook, PriceBookEntry } from "@/lib/estimate/types";
import type {
  CreatePriceBookInput,
  UpdatePriceBookInput,
} from "./pricebook.schema";

/**
 * Truy cập `PriceBook`/`PriceBookEntry` (Milestone Estimate MVP — Feature 5:
 * CRUD, không auth). Chạy phía server (Route Handler).
 */

export interface PriceBookSummary {
  id: string;
  name: string;
  pricingRegion: string;
  effectiveFrom: string;
  isDemo: boolean;
  entryCount: number;
  updatedAt: string;
}

function toEntry(row: {
  itemCode: string;
  itemName: string;
  unit: string;
  materialTier: PrismaMaterialTier;
  unitPrice: number;
  updatedAt: Date;
}): PriceBookEntry {
  return {
    itemCode: row.itemCode,
    itemName: row.itemName,
    unit: row.unit,
    materialTier: row.materialTier,
    unitPrice: row.unitPrice,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listPriceBooks(): Promise<PriceBookSummary[]> {
  const rows = await prisma.priceBook.findMany({
    include: { _count: { select: { entries: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    pricingRegion: r.pricingRegion,
    effectiveFrom: r.effectiveFrom.toISOString(),
    isDemo: r.isDemo,
    entryCount: r._count.entries,
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function getPriceBook(id: string): Promise<PriceBook> {
  const row = await prisma.priceBook.findUnique({
    where: { id },
    include: { entries: true },
  });
  if (!row) throw notFound("Không tìm thấy bảng giá");
  return {
    id: row.id,
    name: row.name,
    pricingRegion: row.pricingRegion,
    effectiveFrom: row.effectiveFrom.toISOString(),
    isDemo: row.isDemo,
    entries: row.entries.map(toEntry),
  };
}

export async function createPriceBook(
  input: CreatePriceBookInput,
): Promise<PriceBook> {
  const created = await prisma.priceBook.create({
    data: {
      name: input.name,
      pricingRegion: input.pricingRegion,
      effectiveFrom: new Date(input.effectiveFrom),
      entries: {
        create: input.entries.map((e) => ({
          itemCode: e.itemCode,
          itemName: e.itemName,
          unit: e.unit,
          materialTier: e.materialTier as PrismaMaterialTier,
          unitPrice: e.unitPrice,
        })),
      },
    },
    include: { entries: true },
  });
  return {
    id: created.id,
    name: created.name,
    pricingRegion: created.pricingRegion,
    effectiveFrom: created.effectiveFrom.toISOString(),
    isDemo: created.isDemo,
    entries: created.entries.map(toEntry),
  };
}

/**
 * MVP: thay `entries` bằng cách xoá hết rồi tạo lại (không diff từng dòng)
 * — đơn giản, chấp nhận được vì PriceBook MVP không có audit log entry-level.
 */
export async function updatePriceBook(
  id: string,
  input: UpdatePriceBookInput,
): Promise<PriceBook> {
  await ensurePriceBookExists(id);

  await prisma.$transaction(async (tx) => {
    await tx.priceBook.update({
      where: { id },
      data: {
        name: input.name,
        pricingRegion: input.pricingRegion,
        effectiveFrom: input.effectiveFrom
          ? new Date(input.effectiveFrom)
          : undefined,
      },
    });

    if (input.entries) {
      await tx.priceBookEntry.deleteMany({ where: { priceBookId: id } });
      if (input.entries.length > 0) {
        await tx.priceBookEntry.createMany({
          data: input.entries.map((e) => ({
            priceBookId: id,
            itemCode: e.itemCode,
            itemName: e.itemName,
            unit: e.unit,
            materialTier: e.materialTier as PrismaMaterialTier,
            unitPrice: e.unitPrice,
          })),
        });
      }
    }
  });

  return getPriceBook(id);
}

/** Bản sao luôn `isDemo=false` — kể cả nhân bản từ bảng giá demo, vì chủ thầu nhân bản để bắt đầu sửa thành giá thật. */
export async function duplicatePriceBook(
  id: string,
  name?: string,
): Promise<PriceBook> {
  const source = await getPriceBook(id);
  return createPriceBook({
    name: name ?? `${source.name} (bản sao)`,
    pricingRegion: source.pricingRegion,
    effectiveFrom: new Date().toISOString(),
    entries: source.entries.map((e) => ({
      itemCode: e.itemCode,
      itemName: e.itemName,
      unit: e.unit,
      materialTier: e.materialTier,
      unitPrice: e.unitPrice,
    })),
  });
}

async function ensurePriceBookExists(id: string): Promise<void> {
  const count = await prisma.priceBook.count({ where: { id } });
  if (count === 0) throw notFound("Không tìm thấy bảng giá");
}

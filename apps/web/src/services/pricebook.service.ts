import type { PriceBook } from "@/lib/estimate/types";
import { request } from "./http";

export interface PriceBookSummary {
  id: string;
  name: string;
  pricingRegion: string;
  effectiveFrom: string;
  isDemo: boolean;
  entryCount: number;
  updatedAt: string;
}

export interface PriceBookEntryInput {
  itemCode: string;
  itemName: string;
  unit: string;
  materialTier: "standard" | "mid" | "premium" | "all";
  unitPrice: number;
}

export interface CreatePriceBookInput {
  name: string;
  pricingRegion: string;
  effectiveFrom: string;
  entries: PriceBookEntryInput[];
}

/** Milestone Estimate MVP — Feature 5: PriceBook CRUD (không auth). */
export const pricebookService = {
  list: () => request<PriceBookSummary[]>("/pricebooks"),

  get: (id: string) => request<PriceBook>(`/pricebooks/${id}`),

  create: (input: CreatePriceBookInput) =>
    request<PriceBook>("/pricebooks", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  update: (id: string, input: Partial<CreatePriceBookInput>) =>
    request<PriceBook>(`/pricebooks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),

  duplicate: (id: string, name?: string) =>
    request<PriceBook>(`/pricebooks/${id}/duplicate`, {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
};

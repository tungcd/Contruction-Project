"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { pricebookService, type PriceBookEntryInput } from "@/services/pricebook.service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatThousandsInput, parseThousandsInput } from "@/lib/utils";

const MATERIAL_TIERS: PriceBookEntryInput["materialTier"][] = [
  "standard",
  "mid",
  "premium",
  "all",
];

const MATERIAL_TIER_LABEL: Record<PriceBookEntryInput["materialTier"], string> = {
  standard: "Tiêu chuẩn",
  mid: "Trung",
  premium: "Cao cấp",
  all: "Không phân biệt",
};

function emptyEntry(): PriceBookEntryInput {
  return { itemCode: "", itemName: "", unit: "", materialTier: "all", unitPrice: 0 };
}

/** Milestone Estimate MVP — Feature 5: sửa PriceBook (thông tin chung + toàn bộ entries). */
export default function PriceBookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [pricingRegion, setPricingRegion] = useState("");
  const [entries, setEntries] = useState<PriceBookEntryInput[]>([]);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const { data: priceBook, isLoading, isError } = useQuery({
    queryKey: ["pricebook", id],
    queryFn: () => pricebookService.get(id),
    enabled: !!id,
  });

  useEffect(() => {
    if (!priceBook) return;
    setName(priceBook.name);
    setPricingRegion(priceBook.pricingRegion);
    setEntries(
      priceBook.entries.map((e) => ({
        itemCode: e.itemCode,
        itemName: e.itemName,
        unit: e.unit,
        materialTier: e.materialTier,
        unitPrice: e.unitPrice,
      })),
    );
  }, [priceBook]);

  const saveMutation = useMutation({
    mutationFn: () =>
      pricebookService.update(id, { name, pricingRegion, entries }),
    onSuccess: () => {
      setSavedAt(new Date().toISOString());
      queryClient.invalidateQueries({ queryKey: ["pricebook", id] });
      queryClient.invalidateQueries({ queryKey: ["pricebooks"] });
    },
  });

  function updateEntry(index: number, patch: Partial<PriceBookEntryInput>) {
    setEntries((prev) => prev.map((e, i) => (i === index ? { ...e, ...patch } : e)));
  }

  function removeEntry(index: number) {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  }

  if (isLoading)
    return <p className="p-8 text-sm text-muted-foreground">Đang tải...</p>;
  if (isError || !priceBook)
    return (
      <div className="p-8">
        <Link href="/pricebooks" className="text-sm text-primary">
          &larr; Về danh sách bảng giá
        </Link>
      </div>
    );

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/pricebooks">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" /> Về danh sách bảng giá
          </Button>
        </Link>
        <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          <Save className="h-4 w-4" /> Lưu
        </Button>
      </div>

      {priceBook.isDemo && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Đây là bảng giá <strong>DEMO</strong>. Nếu muốn dùng làm giá thật,
          bấm &quot;Nhân bản&quot; ở danh sách bảng giá thay vì sửa trực tiếp.
        </div>
      )}

      {saveMutation.isError && (
        <p className="mb-4 text-sm text-destructive">
          {(saveMutation.error as Error).message}
        </p>
      )}
      {savedAt && !saveMutation.isPending && (
        <p className="mb-4 text-xs text-muted-foreground">
          Đã lưu lúc {new Date(savedAt).toLocaleString("vi-VN")}
        </p>
      )}

      <Card className="mb-4">
        <CardHeader className="border-b">
          <CardTitle className="text-sm">Thông tin chung</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 pt-4 sm:grid-cols-2">
          <input
            className="rounded-md border px-3 py-2 text-sm"
            placeholder="Tên bảng giá"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="rounded-md border px-3 py-2 text-sm"
            placeholder="Vùng giá"
            value={pricingRegion}
            onChange={(e) => setPricingRegion(e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between border-b">
          <CardTitle className="text-sm">
            Đơn giá ({entries.length} dòng){" "}
            {priceBook.isDemo && (
              <Badge className="border-red-200 bg-red-50 text-red-700">Demo</Badge>
            )}
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setEntries((p) => [...p, emptyEntry()])}>
            <Plus className="h-4 w-4" /> Thêm dòng
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <th className="p-2">Mã</th>
                <th className="p-2">Tên hạng mục</th>
                <th className="p-2">ĐVT</th>
                <th className="p-2">Phân khúc</th>
                <th className="p-2 text-right">Đơn giá</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => (
                <tr key={index} className="border-b last:border-0">
                  <td className="p-2">
                    <input
                      className="w-32 rounded border px-2 py-1"
                      value={entry.itemCode}
                      onChange={(e) => updateEntry(index, { itemCode: e.target.value })}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      className="w-56 rounded border px-2 py-1"
                      value={entry.itemName}
                      onChange={(e) => updateEntry(index, { itemName: e.target.value })}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      className="w-16 rounded border px-2 py-1"
                      value={entry.unit}
                      onChange={(e) => updateEntry(index, { unit: e.target.value })}
                    />
                  </td>
                  <td className="p-2">
                    <select
                      className="rounded border px-2 py-1"
                      value={entry.materialTier}
                      onChange={(e) =>
                        updateEntry(index, {
                          materialTier: e.target.value as PriceBookEntryInput["materialTier"],
                        })
                      }
                    >
                      {MATERIAL_TIERS.map((t) => (
                        <option key={t} value={t}>
                          {MATERIAL_TIER_LABEL[t]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2 text-right">
                    <input
                      type="text"
                      inputMode="numeric"
                      className="w-28 rounded border px-2 py-1 text-right"
                      value={formatThousandsInput(entry.unitPrice)}
                      onChange={(e) =>
                        updateEntry(index, { unitPrice: parseThousandsInput(e.target.value) ?? 0 })
                      }
                    />
                  </td>
                  <td className="p-2">
                    <Button size="icon" variant="ghost" onClick={() => removeEntry(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Input, Select, Table, type TableColumnsType } from "antd";
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

const MATERIAL_TIER_OPTIONS = MATERIAL_TIERS.map((t) => ({
  value: t,
  label: MATERIAL_TIER_LABEL[t],
}));

function emptyEntry(): PriceBookEntryInput {
  return { itemCode: "", itemName: "", unit: "", materialTier: "all", unitPrice: 0 };
}

type Row = PriceBookEntryInput & { rowIndex: number };

/** Milestone Estimate MVP — Feature 5: sửa PriceBook (thông tin chung + toàn bộ entries). */
export default function PriceBookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [pricingRegion, setPricingRegion] = useState("");
  const [entries, setEntries] = useState<PriceBookEntryInput[]>([]);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

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

  /** Dòng thiếu Mã/Tên hạng mục/ĐVT (vd dòng mới bấm "Thêm dòng" nhưng chưa điền) — chặn trước khi gửi lên server. */
  function invalidEntryReason(entry: PriceBookEntryInput): string | null {
    const missing: string[] = [];
    if (!entry.itemCode.trim()) missing.push("Mã");
    if (!entry.itemName.trim()) missing.push("Tên hạng mục");
    if (!entry.unit.trim()) missing.push("ĐVT");
    return missing.length > 0 ? missing.join(", ") : null;
  }

  function save() {
    const invalidIndex = entries.findIndex((e) => invalidEntryReason(e) !== null);
    if (invalidIndex !== -1) {
      const reason = invalidEntryReason(entries[invalidIndex]);
      setValidationError(
        `Dòng ${invalidIndex + 1} còn thiếu ${reason} — điền đầy đủ hoặc xoá dòng trước khi lưu.`,
      );
      return;
    }
    setValidationError(null);
    saveMutation.mutate();
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

  const dataSource: Row[] = entries.map((entry, rowIndex) => ({ ...entry, rowIndex }));

  const columns: TableColumnsType<Row> = [
    {
      title: "Mã",
      key: "itemCode",
      width: 190,
      render: (_, row) => {
        const invalid = validationError !== null && !row.itemCode.trim();
        return (
          <Input.TextArea
            autoSize={{ minRows: 1, maxRows: 3 }}
            status={invalid ? "error" : undefined}
            className="font-mono text-xs"
            value={row.itemCode}
            onChange={(e) => updateEntry(row.rowIndex, { itemCode: e.target.value })}
          />
        );
      },
    },
    {
      title: "Tên hạng mục",
      key: "itemName",
      width: 240,
      render: (_, row) => {
        const invalid = validationError !== null && !row.itemName.trim();
        return (
          <Input.TextArea
            autoSize={{ minRows: 1, maxRows: 3 }}
            status={invalid ? "error" : undefined}
            value={row.itemName}
            onChange={(e) => updateEntry(row.rowIndex, { itemName: e.target.value })}
          />
        );
      },
    },
    {
      title: "ĐVT",
      key: "unit",
      width: 80,
      render: (_, row) => {
        const invalid = validationError !== null && !row.unit.trim();
        return (
          <Input
            status={invalid ? "error" : undefined}
            value={row.unit}
            onChange={(e) => updateEntry(row.rowIndex, { unit: e.target.value })}
          />
        );
      },
    },
    {
      title: "Phân khúc",
      key: "materialTier",
      width: 130,
      render: (_, row) => (
        <Select
          className="w-full"
          value={row.materialTier}
          options={MATERIAL_TIER_OPTIONS}
          onChange={(value) => updateEntry(row.rowIndex, { materialTier: value })}
        />
      ),
    },
    {
      title: "Đơn giá",
      key: "unitPrice",
      width: 130,
      align: "right",
      render: (_, row) => (
        <Input
          inputMode="numeric"
          value={formatThousandsInput(row.unitPrice)}
          onChange={(e) =>
            updateEntry(row.rowIndex, { unitPrice: parseThousandsInput(e.target.value) ?? 0 })
          }
        />
      ),
    },
    {
      title: "",
      key: "actions",
      width: 48,
      render: (_, row) => (
        <Button size="icon" variant="ghost" onClick={() => removeEntry(row.rowIndex)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      ),
    },
  ];

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/pricebooks">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" /> Về danh sách bảng giá
          </Button>
        </Link>
        <Button size="sm" onClick={save} disabled={saveMutation.isPending}>
          <Save className="h-4 w-4" /> Lưu
        </Button>
      </div>

      {priceBook.isDemo && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Đây là bảng giá <strong>DEMO</strong>. Nếu muốn dùng làm giá thật,
          bấm &quot;Nhân bản&quot; ở danh sách bảng giá thay vì sửa trực tiếp.
        </div>
      )}

      {validationError && (
        <p className="mb-4 text-sm text-destructive">{validationError}</p>
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
          <Input
            placeholder="Tên bảng giá"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
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
        <Table<Row>
          rowKey="rowIndex"
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          size="small"
          scroll={{ x: true }}
        />
      </Card>
    </main>
  );
}

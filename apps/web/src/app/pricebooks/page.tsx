"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Copy, Plus } from "lucide-react";
import { pricebookService } from "@/services/pricebook.service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

/** Milestone Estimate MVP — Feature 5: danh sách + tạo mới PriceBook. */
export default function PriceBooksPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [pricingRegion, setPricingRegion] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState(
    new Date().toISOString().slice(0, 10),
  );

  const { data: priceBooks, isLoading } = useQuery({
    queryKey: ["pricebooks"],
    queryFn: pricebookService.list,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      pricebookService.create({
        name,
        pricingRegion,
        effectiveFrom: new Date(effectiveFrom).toISOString(),
        entries: [],
      }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["pricebooks"] });
      router.push(`/pricebooks/${created.id}`);
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => pricebookService.duplicate(id),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["pricebooks"] });
      router.push(`/pricebooks/${created.id}`);
    },
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" /> Về Dashboard
          </Button>
        </Link>
        <Button size="sm" onClick={() => setShowForm((s) => !s)}>
          <Plus className="h-4 w-4" /> Tạo bảng giá mới
        </Button>
      </div>

      <h1 className="mb-4 text-xl font-bold">Bảng giá</h1>

      {showForm && (
        <Card className="mb-4">
          <CardContent className="space-y-3 pt-4">
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Tên bảng giá (vd: Bảng giá 2026 - Hà Nội)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Vùng giá (vd: Hà Nội)"
              value={pricingRegion}
              onChange={(e) => setPricingRegion(e.target.value)}
            />
            <input
              type="date"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
            />
            {createMutation.isError && (
              <p className="text-sm text-destructive">
                {(createMutation.error as Error).message}
              </p>
            )}
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => createMutation.mutate()}
                disabled={!name || !pricingRegion || createMutation.isPending}
              >
                Tạo
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                Huỷ
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading && <p className="text-sm text-muted-foreground">Đang tải...</p>}

      <div className="space-y-2">
        {priceBooks?.map((pb) => (
          <Card key={pb.id}>
            <CardContent className="flex items-center justify-between py-3">
              <Link href={`/pricebooks/${pb.id}`} className="flex-1">
                <p className="font-medium">
                  {pb.name}{" "}
                  {pb.isDemo && (
                    <Badge className="border-red-200 bg-red-50 text-red-700">
                      Demo
                    </Badge>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {pb.pricingRegion} · {pb.entryCount} dòng đơn giá · cập nhật{" "}
                  {new Date(pb.updatedAt).toLocaleString("vi-VN")}
                </p>
              </Link>
              <Button
                size="sm"
                variant="outline"
                onClick={() => duplicateMutation.mutate(pb.id)}
                disabled={duplicateMutation.isPending}
              >
                <Copy className="h-4 w-4" /> Nhân bản
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}

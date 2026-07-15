"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  onSubmit: (input: { name: string; customerName?: string }) => void;
  onCancel: () => void;
  isPending: boolean;
  error?: string | null;
}

export function CreateProjectForm({
  onSubmit,
  onCancel,
  isPending,
  error,
}: Props) {
  const [name, setName] = useState("");
  const [customerName, setCustomerName] = useState("");

  return (
    <Card className="mb-6">
      <CardContent className="space-y-3 pt-4">
        <input
          autoFocus
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder="Tên dự án (vd: Anh Hùng - Nhà phố Đan Phượng)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder="Tên khách hàng (tuỳ chọn)"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
        />
        <div className="flex gap-2">
          <Button
            disabled={!name.trim() || isPending}
            onClick={() =>
              onSubmit({
                name: name.trim(),
                customerName: customerName.trim() || undefined,
              })
            }
          >
            {isPending ? "Đang tạo..." : "Tạo dự án"}
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            Huỷ
          </Button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}

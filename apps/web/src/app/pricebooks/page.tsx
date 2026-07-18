"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Form, DatePicker, Input, Popconfirm } from "antd";
import dayjs from "dayjs";
import { ArrowLeft, Copy, Plus, Trash2 } from "lucide-react";
import { pricebookService } from "@/services/pricebook.service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface CreateFormValues {
  name: string;
  pricingRegion: string;
  effectiveFrom: dayjs.Dayjs;
}

/** Milestone Estimate MVP — Feature 5: danh sách + tạo mới PriceBook. */
export default function PriceBooksPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<CreateFormValues>();
  const [showForm, setShowForm] = useState(false);

  const { data: priceBooks, isLoading } = useQuery({
    queryKey: ["pricebooks"],
    queryFn: pricebookService.list,
  });

  const createMutation = useMutation({
    mutationFn: (values: CreateFormValues) =>
      pricebookService.create({
        name: values.name,
        pricingRegion: values.pricingRegion,
        effectiveFrom: values.effectiveFrom.toISOString(),
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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => pricebookService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricebooks"] });
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
          <CardContent className="pt-4">
            <Form<CreateFormValues>
              form={form}
              layout="vertical"
              initialValues={{ effectiveFrom: dayjs() }}
              onFinish={(values) => createMutation.mutate(values)}
              disabled={createMutation.isPending}
            >
              <Form.Item
                name="name"
                rules={[{ required: true, whitespace: true, message: "Tên bảng giá không được rỗng" }]}
              >
                <Input placeholder="Tên bảng giá (vd: Bảng giá 2026 - Hà Nội)" />
              </Form.Item>
              <Form.Item
                name="pricingRegion"
                rules={[{ required: true, whitespace: true, message: "Vùng giá không được rỗng" }]}
              >
                <Input placeholder="Vùng giá (vd: Hà Nội)" />
              </Form.Item>
              <Form.Item name="effectiveFrom" rules={[{ required: true }]}>
                <DatePicker className="w-full" format="DD/MM/YYYY" />
              </Form.Item>
              {createMutation.isError && (
                <p className="mb-3 text-sm text-destructive">
                  {(createMutation.error as Error).message}
                </p>
              )}
              <Form.Item className="mb-0">
                <div className="flex gap-2">
                  <Button size="sm" htmlType="submit" disabled={createMutation.isPending}>
                    Tạo
                  </Button>
                  <Button size="sm" variant="ghost" htmlType="button" onClick={() => setShowForm(false)}>
                    Huỷ
                  </Button>
                </div>
              </Form.Item>
            </Form>
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
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => duplicateMutation.mutate(pb.id)}
                  disabled={duplicateMutation.isPending}
                >
                  <Copy className="h-4 w-4" /> Nhân bản
                </Button>
                <Popconfirm
                  title="Xoá bảng giá này?"
                  description={`"${pb.name}" sẽ mất vĩnh viễn, không khôi phục được.`}
                  okText="Xoá"
                  cancelText="Huỷ"
                  okButtonProps={{ danger: true }}
                  overlayInnerStyle={{ maxWidth: 560 }}
                  onConfirm={() => deleteMutation.mutate(pb.id)}
                >
                  <Button size="sm" variant="outline" disabled={deleteMutation.isPending}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </Popconfirm>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {deleteMutation.isError && (
        <p className="mt-2 text-sm text-destructive">
          {(deleteMutation.error as Error).message}
        </p>
      )}
    </main>
  );
}

"use client";

import Link from "next/link";
import { App, Form, Input, InputNumber } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { contractorProfileService } from "@/services/contractorProfile.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ContractorProfile } from "@/lib/proposal/types";

/**
 * Demo Polish — Task 2: Hồ sơ nhà thầu (singleton, dùng chung cho mọi
 * Proposal). Không có auth/tổ chức — 1 form duy nhất cho toàn bộ app.
 */
export default function ContractorSettingsPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<ContractorProfile>();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["contractor-profile"],
    queryFn: contractorProfileService.get,
  });

  const saveMutation = useMutation({
    mutationFn: (values: ContractorProfile) => contractorProfileService.update(values),
    onSuccess: (updated) => {
      queryClient.setQueryData(["contractor-profile"], updated);
      message.success("Đã lưu hồ sơ nhà thầu");
    },
  });

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-4">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" /> Về Dashboard
          </Button>
        </Link>
      </div>

      <h1 className="mb-1 text-xl font-bold">Hồ sơ nhà thầu</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Thông tin này sẽ hiển thị trên mọi Báo giá đề xuất (Proposal) gửi khách hàng.
      </p>

      {isLoading || !profile ? (
        <p className="text-sm text-muted-foreground">Đang tải...</p>
      ) : (
        <Form
          form={form}
          layout="vertical"
          initialValues={profile}
          onFinish={(values) => saveMutation.mutate(values)}
        >
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-base">Thông tin liên hệ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <Form.Item
                name="companyName"
                label="Tên công ty"
                rules={[{ required: true, whitespace: true, message: "Không được để trống" }]}
              >
                <Input />
              </Form.Item>
              <Form.Item name="logoUrl" label="Logo (URL ảnh, tuỳ chọn)">
                <Input placeholder="https://..." />
              </Form.Item>
              <Form.Item name="phone" label="Điện thoại">
                <Input />
              </Form.Item>
              <Form.Item name="email" label="Email">
                <Input />
              </Form.Item>
              <Form.Item name="website" label="Website">
                <Input />
              </Form.Item>
              <Form.Item name="address" label="Địa chỉ">
                <Input />
              </Form.Item>
            </CardContent>
          </Card>

          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-base">Mặc định cho Báo giá đề xuất</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <Form.Item
                name="defaultProposalValidityDays"
                label="Số ngày hiệu lực báo giá"
                rules={[{ required: true, type: "number", min: 1 }]}
              >
                <InputNumber className="w-full" min={1} />
              </Form.Item>
              <Form.Item name="warrantyNote" label="Chính sách bảo hành">
                <Input.TextArea rows={3} placeholder="Vd: Bảo hành kết cấu 10 năm, hoàn thiện 2 năm..." />
              </Form.Item>

              <div className="mb-2 text-sm font-medium">Tiến độ thanh toán mặc định</div>
              <Form.List name="defaultPaymentPlan">
                {(fields, { add, remove }) => (
                  <div className="space-y-2">
                    {fields.map((field) => (
                      <div key={field.key} className="flex items-center gap-2">
                        <Form.Item
                          {...field}
                          name={[field.name, "label"]}
                          className="mb-0 flex-1"
                          rules={[{ required: true, message: "Bắt buộc" }]}
                        >
                          <Input placeholder="Vd: Đặt cọc" />
                        </Form.Item>
                        <Form.Item
                          {...field}
                          name={[field.name, "percent"]}
                          className="mb-0 w-28"
                          rules={[{ required: true, message: "Bắt buộc" }]}
                        >
                          <InputNumber className="w-full" min={0} max={100} addonAfter="%" />
                        </Form.Item>
                        <Button
                          variant="ghost"
                          size="sm"
                          htmlType="button"
                          onClick={() => remove(field.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      htmlType="button"
                      onClick={() => add({ label: "", percent: 0 })}
                    >
                      <Plus className="h-4 w-4" /> Thêm mốc thanh toán
                    </Button>
                  </div>
                )}
              </Form.List>
            </CardContent>
          </Card>

          <Button htmlType="submit" disabled={saveMutation.isPending}>
            <Save className="h-4 w-4" /> Lưu hồ sơ
          </Button>
        </Form>
      )}
    </main>
  );
}

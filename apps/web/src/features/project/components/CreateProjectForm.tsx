"use client";

import { Form, Input } from "antd";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  onSubmit: (input: { name: string; customerName?: string }) => void;
  onCancel: () => void;
  isPending: boolean;
  error?: string | null;
}

interface FormValues {
  name: string;
  customerName?: string;
}

export function CreateProjectForm({
  onSubmit,
  onCancel,
  isPending,
  error,
}: Props) {
  const [form] = Form.useForm<FormValues>();

  function handleFinish(values: FormValues) {
    onSubmit({
      name: values.name.trim(),
      customerName: values.customerName?.trim() || undefined,
    });
  }

  return (
    <Card className="mb-6">
      <CardContent className="pt-4">
        <Form form={form} layout="vertical" onFinish={handleFinish} disabled={isPending}>
          <Form.Item
            name="name"
            rules={[{ required: true, whitespace: true, message: "Tên dự án không được rỗng" }]}
          >
            <Input autoFocus placeholder="Tên dự án (vd: Anh Hùng - Nhà phố Đan Phượng)" />
          </Form.Item>
          <Form.Item name="customerName">
            <Input placeholder="Tên khách hàng (tuỳ chọn)" />
          </Form.Item>
          {error && <p className="mb-3 text-sm text-destructive">{error}</p>}
          <Form.Item className="mb-0">
            <div className="flex gap-2">
              <Button htmlType="submit" disabled={isPending}>
                {isPending ? "Đang tạo..." : "Tạo dự án"}
              </Button>
              <Button variant="ghost" htmlType="button" onClick={onCancel}>
                Huỷ
              </Button>
            </div>
          </Form.Item>
        </Form>
      </CardContent>
    </Card>
  );
}

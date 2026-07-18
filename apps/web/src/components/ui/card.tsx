import * as React from "react";
import { Card as AntCard } from "antd";
import { cn } from "@/lib/utils";

/**
 * `Card` là antd `Card` thật (Founder Decision — UI chuyển sang antd,
 * 2026-07-18), padding mặc định tắt (`styles.body`) để `CardHeader`/
 * `CardContent` tự quản lý khoảng cách như trước — giữ nguyên API compound
 * component (`Card > CardHeader > CardTitle`, `Card > CardContent`) vì antd
 * không có sẵn cấu trúc con tương đương, không đáng để viết lại mọi trang.
 *
 * `.ant-card-body` (do antd tự render, nằm giữa `.ant-card` và children của
 * ta) mặc định là `display: block` — làm hỏng pattern
 * `Card(flex flex-col overflow-hidden) > CardContent(flex-1 overflow-y-auto)`
 * dùng để cuộn nội bộ (ConversationPanel, RequirementSummaryPanel,
 * MissingPanel). Phải ép `.ant-card-body` thành flex column + minHeight:0
 * để flex-1/overflow-y-auto của CardContent hoạt động lại như div thường.
 */
export function Card({
  className,
  ...props
}: React.ComponentProps<typeof AntCard>) {
  return (
    <AntCard
      className={cn("text-card-foreground", className)}
      styles={{
        body: {
          padding: 0,
          display: "flex",
          flexDirection: "column",
          flex: "1 1 auto",
          minHeight: 0,
        },
      }}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col space-y-1.5 p-4", className)} {...props} />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4 pt-0", className)} {...props} />;
}

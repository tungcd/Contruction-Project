import * as React from "react";
import { Card as AntCard } from "antd";
import { cn } from "@/lib/utils";

/**
 * `Card` là antd `Card` thật (Founder Decision — UI chuyển sang antd,
 * 2026-07-18), padding mặc định tắt (`styles.body`) để `CardHeader`/
 * `CardContent` tự quản lý khoảng cách như trước — giữ nguyên API compound
 * component (`Card > CardHeader > CardTitle`, `Card > CardContent`) vì antd
 * không có sẵn cấu trúc con tương đương, không đáng để viết lại mọi trang.
 */
export function Card({
  className,
  ...props
}: React.ComponentProps<typeof AntCard>) {
  return (
    <AntCard
      className={cn("text-card-foreground", className)}
      styles={{ body: { padding: 0 } }}
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

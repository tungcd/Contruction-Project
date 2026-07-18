import * as React from "react";
import { Tag } from "antd";
import { cn } from "@/lib/utils";

/**
 * `Badge` là antd `Tag` thật (Founder Decision — UI chuyển sang antd,
 * 2026-07-18). Call site vẫn tự truyền màu qua className Tailwind (vd
 * `border-red-200 bg-red-50 text-red-700`) — không đổi cách dùng hiện tại.
 */
export function Badge({
  className,
  ...props
}: React.ComponentProps<typeof Tag>) {
  return (
    <Tag
      className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium", className)}
      {...props}
    />
  );
}

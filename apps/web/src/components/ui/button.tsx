import * as React from "react";
import { Button as AntButton, type ButtonProps as AntButtonProps } from "antd";
import { cn } from "@/lib/utils";

/**
 * Adapter mỏng quanh antd `Button` (Founder Decision — UI chuyển sang antd,
 * 2026-07-18). Giữ nguyên API `variant`/`size` cũ để không phải sửa lại
 * mọi call site — bản render bên dưới LÀ antd Button thật.
 *
 * Đây là quyết định hiện tại, không phải thiết kế cuối cùng — có thể đổi
 * trực tiếp sang props gốc của antd (`type`/`size`/`danger`) sau này nếu
 * lớp adapter không còn cần thiết.
 */
export type ButtonVariant =
  | "default"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive";
export type ButtonSize = "default" | "sm" | "lg" | "icon";

export interface ButtonProps
  extends Omit<AntButtonProps, "type" | "size" | "danger" | "shape" | "variant"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const VARIANT_TO_TYPE: Record<ButtonVariant, AntButtonProps["type"]> = {
  default: "primary",
  secondary: "default",
  outline: "default",
  ghost: "text",
  destructive: "primary",
};

const SIZE_TO_ANTD: Record<ButtonSize, AntButtonProps["size"]> = {
  default: "middle",
  sm: "small",
  lg: "large",
  icon: "middle",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", size = "default", className, ...props }, ref) => (
    <AntButton
      ref={ref as React.Ref<HTMLButtonElement & HTMLAnchorElement>}
      type={VARIANT_TO_TYPE[variant]}
      danger={variant === "destructive"}
      size={SIZE_TO_ANTD[size]}
      shape={size === "icon" ? "circle" : undefined}
      className={cn("inline-flex items-center justify-center gap-1.5", className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { Button };

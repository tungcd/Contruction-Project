"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App, ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";

/**
 * UI chuyển sang antd (Founder Decision, 2026-07-18 — thiết lập ban đầu của
 * dự án, chưa được áp dụng cho tới nay). Theme token khớp màu/bo góc đang
 * dùng trong globals.css (--primary: hsl(221.2 83.2% 53.3%) ≈ #2563eb,
 * --radius: 0.5rem = 8px) để chuyển tiếp không đổi giao diện đột ngột.
 *
 * Đây là hypothesis/quyết định hiện tại, không phải kiến trúc vĩnh viễn —
 * theme token có thể chỉnh lại bất kỳ lúc nào khi có bộ nhận diện thương
 * hiệu chính thức.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );
  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        token: {
          colorPrimary: "#2563eb",
          borderRadius: 8,
          fontFamily: "inherit",
        },
      }}
    >
      <QueryClientProvider client={client}>
        {/* antd App: cho phép Modal.confirm/message/notification đọc đúng
            theme của ConfigProvider — dùng App.useApp() ở nơi cần, thay vì
            gọi thẳng Modal.confirm() tĩnh (mất theme, xem cảnh báo antd). */}
        <App>{children}</App>
      </QueryClientProvider>
    </ConfigProvider>
  );
}

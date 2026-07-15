"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { request } from "@/services/http";

/**
 * Ở chế độ mock, requirement được dò bằng regex chứ không phải AI. Độ chính
 * xác thấp hơn hẳn với hội thoại dài. Phải nói rõ, nếu không người dùng sẽ
 * tưởng đó là kết quả của AI và đánh giá sai chất lượng sản phẩm.
 */
export function MockModeBanner() {
  const { data } = useQuery({
    queryKey: ["ai-mode"],
    queryFn: () => request<{ provider: string; isMock: boolean }>("/ai-mode"),
    staleTime: Infinity,
  });

  if (!data?.isMock) return null;

  return (
    <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-1.5 text-xs text-amber-800">
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      <span>
        Đang chạy chế độ <strong>mock</strong> — requirement dò bằng từ khoá,
        không phải AI. Kết quả chỉ để thử giao diện. Đặt{" "}
        <code className="rounded bg-amber-100 px-1">AI_PROVIDER=openai</code>{" "}
        trong .env để dùng AI thật.
      </span>
    </div>
  );
}

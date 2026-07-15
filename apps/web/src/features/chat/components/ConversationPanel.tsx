"use client";

import { useEffect, useRef } from "react";
import type { ConversationMessage } from "@acc/shared-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  messages: ConversationMessage[];
  isAnalyzing: boolean;
  error?: string | null;
}

export function ConversationPanel({ messages, isAnalyzing, error }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isAnalyzing]);

  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader className="border-b">
        <CardTitle className="text-sm">Hội thoại</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-3 overflow-y-auto pt-4">
        {messages.length === 0 && !isAnalyzing && (
          <p className="text-sm text-muted-foreground">
            Bắt đầu bằng cách mô tả dự án hoặc paste tin nhắn khách hàng ở
            thanh bên dưới.
          </p>
        )}

        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "text-right" : "text-left"}>
            <span
              className={`inline-block max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-left text-sm ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : m.role === "system"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-muted"
              }`}
            >
              {m.message}
            </span>
          </div>
        ))}

        {isAnalyzing && (
          <p className="text-sm text-muted-foreground">
            AI đang phân tích yêu cầu...
          </p>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div ref={bottomRef} />
      </CardContent>
    </Card>
  );
}

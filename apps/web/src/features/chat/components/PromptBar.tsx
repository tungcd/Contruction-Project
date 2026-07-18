"use client";

import { useState } from "react";
import { Input } from "antd";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onSend: (message: string) => void;
  disabled: boolean;
}

export function PromptBar({ onSend, disabled }: Props) {
  const [draft, setDraft] = useState("");

  function handleSend() {
    const text = draft.trim();
    if (!text || disabled) return;
    onSend(text);
    setDraft("");
  }

  return (
    <div className="border-t bg-background p-3">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-end gap-2">
          <Input.TextArea
            autoSize={{ minRows: 1, maxRows: 6 }}
            className="flex-1"
            placeholder="Nhập mô tả dự án, paste tin nhắn khách, hoặc trả lời câu hỏi của AI..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button onClick={handleSend} disabled={!draft.trim() || disabled}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          Enter để gửi · Shift + Enter để xuống dòng
        </p>
      </div>
    </div>
  );
}

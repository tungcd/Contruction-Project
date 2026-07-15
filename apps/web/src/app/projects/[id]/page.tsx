"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Send, FileText } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BRIEF_READY_SCORE } from "@acc/shared-types";
import {
  projectStatusLabel,
  scoreBarClass,
  scoreColorClass,
  scoreHint,
  toRequirementGroups,
} from "@/lib/requirement-view";

export default function WorkspacePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [draft, setDraft] = useState("");
  const [note, setNote] = useState<string | null>(null);

  const { data: project, isLoading, isError, error } = useQuery({
    queryKey: ["project", id],
    queryFn: () => api.getProject(id),
    enabled: !!id,
  });

  if (isLoading)
    return <p className="p-8 text-sm text-muted-foreground">Đang tải...</p>;
  if (isError || !project)
    return (
      <div className="p-8">
        <Link href="/" className="text-sm text-primary">
          &larr; Về Dashboard
        </Link>
        <p className="mt-4 text-sm text-destructive">
          {(error as Error)?.message ?? "Không tải được dự án"}
        </p>
      </div>
    );

  const groups = toRequirementGroups(project.requirement);

  function handleSend() {
    if (!draft.trim()) return;
    // AI sẽ được tích hợp ở Sprint 3 (05-Prompt-and-AI-Contract).
    setNote("Tính năng phân tích AI sẽ được tích hợp ở Sprint 3.");
    setDraft("");
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b bg-background px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="font-semibold leading-tight">{project.name}</h1>
            <p className="text-xs text-muted-foreground">
              {project.customerName ?? "Chưa có tên khách"} ·{" "}
              {projectStatusLabel(project.status)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className={`text-lg font-bold ${scoreColorClass(project.score)}`}>
              {project.score}%
            </span>
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full ${scoreBarClass(project.score)}`}
                style={{ width: `${project.score}%` }}
              />
            </div>
          </div>
          <Link href={`/projects/${id}/brief`}>
            <Button variant={project.score >= BRIEF_READY_SCORE ? "default" : "outline"}>
              <FileText className="h-4 w-4" /> Tạo Project Brief
            </Button>
          </Link>
        </div>
      </header>

      {/* 3 panels */}
      <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden p-4 lg:grid-cols-[1fr_1fr_1fr]">
        {/* Conversation */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="border-b">
            <CardTitle className="text-sm">Hội thoại</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 space-y-3 overflow-y-auto pt-4">
            {project.conversation.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Bắt đầu bằng cách mô tả dự án hoặc paste tin nhắn khách hàng ở
                thanh bên dưới.
              </p>
            ) : (
              project.conversation.map((m) => (
                <div
                  key={m.id}
                  className={m.role === "user" ? "text-right" : "text-left"}
                >
                  <span className="inline-block rounded-lg bg-muted px-3 py-2 text-sm">
                    {m.message}
                  </span>
                </div>
              ))
            )}
            {note && (
              <p className="rounded-md bg-amber-50 p-2 text-xs text-amber-700">
                {note}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Requirement Summary */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="border-b">
            <CardTitle className="text-sm">Tóm tắt yêu cầu</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 space-y-4 overflow-y-auto pt-4">
            <p className={`text-xs ${scoreColorClass(project.score)}`}>
              {scoreHint(project.score)}
            </p>
            {groups.map((g) => (
              <div key={g.title}>
                <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                  {g.title}
                </p>
                <div className="space-y-1">
                  {g.fields.map((f) => (
                    <div
                      key={f.label}
                      className="flex justify-between text-sm"
                    >
                      <span className="text-muted-foreground">{f.label}</span>
                      {f.value ? (
                        <span className="font-medium">{f.value} ✅</span>
                      ) : (
                        <span className="text-amber-600">Chưa rõ ⚠️</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Right panel */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="border-b">
            <CardTitle className="text-sm">Thiếu / Câu hỏi</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 space-y-4 overflow-y-auto pt-4">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                Thông tin còn thiếu
              </p>
              {project.missingFields.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Chưa phát hiện thông tin thiếu.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {project.missingFields.map((m) => (
                    <Badge key={m.key} className="border-amber-300 bg-amber-50 text-amber-700">
                      {m.label}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                Câu hỏi tiếp theo
              </p>
              <p className="text-sm text-muted-foreground">
                Sẽ hiển thị sau khi tích hợp AI (Sprint 3).
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                Giả định / Mâu thuẫn
              </p>
              <p className="text-sm text-muted-foreground">
                Sẽ hiển thị sau khi tích hợp AI (Sprint 3).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prompt bar */}
      <div className="border-t bg-background p-3">
        <div className="mx-auto flex max-w-4xl items-end gap-2">
          <textarea
            rows={1}
            className="flex-1 resize-none rounded-md border px-3 py-2 text-sm"
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
          <Button onClick={handleSend} disabled={!draft.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

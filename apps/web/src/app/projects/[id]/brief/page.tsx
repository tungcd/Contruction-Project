"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Copy, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BRIEF_READY_SCORE } from "@acc/shared-types";
import { toRequirementGroups } from "@/lib/requirement-view";

export default function BriefPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [copied, setCopied] = useState(false);

  const { data: project, isLoading, isError } = useQuery({
    queryKey: ["project", id],
    queryFn: () => api.getProject(id),
    enabled: !!id,
  });

  const markdown = useMemo(() => {
    if (!project) return "";
    const groups = toRequirementGroups(project.requirement);
    const lines: string[] = [`# Project Brief: ${project.name}`, ""];
    for (const g of groups) {
      lines.push(`## ${g.title}`);
      for (const f of g.fields) {
        lines.push(`- **${f.label}:** ${f.value ?? "_Chưa rõ_"}`);
      }
      lines.push("");
    }
    if (project.missingFields.length) {
      lines.push("## Thông tin còn thiếu");
      for (const m of project.missingFields) lines.push(`- ${m.label}`);
      lines.push("");
    }
    lines.push("## Bước tiếp theo");
    lines.push("- Bổ sung các thông tin còn thiếu ở trên.");
    lines.push("- Chuyển brief cho KTS / QS để triển khai.");
    return lines.join("\n");
  }, [project]);

  if (isLoading)
    return <p className="p-8 text-sm text-muted-foreground">Đang tải...</p>;
  if (isError || !project)
    return (
      <div className="p-8">
        <Link href="/" className="text-sm text-primary">
          &larr; Về Dashboard
        </Link>
      </div>
    );

  async function copy() {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <Link href={`/projects/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" /> Quay lại khai thác
          </Button>
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" /> Tạo lại
          </Button>
          <Button size="sm" onClick={copy}>
            <Copy className="h-4 w-4" /> {copied ? "Đã copy!" : "Copy Markdown"}
          </Button>
        </div>
      </div>

      {project.score < BRIEF_READY_SCORE && (
        <div className="mb-4 rounded-md bg-amber-50 p-3 text-sm text-amber-700">
          Brief còn thiếu thông tin (Score {project.score}% &lt;{" "}
          {BRIEF_READY_SCORE}%). Nên bổ sung thêm trước khi gửi khách.
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
            {markdown}
          </pre>
        </CardContent>
      </Card>

      <p className="mt-4 text-xs text-muted-foreground">
        * Bản Brief tự động từ AI sẽ được hoàn thiện ở Sprint 4. Hiện tại brief
        được dựng từ Requirement đã thu thập.
      </p>
    </main>
  );
}

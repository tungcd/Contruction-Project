"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Copy, RefreshCw } from "lucide-react";
import { projectService } from "@/services/project.service";
import { Button } from "@/components/ui/button";
import {
  buildBudgetSection,
  buildCoreSections,
  buildScopeSection,
  buildSummaryParagraph,
} from "@/features/requirement/brief-view";
import { ProjectBriefView } from "@/features/requirement/components/ProjectBriefView";
import { useAssumptions } from "@/features/requirement/analysis-store";

export default function BriefPage() {
  const { id } = useParams<{ id: string }>();
  const [copied, setCopied] = useState(false);
  const assumptions = useAssumptions(id);

  const { data: project, isLoading, isError, refetch } = useQuery({
    queryKey: ["project", id],
    queryFn: () => projectService.get(id),
    enabled: !!id,
  });

  const brief = useMemo(() => {
    if (!project) return null;
    return {
      coreSections: buildCoreSections(project.requirement),
      budgetSection: buildBudgetSection(project.requirement),
      scopeSection: buildScopeSection(project.requirement),
      summaryParagraph: buildSummaryParagraph(project.requirement),
    };
  }, [project]);

  const plainText = useMemo(() => {
    if (!project || !brief) return "";
    const lines: string[] = [`Project Brief: ${project.name}`, ""];

    for (const section of brief.coreSections) {
      if (!section.fields.length) continue;
      lines.push(section.title);
      for (const f of section.fields) lines.push(`- ${f.label}: ${f.value}`);
      lines.push("");
    }
    for (const section of [brief.budgetSection, brief.scopeSection]) {
      if (!section) continue;
      lines.push(section.title);
      for (const f of section.fields) lines.push(`- ${f.label}: ${f.value}`);
      lines.push("");
    }
    if (project.toConfirm.length) {
      lines.push("Các thông tin cần xác nhận");
      for (const t of project.toConfirm) lines.push(`- ${t.label}`);
      lines.push("");
    }
    if (assumptions.length) {
      lines.push("Giả định của AI");
      for (const a of assumptions) lines.push(`- ${a}`);
      lines.push("");
    }
    lines.push("Đánh giá sơ bộ");
    lines.push(brief.summaryParagraph);
    return lines.join("\n");
  }, [project, brief, assumptions]);

  if (isLoading)
    return <p className="p-8 text-sm text-muted-foreground">Đang tải...</p>;
  if (isError || !project || !brief)
    return (
      <div className="p-8">
        <Link href="/" className="text-sm text-primary">
          &larr; Về Dashboard
        </Link>
      </div>
    );

  async function copy() {
    await navigator.clipboard.writeText(plainText);
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
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" /> Tạo lại
          </Button>
          <Button size="sm" onClick={copy}>
            <Copy className="h-4 w-4" /> {copied ? "Đã copy!" : "Copy"}
          </Button>
        </div>
      </div>

      {!project.readiness.brief.ready && (
        <div className="mb-4 rounded-md bg-amber-50 p-3 text-sm text-amber-700">
          Brief còn thiếu thông tin bắt buộc: {project.readiness.brief.missing.join(", ")}.
          Nên bổ sung trước khi gửi khách.
        </div>
      )}

      <ProjectBriefView
        projectName={project.name}
        customerName={project.customerName}
        coreSections={brief.coreSections}
        budgetSection={brief.budgetSection}
        scopeSection={brief.scopeSection}
        toConfirm={project.toConfirm}
        assumptions={assumptions}
        summaryParagraph={brief.summaryParagraph}
      />
    </main>
  );
}

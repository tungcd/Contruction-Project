"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
import { projectService } from "@/services/project.service";
import { estimateService } from "@/services/estimate.service";
import { Button } from "@/components/ui/button";
import { EstimateSectionTable } from "@/features/estimate/components/EstimateSectionTable";
import { recomputeAmount } from "@/features/estimate/estimate-view";
import type { EstimateDraft } from "@/lib/estimate/types";

export default function EstimatePage() {
  const { id } = useParams<{ id: string }>();
  const [draft, setDraft] = useState<EstimateDraft | null>(null);

  const { data: project, isLoading, isError } = useQuery({
    queryKey: ["project", id],
    queryFn: () => projectService.get(id),
    enabled: !!id,
  });

  const generateMutation = useMutation({
    mutationFn: () => estimateService.generate(project!.requirement),
    onSuccess: (result) => setDraft(result),
  });

  function updateLine(
    sectionIndex: number,
    lineIndex: number,
    patch: { quantity?: number | null; unitPrice?: number | null },
  ) {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map((section, si) => {
          if (si !== sectionIndex) return section;
          return {
            ...section,
            lines: section.lines.map((line, li) => {
              if (li !== lineIndex) return line;
              const next = { ...line, ...patch };
              return {
                ...next,
                amount: recomputeAmount(next.quantity, next.unitPrice),
                // Ticket M3-004: chỉ sửa quantity mới đánh dấu user_confirmed,
                // sửa unitPrice không đổi quantitySource.
                quantitySource:
                  patch.quantity !== undefined ? "user_confirmed" : line.quantitySource,
              };
            }),
          };
        }),
      };
    });
  }

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

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <Link href={`/projects/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" /> Quay lại khai thác
          </Button>
        </Link>
        <Button
          size="sm"
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
        >
          <RefreshCw className="h-4 w-4" />{" "}
          {draft ? "Tạo lại dự toán" : "Tạo dự toán"}
        </Button>
      </div>

      {generateMutation.isError && (
        <p className="mb-4 text-sm text-destructive">
          {(generateMutation.error as Error).message}
        </p>
      )}

      {draft?.priceBookIsDemo && (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Đang dùng <strong>bảng giá DEMO</strong> (giá bịa để review Rule
            Engine) — KHÔNG dùng số liệu này để báo giá thật cho khách.
          </span>
        </div>
      )}

      {!draft && (
        <p className="text-sm text-muted-foreground">
          Bấm &quot;Tạo dự toán&quot; để sinh bản dự toán sơ bộ (BOQ Draft) từ
          yêu cầu hiện tại của dự án.
        </p>
      )}

      {draft && (
        <div className="space-y-6">
          {draft.sections
            .map((section, sectionIndex) => ({ section, sectionIndex }))
            .sort((a, b) => a.section.order - b.section.order)
            .map(({ section, sectionIndex }) => (
              <EstimateSectionTable
                key={section.code}
                section={section}
                onChangeLine={(lineIndex, patch) =>
                  updateLine(sectionIndex, lineIndex, patch)
                }
              />
            ))}
        </div>
      )}
    </main>
  );
}

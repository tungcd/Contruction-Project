"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, Download, RefreshCw, Save } from "lucide-react";
import { projectService } from "@/services/project.service";
import { estimateService } from "@/services/estimate.service";
import { pricebookService } from "@/services/pricebook.service";
import { Button } from "@/components/ui/button";
import { EstimateSectionTable } from "@/features/estimate/components/EstimateSectionTable";
import { EstimateSummaryPanel } from "@/features/estimate/components/EstimateSummaryPanel";
import { recomputeAmount } from "@/features/estimate/estimate-view";
import type { EstimateDraft } from "@/lib/estimate/types";

export default function EstimatePage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<EstimateDraft | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<string>("");
  const [selectedPriceBookId, setSelectedPriceBookId] = useState<string>("");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const autoLoaded = useRef(false);

  // Milestone Estimate MVP — Feature 5: chọn PriceBook khi tạo dự toán
  // (mặc định "" = server tự dùng DEMO_PRICE_BOOK, giữ đúng hành vi M3-003/004).
  const priceBooksQuery = useQuery({
    queryKey: ["pricebooks"],
    queryFn: pricebookService.list,
  });

  const { data: project, isLoading, isError } = useQuery({
    queryKey: ["project", id],
    queryFn: () => projectService.get(id),
    enabled: !!id,
  });

  const historyQuery = useQuery({
    queryKey: ["estimate-drafts", id],
    queryFn: () => estimateService.listDraftHistory(id),
    enabled: !!id,
  });

  // Milestone Estimate MVP — Feature 1: tự load version mới nhất khi mở
  // trang lần đầu (không mất khi refresh). Chỉ auto-load 1 lần — sau đó
  // Founder tự chọn version khác hoặc tự "Tạo lại dự toán".
  useEffect(() => {
    if (autoLoaded.current) return;
    const latest = historyQuery.data?.[0];
    if (!latest) return;
    autoLoaded.current = true;
    setSelectedVersion(latest.id);
    estimateService.getDraftVersion(id, latest.id).then((record) => {
      setDraft(record.data);
    });
  }, [historyQuery.data, id]);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const priceBook = selectedPriceBookId
        ? await pricebookService.get(selectedPriceBookId)
        : undefined;
      return estimateService.generate(project!.requirement, priceBook);
    },
    onSuccess: (result) => {
      setDraft(result);
      setSelectedVersion("");
      setSavedAt(null);
    },
  });

  const saveMutation = useMutation({
    mutationFn: () => estimateService.saveDraft(id, draft!),
    onSuccess: (record) => {
      setSavedAt(record.updatedAt);
      setSelectedVersion(record.id);
      queryClient.invalidateQueries({ queryKey: ["estimate-drafts", id] });
    },
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const blob = await estimateService.exportExcel(draft!, project!.name);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `du-toan-${project!.name}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });

  function loadVersion(draftId: string) {
    if (!draftId) return;
    setSelectedVersion(draftId);
    estimateService.getDraftVersion(id, draftId).then((record) => {
      setDraft(record.data);
      setSavedAt(record.updatedAt);
    });
  }

  function generateFresh() {
    if (draft && !window.confirm("Tạo dự toán mới sẽ thay thế bản đang xem (nếu chưa lưu sẽ mất). Tiếp tục?")) {
      return;
    }
    generateMutation.mutate();
  }

  function updateLine(
    sectionIndex: number,
    lineIndex: number,
    patch: {
      quantity?: number | null;
      unitPrice?: number | null;
      note?: string | null;
    },
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
                // Milestone M3-004: chỉ sửa quantity mới đánh dấu user_confirmed,
                // sửa unitPrice/note không đổi quantitySource.
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

  const history = historyQuery.data ?? [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Link href={`/projects/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" /> Quay lại khai thác
          </Button>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {priceBooksQuery.data && priceBooksQuery.data.length > 0 && (
            <select
              className="rounded-md border px-2 py-1.5 text-sm"
              value={selectedPriceBookId}
              onChange={(e) => setSelectedPriceBookId(e.target.value)}
              title="Bảng giá dùng khi tạo dự toán"
            >
              <option value="">Bảng giá demo (mặc định)</option>
              {priceBooksQuery.data.map((pb) => (
                <option key={pb.id} value={pb.id}>
                  {pb.name}
                </option>
              ))}
            </select>
          )}
          {history.length > 0 && (
            <select
              className="rounded-md border px-2 py-1.5 text-sm"
              value={selectedVersion}
              onChange={(e) => loadVersion(e.target.value)}
            >
              <option value="" disabled>
                Lịch sử dự toán ({history.length} bản)
              </option>
              {history.map((h) => (
                <option key={h.id} value={h.id}>
                  v{h.version} — {new Date(h.updatedAt).toLocaleString("vi-VN")}
                  {h.editedBy ? ` — ${h.editedBy}` : ""}
                </option>
              ))}
            </select>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={generateFresh}
            disabled={generateMutation.isPending}
          >
            <RefreshCw className="h-4 w-4" />{" "}
            {draft ? "Tạo lại dự toán" : "Tạo dự toán"}
          </Button>
          <Button
            size="sm"
            onClick={() => saveMutation.mutate()}
            disabled={!draft || saveMutation.isPending}
          >
            <Save className="h-4 w-4" /> Lưu
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => exportMutation.mutate()}
            disabled={!draft || exportMutation.isPending}
          >
            <Download className="h-4 w-4" /> Xuất Excel
          </Button>
        </div>
      </div>

      {generateMutation.isError && (
        <p className="mb-4 text-sm text-destructive">
          {(generateMutation.error as Error).message}
        </p>
      )}
      {saveMutation.isError && (
        <p className="mb-4 text-sm text-destructive">
          {(saveMutation.error as Error).message}
        </p>
      )}
      {exportMutation.isError && (
        <p className="mb-4 text-sm text-destructive">
          {(exportMutation.error as Error).message}
        </p>
      )}
      {savedAt && !saveMutation.isPending && (
        <p className="mb-4 text-xs text-muted-foreground">
          Đã lưu lúc {new Date(savedAt).toLocaleString("vi-VN")}
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
          <EstimateSummaryPanel draft={draft} />

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

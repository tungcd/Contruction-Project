"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { App, Select } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  RefreshCw,
  Save,
} from "lucide-react";
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
  const { modal } = App.useApp();
  const [draft, setDraft] = useState<EstimateDraft | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<string>("");
  const [selectedPriceBookId, setSelectedPriceBookId] = useState<string>("");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  // Demo Polish — Task 4: phát hiện qua rà soát code — nếu sửa dòng rồi bấm
  // "Xác nhận" mà chưa "Lưu", server sẽ xác nhận bản CŨ (selectedVersion vẫn
  // trỏ version đã lưu trước đó), thay đổi vừa sửa bị bỏ qua âm thầm. Khoá
  // nút Xác nhận khi có thay đổi chưa lưu để tránh đúng lỗi này.
  const [isDirty, setIsDirty] = useState(false);
  const autoLoaded = useRef(false);
  const autoSelectedPriceBook = useRef(false);

  // Milestone Estimate MVP — Feature 5: chọn PriceBook khi tạo dự toán
  // (mặc định "" = server tự dùng DEMO_PRICE_BOOK, giữ đúng hành vi M3-003/004).
  const priceBooksQuery = useQuery({
    queryKey: ["pricebooks"],
    queryFn: pricebookService.list,
  });

  // Bảng giá đặt "Mặc định" (trang /pricebooks) tự chọn khi mở trang lần
  // đầu — chỉ auto-chọn 1 lần, không ghi đè nếu Founder đã tự đổi lựa chọn.
  useEffect(() => {
    if (autoSelectedPriceBook.current) return;
    const defaultPriceBook = priceBooksQuery.data?.find((pb) => pb.isDefault);
    if (!defaultPriceBook) return;
    autoSelectedPriceBook.current = true;
    setSelectedPriceBookId(defaultPriceBook.id);
  }, [priceBooksQuery.data]);

  const {
    data: project,
    isLoading,
    isError,
  } = useQuery({
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
      setIsDirty(false);
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
      setIsDirty(false);
    },
  });

  const saveMutation = useMutation({
    mutationFn: () => estimateService.saveDraft(id, draft!),
    onSuccess: (record) => {
      setSavedAt(record.updatedAt);
      setSelectedVersion(record.id);
      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: ["estimate-drafts", id] });
    },
  });

  const confirmMutation = useMutation({
    mutationFn: () => estimateService.confirmDraft(id, selectedVersion),
    onSuccess: () => {
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
      setIsDirty(false);
    });
  }

  function generateFresh() {
    if (!draft) {
      generateMutation.mutate();
      return;
    }
    modal.confirm({
      title: "Tạo dự toán mới?",
      content:
        "Tạo dự toán mới sẽ thay thế bản đang xem (nếu chưa lưu sẽ mất). Tiếp tục?",
      okText: "Tiếp tục",
      cancelText: "Huỷ",
      onOk: () => generateMutation.mutate(),
    });
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
    setIsDirty(true);
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
                  patch.quantity !== undefined
                    ? "user_confirmed"
                    : line.quantitySource,
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
  const selectedHistoryEntry = history.find((h) => h.id === selectedVersion);
  const isConfirmed = selectedHistoryEntry?.status === "confirmed";

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
            <Select
              className="w-48"
              value={selectedPriceBookId}
              onChange={(value) => setSelectedPriceBookId(value)}
              title="Bảng giá dùng khi tạo dự toán"
              options={[
                { value: "", label: "Bảng giá demo (mặc định)" },
                ...priceBooksQuery.data.map((pb) => ({
                  value: pb.id,
                  label: pb.name,
                })),
              ]}
            />
          )}
          {history.length > 0 && (
            <Select
              className="w-64"
              value={selectedVersion || undefined}
              placeholder={`Lịch sử dự toán (${history.length} bản)`}
              onChange={(value) => loadVersion(value)}
              options={history.map((h) => ({
                value: h.id,
                label: `v${h.version} — ${new Date(h.updatedAt).toLocaleString("vi-VN")}${h.editedBy ? ` — ${h.editedBy}` : ""}`,
              }))}
            />
          )}
          <Button
            variant="outline"
            onClick={generateFresh}
            disabled={generateMutation.isPending}
          >
            <RefreshCw className="h-4 w-4" />{" "}
            {draft ? "Tạo lại dự toán" : "Tạo dự toán"}
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!draft || saveMutation.isPending}
          >
            <Save className="h-4 w-4" /> Lưu
          </Button>
          {isConfirmed ? (
            <span className="flex items-center gap-1 rounded-md border border-green-200 bg-green-50 px-3 py-1.5 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4" /> Đã xác nhận
            </span>
          ) : (
            <Button
              variant="outline"
              onClick={() => confirmMutation.mutate()}
              disabled={!selectedVersion || isDirty || confirmMutation.isPending}
              title={
                !selectedVersion
                  ? "Cần Lưu dự toán trước khi xác nhận"
                  : isDirty
                    ? "Có thay đổi chưa lưu — bấm Lưu trước khi xác nhận"
                    : "Đánh dấu bản này đã chốt — Báo giá đề xuất sẽ dùng bản này"
              }
            >
              <CheckCircle2 className="h-4 w-4" /> Xác nhận
            </Button>
          )}
          <Button
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
      {confirmMutation.isError && (
        <p className="mb-4 text-sm text-destructive">
          {(confirmMutation.error as Error).message}
        </p>
      )}
      {exportMutation.isError && (
        <p className="mb-4 text-sm text-destructive">
          {(exportMutation.error as Error).message}
        </p>
      )}
      {isDirty && (
        <p className="mb-4 text-xs text-amber-600">
          Có thay đổi chưa lưu — bấm &quot;Lưu&quot; trước khi Xác nhận, nếu không thay
          đổi sẽ không được đưa vào bản Báo giá đề xuất.
        </p>
      )}
      {!isDirty && savedAt && !saveMutation.isPending && (
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

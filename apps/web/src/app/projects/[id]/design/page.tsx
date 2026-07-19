"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Segmented } from "antd";
import { ArrowLeft, Printer, RefreshCw } from "lucide-react";
import { compileRequirementToConstraintSet } from "@acc/shared-types";
import { projectService } from "@/services/project.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateConceptDrawing } from "@/lib/drawing/generateDrawing";
import { renderFloorPlanToSvg } from "@/lib/drawing/svgRenderer";

/**
 * Concept Drawing — hỗ trợ nhà 1 tầng (Stage 1) VÀ nhiều tầng + cầu
 * thang (Stage 2A, xem documents/CHATGPT_CONTEXT/2026-07/2026-W29/
 * 2026-07-19/01_Completion-Report-Concept-Drawing-Stage1.7.md và báo
 * cáo Stage 2A). Villa/AI layout generation vẫn ngoài phạm vi.
 *
 * Web preview chỉ hiện 1 sheet (chọn qua `Segmented` — Task 5), nhưng
 * NÚT IN luôn in TOÀN BỘ sheet (mỗi tầng 1 trang A4 riêng, xem
 * `.design-print-area` trong globals.css và `renderAllSheetsToPrintHtml`
 * bên dưới) — không giới hạn bản in chỉ 1 tầng đang xem trên màn hình.
 */
export default function DesignPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [selectedFloor, setSelectedFloor] = useState(0);

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: () => projectService.get(id),
    enabled: !!id,
  });

  const confirmMutation = useMutation({
    mutationFn: () => projectService.confirmRequirement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
    },
  });

  const result = useMemo(() => {
    if (!project) return null;
    if (project.requirement.status !== "confirmed") {
      return { error: "Yêu cầu (Requirement) chưa được xác nhận." as string, drawing: null };
    }
    try {
      const constraintSet = compileRequirementToConstraintSet(project.requirement);
      const drawing = generateConceptDrawing(constraintSet, project.name);
      return { error: null, drawing };
    } catch (err) {
      return { error: (err as Error).message, drawing: null };
    }
  }, [project]);

  const sheets = result?.drawing?.drawingPackage.sheets ?? [];
  const activeIndex = Math.min(selectedFloor, Math.max(sheets.length - 1, 0));
  const svg = sheets[activeIndex] ? renderFloorPlanToSvg(sheets[activeIndex]) : null;
  // In: LUÔN render đủ mọi tầng (không chỉ tầng đang xem) — mỗi sheet 1
  // <div class="design-sheet"> riêng, page-break-after ngăn giữa các tầng
  // (xem .design-print-area .design-sheet trong globals.css).
  const allSheetsHtml = sheets
    .map((s) => `<div class="design-sheet">${renderFloorPlanToSvg(s)}</div>`)
    .join("");

  return (
    <main className="design-print-area mx-auto max-w-4xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link href={`/projects/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </Button>
        </Link>
        {svg && (
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> In / Xuất PDF
          </Button>
        )}
      </div>

      <h1 className="mb-1 text-xl font-bold print:hidden">Bản vẽ khái niệm (Concept Drawing)</h1>
      <p className="mb-4 text-sm text-muted-foreground print:hidden">
        Stage 1 — mặt bằng 1 tầng, sơ bộ, chưa qua kiến trúc sư duyệt.
      </p>

      {isLoading && <p className="text-sm text-muted-foreground">Đang tải...</p>}

      {!isLoading && result?.error && (
        <div className="space-y-3 rounded-md bg-amber-50 p-4 text-sm text-amber-700">
          <p>Chưa thể tạo bản vẽ: {result.error}</p>
          {project && project.requirement.status !== "confirmed" && (
            <Button
              size="sm"
              onClick={() => confirmMutation.mutate()}
              disabled={confirmMutation.isPending}
            >
              <RefreshCw className="h-4 w-4" /> Xác nhận yêu cầu
            </Button>
          )}
        </div>
      )}

      {svg && result?.drawing && (
        <div className="space-y-4">
          {sheets.length > 1 && (
            <div className="print:hidden">
              <Segmented
                value={activeIndex}
                onChange={(v) => setSelectedFloor(Number(v))}
                options={sheets.map((s, i) => ({ label: s.titleBlock.floorLabel, value: i }))}
              />
            </div>
          )}

          {/* Xem trên màn hình: CHỈ tầng đang chọn. */}
          <Card className="print:hidden">
            <CardContent className="overflow-x-auto pt-4">
              {/* SVG do renderFloorPlanToSvg sinh — chuỗi tĩnh, không chứa input người dùng thô. */}
              <div dangerouslySetInnerHTML={{ __html: svg }} />
            </CardContent>
          </Card>

          {/* In: LUÔN toàn bộ sheet, mỗi tầng 1 trang riêng (xem .design-print-area trong globals.css). */}
          <div
            className="hidden print:block"
            dangerouslySetInnerHTML={{ __html: allSheetsHtml }}
          />

          {sheets[activeIndex].warnings.length > 0 && (
            <Card className="border-amber-300 print:hidden">
              <CardHeader>
                <CardTitle className="text-base">Cảnh báo ({sheets[activeIndex].titleBlock.floorLabel})</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-inside list-disc space-y-1 text-sm text-amber-700">
                  {sheets[activeIndex].warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card className="print:hidden">
            <CardHeader>
              <CardTitle className="text-base">Giả định ({sheets[activeIndex].titleBlock.floorLabel})</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                {sheets[activeIndex].assumptions.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}

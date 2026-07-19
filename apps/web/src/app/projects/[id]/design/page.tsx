"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Printer, RefreshCw } from "lucide-react";
import { compileRequirementToConstraintSet } from "@acc/shared-types";
import { projectService } from "@/services/project.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateConceptDrawing } from "@/lib/drawing/generateDrawing";
import { renderFloorPlanToSvg } from "@/lib/drawing/svgRenderer";

/**
 * Concept Drawing — Stage 1 (Single-Floor Geometry POC). Chỉ hỗ trợ nhà
 * 1 tầng theo đúng phạm vi được Founder/Tech Lead phê duyệt (xem
 * documents/CHATGPT_CONTEXT/2026-07/2026-W29/2026-07-18/
 * 21_Architecture-Concept-Drawing-MVP-Revised.md). Không cầu thang,
 * không nhiều tầng, không villa, không AI layout.
 */
export default function DesignPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

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

  const svg = result?.drawing
    ? renderFloorPlanToSvg(result.drawing.drawingPackage.sheets[0])
    : null;

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
          <Card>
            <CardContent className="overflow-x-auto pt-4">
              {/* SVG do renderFloorPlanToSvg sinh — chuỗi tĩnh, không chứa input người dùng thô. */}
              <div dangerouslySetInnerHTML={{ __html: svg }} />
            </CardContent>
          </Card>

          {result.drawing.drawingPackage.sheets[0].warnings.length > 0 && (
            <Card className="border-amber-300">
              <CardHeader>
                <CardTitle className="text-base">Cảnh báo</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-inside list-disc space-y-1 text-sm text-amber-700">
                  {result.drawing.drawingPackage.sheets[0].warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Giả định</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                {result.drawing.drawingPackage.sheets[0].assumptions.map((a) => (
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

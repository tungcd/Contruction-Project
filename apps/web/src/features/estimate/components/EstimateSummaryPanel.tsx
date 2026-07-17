"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EstimateDraft } from "@/lib/estimate/types";
import { buildEstimateSummary, formatVnd } from "../estimate-view";

interface Props {
  draft: EstimateDraft;
}

/** Milestone Estimate MVP — Feature 4: subtotal từng section, tổng tiền, đếm dòng theo trạng thái. */
export function EstimateSummaryPanel({ draft }: Props) {
  const summary = buildEstimateSummary(draft);

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="text-sm">Tổng quan dự toán</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 pt-4 sm:grid-cols-4">
        <div>
          <p className="text-xs text-muted-foreground">Tổng tiền</p>
          <p className="text-lg font-bold">{formatVnd(summary.total)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Tổng số dòng</p>
          <p className="text-lg font-bold">{summary.totalLines}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Cần đo đạc / khảo sát</p>
          <p className="text-lg font-bold text-amber-600">
            {summary.needsSurveyOrMeasurementCount}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Đã xác nhận</p>
          <p className="text-lg font-bold text-green-600">
            {summary.userConfirmedCount}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

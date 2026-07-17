"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BOQSection } from "@/lib/estimate/types";
import {
  confidenceBadgeClass,
  confidenceLabel,
  formatVnd,
  quantitySourceBadgeClass,
  quantitySourceLabel,
  sectionSubtotal,
} from "../estimate-view";

interface Props {
  section: BOQSection;
  onChangeLine: (
    lineIndex: number,
    patch: {
      quantity?: number | null;
      unitPrice?: number | null;
      note?: string | null;
    },
  ) => void;
}

export function EstimateSectionTable({ section, onChangeLine }: Props) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between border-b">
        <CardTitle className="text-sm">{section.name}</CardTitle>
        <span className="text-sm font-medium text-muted-foreground">
          Tạm tính: {formatVnd(sectionSubtotal(section))}
        </span>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <th className="p-2">Hạng mục</th>
              <th className="p-2">ĐVT</th>
              <th className="p-2 text-right">Khối lượng</th>
              <th className="p-2 text-right">Đơn giá</th>
              <th className="p-2 text-right">Thành tiền</th>
              <th className="p-2">Nguồn số liệu</th>
              <th className="p-2">Độ tin cậy</th>
              <th className="p-2">Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {section.lines.map((line, lineIndex) => (
              <tr key={line.code} className="border-b align-top last:border-0">
                <td className="p-2">{line.itemName}</td>
                <td className="p-2">{line.unit}</td>
                <td className="p-2 text-right">
                  <input
                    type="number"
                    step="any"
                    className="w-24 rounded border px-2 py-1 text-right"
                    value={line.quantity ?? ""}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === "") {
                        onChangeLine(lineIndex, { quantity: null });
                        return;
                      }
                      const parsed = Number(raw);
                      if (Number.isNaN(parsed)) return;
                      onChangeLine(lineIndex, { quantity: parsed });
                    }}
                  />
                </td>
                <td className="p-2 text-right">
                  <input
                    type="number"
                    step="any"
                    className="w-28 rounded border px-2 py-1 text-right"
                    value={line.unitPrice ?? ""}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === "") {
                        onChangeLine(lineIndex, { unitPrice: null });
                        return;
                      }
                      const parsed = Number(raw);
                      if (Number.isNaN(parsed)) return;
                      onChangeLine(lineIndex, { unitPrice: parsed });
                    }}
                  />
                </td>
                <td className="p-2 text-right font-medium">{formatVnd(line.amount)}</td>
                <td className="p-2">
                  <Badge className={quantitySourceBadgeClass[line.quantitySource]}>
                    {quantitySourceLabel[line.quantitySource]}
                  </Badge>
                </td>
                <td className="p-2">
                  <Badge className={confidenceBadgeClass[line.confidence]}>
                    {confidenceLabel[line.confidence]}
                  </Badge>
                </td>
                <td className="p-2">
                  <textarea
                    rows={2}
                    className="w-48 rounded border px-2 py-1 text-xs text-muted-foreground"
                    value={line.note ?? ""}
                    onChange={(e) =>
                      onChangeLine(lineIndex, {
                        note: e.target.value === "" ? null : e.target.value,
                      })
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

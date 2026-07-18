"use client";

import { Input, Table, type TableColumnsType } from "antd";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatThousandsInput, parseThousandsInput } from "@/lib/utils";
import type { BOQDraftLine, BOQSection } from "@/lib/estimate/types";
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

type Row = BOQDraftLine & { rowIndex: number };

export function EstimateSectionTable({ section, onChangeLine }: Props) {
  const columns: TableColumnsType<Row> = [
    { title: "Hạng mục", dataIndex: "itemName", key: "itemName" },
    { title: "ĐVT", dataIndex: "unit", key: "unit", width: 64 },
    {
      title: "Khối lượng",
      key: "quantity",
      width: 110,
      align: "right",
      render: (_, row) => (
        <Input
          type="number"
          step="any"
          value={row.quantity ?? ""}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") {
              onChangeLine(row.rowIndex, { quantity: null });
              return;
            }
            const parsed = Number(raw);
            if (Number.isNaN(parsed)) return;
            onChangeLine(row.rowIndex, { quantity: parsed });
          }}
        />
      ),
    },
    {
      title: "Đơn giá",
      key: "unitPrice",
      width: 130,
      align: "right",
      render: (_, row) => (
        <Input
          inputMode="numeric"
          value={formatThousandsInput(row.unitPrice)}
          onChange={(e) =>
            onChangeLine(row.rowIndex, {
              unitPrice: parseThousandsInput(e.target.value),
            })
          }
        />
      ),
    },
    {
      title: "Thành tiền",
      key: "amount",
      width: 130,
      align: "right",
      render: (_, row) => <span className="font-medium">{formatVnd(row.amount)}</span>,
    },
    {
      title: "Nguồn số liệu",
      key: "quantitySource",
      width: 150,
      render: (_, row) => (
        <Badge className={quantitySourceBadgeClass[row.quantitySource]}>
          {quantitySourceLabel[row.quantitySource]}
        </Badge>
      ),
    },
    {
      title: "Độ tin cậy",
      key: "confidence",
      width: 110,
      render: (_, row) => (
        <Badge className={confidenceBadgeClass[row.confidence]}>
          {confidenceLabel[row.confidence]}
        </Badge>
      ),
    },
    {
      title: "Ghi chú",
      key: "note",
      width: 220,
      render: (_, row) => (
        <Input.TextArea
          autoSize={{ minRows: 1, maxRows: 4 }}
          className="text-xs text-muted-foreground"
          value={row.note ?? ""}
          onChange={(e) =>
            onChangeLine(row.rowIndex, {
              note: e.target.value === "" ? null : e.target.value,
            })
          }
        />
      ),
    },
  ];

  const dataSource: Row[] = section.lines.map((line, rowIndex) => ({
    ...line,
    rowIndex,
  }));

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between border-b">
        <CardTitle className="text-sm">{section.name}</CardTitle>
        <span className="text-sm font-medium text-muted-foreground">
          Tạm tính: {formatVnd(sectionSubtotal(section))}
        </span>
      </CardHeader>
      <Table<Row>
        rowKey={(row) => row.code}
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        size="small"
        scroll={{ x: true }}
      />
    </Card>
  );
}

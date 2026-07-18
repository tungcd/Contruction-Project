import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatVnd } from "@/features/estimate/estimate-view";
import type { Proposal } from "@/lib/proposal/types";
import type { BriefSection } from "@/features/requirement/brief-view";

/**
 * Proposal MVP — Web Preview. "Không cần đẹp, đủ để demo" (cùng tinh
 * thần Project Brief/Estimate). In/Xuất PDF dùng `window.print()` +
 * Tailwind `print:` variant, không cần thư viện PDF riêng (xem
 * documents/CHATGPT_CONTEXT/2026-07/2026-W29/2026-07-18/
 * 16_Architecture-Proposal-MVP.md mục 5).
 */

interface Props {
  projectName: string;
  proposal: Proposal;
}

function SectionCard({ section }: { section: BriefSection }) {
  if (section.fields.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{section.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
          {section.fields.map((f) => (
            <div key={f.label} className="flex justify-between gap-2 text-sm sm:block">
              <dt className="text-muted-foreground">{f.label}</dt>
              <dd className="font-medium sm:mt-0.5">{f.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

export function ProposalView({ projectName, proposal }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Báo giá đề xuất: {projectName}</h1>
          {proposal.customerSummary.name && (
            <p className="text-sm text-muted-foreground">
              Khách hàng: {proposal.customerSummary.name}
              {proposal.customerSummary.phone ? ` — ${proposal.customerSummary.phone}` : ""}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Lập ngày {new Date(proposal.generatedAt).toLocaleDateString("vi-VN")} — có hiệu lực đến{" "}
            {new Date(proposal.validity.validUntil).toLocaleDateString("vi-VN")}
          </p>
        </div>
        {proposal.contractorInfo.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- URL bất kỳ do Founder nhập, không qua next/image domain whitelist
          <img
            src={proposal.contractorInfo.logoUrl}
            alt={proposal.contractorInfo.companyName}
            className="h-12 w-auto object-contain"
          />
        )}
      </div>

      {proposal.projectSummary.map((section) => (
        <SectionCard key={section.title} section={section} />
      ))}
      {proposal.proposedScope && <SectionCard section={proposal.proposedScope} />}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tổng quan báo giá</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tổng cộng</span>
            <span className="font-semibold">{formatVnd(proposal.estimateSummary.total)}</span>
          </div>
          <dl className="space-y-1">
            {proposal.estimateSummary.sectionSubtotals.map((s) => (
              <div key={s.code} className="flex justify-between text-sm">
                <dt className="text-muted-foreground">{s.name}</dt>
                <dd>{formatVnd(s.subtotal)}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      {proposal.exclusions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Không thuộc phạm vi báo giá</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {proposal.exclusions.map((r) => (
              <Badge key={r} className="border-red-200 bg-red-50 text-red-700">
                {r}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      {proposal.assumptions.length > 0 && (
        <Card className="border-amber-300">
          <CardHeader>
            <CardTitle className="text-base">Giả định — cần xác nhận thêm</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              {proposal.assumptions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {(proposal.timeline.expectedStart || proposal.timeline.expectedFinish) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tiến độ dự kiến</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {proposal.timeline.expectedStart && (
              <div>Khởi công: {proposal.timeline.expectedStart}</div>
            )}
            {proposal.timeline.expectedFinish && (
              <div>Hoàn thành: {proposal.timeline.expectedFinish}</div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thanh toán</CardTitle>
        </CardHeader>
        <CardContent>
          {proposal.paymentPlan.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Chưa thiết lập tiến độ thanh toán — vui lòng bổ sung trước khi gửi khách.
            </p>
          ) : (
            <ul className="space-y-1 text-sm">
              {proposal.paymentPlan.map((m) => (
                <li key={m.label} className="flex justify-between">
                  <span>{m.label}</span>
                  <span className="font-medium">{m.percent}%</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {proposal.warrantyNote && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bảo hành</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">{proposal.warrantyNote}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Đơn vị thi công</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <div className="font-medium">{proposal.contractorInfo.companyName}</div>
          {proposal.contractorInfo.phone && (
            <div className="text-muted-foreground">{proposal.contractorInfo.phone}</div>
          )}
          {proposal.contractorInfo.email && (
            <div className="text-muted-foreground">{proposal.contractorInfo.email}</div>
          )}
          {proposal.contractorInfo.website && (
            <div className="text-muted-foreground">{proposal.contractorInfo.website}</div>
          )}
          {proposal.contractorInfo.address && (
            <div className="text-muted-foreground">{proposal.contractorInfo.address}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

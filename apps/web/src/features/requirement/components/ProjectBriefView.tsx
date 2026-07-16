import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BriefSection } from "../brief-view";

/**
 * Project Brief (P0-001). Render trực tiếp từ dữ liệu đã tính sẵn — không tự
 * gọi API, không tự suy diễn thêm. "Không cần đẹp, đủ để demo" (ticket).
 */
interface Props {
  projectName: string;
  customerName: string | null;
  coreSections: BriefSection[];
  budgetSection: BriefSection | null;
  scopeSection: BriefSection | null;
  toConfirm: { key: string; label: string }[];
  assumptions: string[];
  summaryParagraph: string;
}

function SectionCard({ section }: { section: BriefSection }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{section.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {section.fields.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có thông tin.</p>
        ) : (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
            {section.fields.map((f) => (
              <div key={f.label} className="flex justify-between gap-2 text-sm sm:block">
                <dt className="text-muted-foreground">{f.label}</dt>
                <dd className="font-medium sm:mt-0.5">{f.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </CardContent>
    </Card>
  );
}

export function ProjectBriefView({
  projectName,
  customerName,
  coreSections,
  budgetSection,
  scopeSection,
  toConfirm,
  assumptions,
  summaryParagraph,
}: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Project Brief: {projectName}</h1>
        {customerName && (
          <p className="text-sm text-muted-foreground">Khách hàng: {customerName}</p>
        )}
      </div>

      {coreSections.map((section) => (
        <SectionCard key={section.title} section={section} />
      ))}

      {budgetSection && <SectionCard section={budgetSection} />}
      {scopeSection && <SectionCard section={scopeSection} />}

      {toConfirm.length > 0 && (
        <Card className="border-amber-300">
          <CardHeader>
            <CardTitle className="text-base">Các thông tin cần xác nhận</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {toConfirm.map((t) => (
              <Badge key={t.key} className="border-amber-300 bg-amber-50 text-amber-700">
                {t.label}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      {assumptions.length > 0 && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-base">Giả định của AI</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              {assumptions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Đánh giá sơ bộ</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{summaryParagraph}</p>
        </CardContent>
      </Card>
    </div>
  );
}

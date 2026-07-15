"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
  missingFields: { key: string; label: string }[];
  questions: string[];
  assumptions: string[];
}

export function MissingPanel({ missingFields, questions, assumptions }: Props) {
  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader className="border-b">
        <CardTitle className="text-sm">Thiếu / Câu hỏi</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-4 overflow-y-auto pt-4">
        <section>
          <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
            Thông tin còn thiếu
          </p>
          {missingFields.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Chưa phát hiện thông tin thiếu.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {missingFields.map((m) => (
                <Badge
                  key={m.key}
                  className="border-amber-300 bg-amber-50 text-amber-700"
                >
                  {m.label}
                </Badge>
              ))}
            </div>
          )}
        </section>

        <section>
          <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
            Câu hỏi tiếp theo
          </p>
          {questions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Chưa có câu hỏi nào.
            </p>
          ) : (
            <ol className="list-inside list-decimal space-y-1 text-sm">
              {questions.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ol>
          )}
        </section>

        <section>
          <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
            Giả định của AI
          </p>
          {assumptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Chưa có giả định nào.
            </p>
          ) : (
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              {assumptions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          )}
        </section>
      </CardContent>
    </Card>
  );
}

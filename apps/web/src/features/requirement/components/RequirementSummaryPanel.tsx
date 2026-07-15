"use client";

import type { Requirement } from "@acc/shared-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  scoreColorClass,
  scoreHint,
  toRequirementGroups,
} from "../requirement-view";

interface Props {
  requirement: Requirement;
  score: number;
}

export function RequirementSummaryPanel({ requirement, score }: Props) {
  const groups = toRequirementGroups(requirement);

  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader className="border-b">
        <CardTitle className="text-sm">Tóm tắt yêu cầu</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-4 overflow-y-auto pt-4">
        <p className={`text-xs ${scoreColorClass(score)}`}>{scoreHint(score)}</p>

        {groups.map((g) => (
          <div key={g.title}>
            <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
              {g.title}
            </p>
            <div className="space-y-1">
              {g.fields.map((f) => (
                <div key={f.label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{f.label}</span>
                  {f.value ? (
                    <span className="font-medium">{f.value} ✅</span>
                  ) : (
                    <span className="text-amber-600">Chưa rõ ⚠️</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

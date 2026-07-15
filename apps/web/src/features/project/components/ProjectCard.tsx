"use client";

import Link from "next/link";
import type { ProjectSummary } from "@acc/shared-types";
import { Card, CardContent } from "@/components/ui/card";
import {
  projectStatusLabel,
  scoreBarClass,
  scoreColorClass,
} from "@/features/requirement/requirement-view";

export function ProjectCard({ project }: { project: ProjectSummary }) {
  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="transition-colors hover:border-primary/50">
        <CardContent className="flex items-center justify-between py-4">
          <div>
            <p className="font-medium">{project.name}</p>
            <p className="text-xs text-muted-foreground">
              {project.customerName ?? "Chưa có tên khách"} ·{" "}
              {projectStatusLabel(project.status)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full ${scoreBarClass(project.score)}`}
                style={{ width: `${project.score}%` }}
              />
            </div>
            <span
              className={`text-sm font-semibold ${scoreColorClass(project.score)}`}
            >
              {project.score}%
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

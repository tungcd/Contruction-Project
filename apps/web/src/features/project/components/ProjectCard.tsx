"use client";

import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Popconfirm } from "antd";
import { Trash2 } from "lucide-react";
import type { ProjectSummary } from "@acc/shared-types";
import { projectService } from "@/services/project.service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  projectStatusLabel,
  scoreBarClass,
  scoreColorClass,
} from "@/features/requirement/requirement-view";

export function ProjectCard({ project }: { project: ProjectSummary }) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => projectService.remove(project.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });

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
            <Popconfirm
              title="Xoá dự án này?"
              description={`"${project.name}" và toàn bộ dữ liệu liên quan (hội thoại, requirement, dự toán) sẽ mất vĩnh viễn.`}
              okText="Xoá"
              cancelText="Huỷ"
              okButtonProps={{ danger: true }}
              styles={{ container: { maxWidth: 560 } }}
              onConfirm={() => deleteMutation.mutate()}
            >
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </Popconfirm>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

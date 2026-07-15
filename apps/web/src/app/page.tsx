"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Building2 } from "lucide-react";
import type { CreateProjectInput } from "@acc/shared-types";
import { projectService } from "@/services/project.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectCard } from "@/features/project/components/ProjectCard";
import { CreateProjectForm } from "@/features/project/components/CreateProjectForm";

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: projects, isLoading, isError, error } = useQuery({
    queryKey: ["projects"],
    queryFn: projectService.list,
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateProjectInput) => projectService.create(input),
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      router.push(`/projects/${project.id}`);
    },
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">AI Construction Copilot</h1>
        </div>
        <Button onClick={() => setShowForm((s) => !s)}>
          <Plus className="h-4 w-4" /> Tạo dự án mới
        </Button>
      </header>

      {showForm && (
        <CreateProjectForm
          onSubmit={(input) => createMutation.mutate(input)}
          onCancel={() => setShowForm(false)}
          isPending={createMutation.isPending}
          error={
            createMutation.isError
              ? (createMutation.error as Error).message
              : null
          }
        />
      )}

      <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
        Dự án gần đây
      </h2>

      {isLoading && <p className="text-sm text-muted-foreground">Đang tải...</p>}

      {isError && (
        <Card>
          <CardContent className="pt-4 text-sm text-muted-foreground">
            Không tải được danh sách dự án. Kiểm tra DATABASE_URL trong .env.
            <br />
            <span className="text-destructive">{(error as Error).message}</span>
          </CardContent>
        </Card>
      )}

      {projects && projects.length === 0 && (
        <Card>
          <CardContent className="space-y-3 py-10 text-center">
            <p className="text-muted-foreground">
              Chưa có dự án nào. Tạo dự án đầu tiên để bắt đầu khai thác yêu
              cầu khách hàng.
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" /> Tạo dự án mới
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {projects?.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>
    </main>
  );
}

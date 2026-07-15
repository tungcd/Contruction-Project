"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Building2 } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  projectStatusLabel,
  scoreBarClass,
  scoreColorClass,
} from "@/lib/requirement-view";

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [customerName, setCustomerName] = useState("");

  const { data: projects, isLoading, isError, error } = useQuery({
    queryKey: ["projects"],
    queryFn: api.listProjects,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.createProject({ name: name.trim(), customerName: customerName.trim() || undefined }),
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
        <Card className="mb-6">
          <CardContent className="space-y-3 pt-4">
            <input
              autoFocus
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Tên dự án (vd: Anh Hùng - Nhà phố Đan Phượng)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Tên khách hàng (tuỳ chọn)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                disabled={!name.trim() || createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                {createMutation.isPending ? "Đang tạo..." : "Tạo dự án"}
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>
                Huỷ
              </Button>
            </div>
            {createMutation.isError && (
              <p className="text-sm text-destructive">
                {(createMutation.error as Error).message}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
        Dự án gần đây
      </h2>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Đang tải...</p>
      )}

      {isError && (
        <Card>
          <CardContent className="pt-4 text-sm text-muted-foreground">
            Không kết nối được API. Kiểm tra backend đã chạy chưa (
            <code>npm run dev:api</code>) và DATABASE_URL trong .env.
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
          <Link key={p.id} href={`/projects/${p.id}`}>
            <Card className="transition-colors hover:border-primary/50">
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.customerName ?? "Chưa có tên khách"} ·{" "}
                    {projectStatusLabel(p.status)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full ${scoreBarClass(p.score)}`}
                      style={{ width: `${p.score}%` }}
                    />
                  </div>
                  <span className={`text-sm font-semibold ${scoreColorClass(p.score)}`}>
                    {p.score}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}

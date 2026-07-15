"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { projectService } from "@/services/project.service";
import { chatService } from "@/services/chat.service";
import { WorkspaceHeader } from "@/features/workspace/components/WorkspaceHeader";
import { MockModeBanner } from "@/features/workspace/components/MockModeBanner";
import { ConversationPanel } from "@/features/chat/components/ConversationPanel";
import { PromptBar } from "@/features/chat/components/PromptBar";
import { RequirementSummaryPanel } from "@/features/requirement/components/RequirementSummaryPanel";
import { MissingPanel } from "@/features/requirement/components/MissingPanel";

export default function WorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  // Giả định của AI là dữ liệu dẫn xuất, không lưu DB -> giữ ở state.
  const [assumptions, setAssumptions] = useState<string[]>([]);

  const { data: project, isLoading, isError, error } = useQuery({
    queryKey: ["project", id],
    queryFn: () => projectService.get(id),
    enabled: !!id,
  });

  const analyzeMutation = useMutation({
    mutationFn: (message: string) => chatService.analyze(id, message),
    onSuccess: (result) => {
      setAssumptions(result.assumptions);
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const renameMutation = useMutation({
    mutationFn: (name: string) => projectService.update(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  if (isLoading)
    return <p className="p-8 text-sm text-muted-foreground">Đang tải...</p>;

  if (isError || !project)
    return (
      <div className="p-8">
        <Link href="/" className="text-sm text-primary">
          &larr; Về Dashboard
        </Link>
        <p className="mt-4 text-sm text-destructive">
          {(error as Error)?.message ?? "Không tải được dự án"}
        </p>
      </div>
    );

  return (
    <div className="flex h-screen flex-col">
      <MockModeBanner />
      <WorkspaceHeader
        project={project}
        onRename={(name) => renameMutation.mutate(name)}
        isRenaming={renameMutation.isPending}
      />

      <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden p-4 lg:grid-cols-[1fr_1fr_1fr]">
        <ConversationPanel
          messages={project.conversation}
          isAnalyzing={analyzeMutation.isPending}
          error={
            analyzeMutation.isError
              ? (analyzeMutation.error as Error).message
              : null
          }
        />
        <RequirementSummaryPanel
          requirement={project.requirement}
          score={project.score}
        />
        <MissingPanel
          missingFields={project.missingFields}
          questions={project.questions}
          assumptions={assumptions}
        />
      </div>

      <PromptBar
        onSend={(message) => analyzeMutation.mutate(message)}
        disabled={analyzeMutation.isPending}
      />
    </div>
  );
}

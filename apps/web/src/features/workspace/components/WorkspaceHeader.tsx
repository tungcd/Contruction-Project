"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "antd";
import { ArrowLeft, Calculator, FileText, Pencil, Check, PenTool, Send, X } from "lucide-react";
import type { ProjectDetail } from "@acc/shared-types";
import { Button } from "@/components/ui/button";
import {
  projectStatusLabel,
  scoreBarClass,
  scoreColorClass,
} from "@/features/requirement/requirement-view";

interface Props {
  project: ProjectDetail;
  onRename: (name: string) => void;
  isRenaming: boolean;
}

export function WorkspaceHeader({ project, onRename, isRenaming }: Props) {
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  function submit() {
    const next = nameDraft.trim();
    if (!next || next === project.name) {
      setEditing(false);
      return;
    }
    onRename(next);
    setEditing(false);
  }

  return (
    <header className="flex items-center justify-between border-b bg-background px-4 py-3">
      <div className="flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          {editing ? (
            <div className="flex items-center gap-1">
              <Input
                autoFocus
                size="small"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submit();
                  if (e.key === "Escape") setEditing(false);
                }}
              />
              <Button size="icon" variant="ghost" onClick={submit} disabled={isRenaming}>
                <Check className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setEditing(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="group flex items-center gap-1">
              <h1 className="font-semibold leading-tight">{project.name}</h1>
              <button
                title="Đổi tên dự án"
                className="opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => {
                  setNameDraft(project.name);
                  setEditing(true);
                }}
              >
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            {project.customerName ?? "Chưa có tên khách"} ·{" "}
            {projectStatusLabel(project.status)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <span className={`text-lg font-bold ${scoreColorClass(project.score)}`}>
            {project.score}%
          </span>
          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full transition-all duration-500 ${scoreBarClass(project.score)}`}
              style={{ width: `${project.score}%` }}
            />
          </div>
        </div>
        <Link href={`/projects/${project.id}/design`}>
          <Button variant="outline">
            <PenTool className="h-4 w-4" /> Bản vẽ khái niệm
          </Button>
        </Link>
        <Link href={`/projects/${project.id}/estimate`}>
          <Button variant="outline">
            <Calculator className="h-4 w-4" /> Dự toán
          </Button>
        </Link>
        <Link href={`/projects/${project.id}/proposal`}>
          <Button variant="outline">
            <Send className="h-4 w-4" /> Báo giá đề xuất
          </Button>
        </Link>
        <Link href={`/projects/${project.id}/brief`}>
          <Button variant={project.readiness.brief.ready ? "default" : "outline"}>
            <FileText className="h-4 w-4" /> Tạo Project Brief
          </Button>
        </Link>
      </div>
    </header>
  );
}

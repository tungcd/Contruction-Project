import type { NextRequest } from "next/server";
import { UpdateProjectSchema } from "@acc/shared-types";
import { assertUuid, handle, ok } from "@/lib/http";
import {
  deleteProject,
  getProjectDetail,
  updateProject,
} from "@/features/project/project.repository";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const { id } = await params;
    return ok(await getProjectDetail(assertUuid(id)));
  });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const { id } = await params;
    const body = UpdateProjectSchema.parse(await req.json());
    return ok(await updateProject(assertUuid(id), body));
  });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const { id } = await params;
    return ok(await deleteProject(assertUuid(id)));
  });
}

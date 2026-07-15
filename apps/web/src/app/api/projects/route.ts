import type { NextRequest } from "next/server";
import { CreateProjectSchema } from "@acc/shared-types";
import { handle, ok } from "@/lib/http";
import {
  createProject,
  listProjects,
} from "@/features/project/project.repository";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => ok(await listProjects()));
}

export async function POST(req: NextRequest) {
  return handle(async () => {
    const body = CreateProjectSchema.parse(await req.json());
    return ok(await createProject(body));
  });
}

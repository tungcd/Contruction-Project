import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, Project, Requirement as RequirementRow } from "@prisma/client";
import {
  computeMissingFields,
  computeScore,
  CreateProjectInput,
  emptyRequirement,
  ProjectDetail,
  ProjectStatus,
  ProjectSummary,
  Requirement,
  RequirementSchema,
  UpdateProjectInput,
} from "@acc/shared-types";
import { PrismaService } from "../../prisma/prisma.service";

type ProjectWithRequirement = Project & { requirement: RequirementRow | null };

@Injectable()
export class ProjectService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateProjectInput): Promise<ProjectDetail> {
    const project = await this.prisma.project.create({
      data: {
        name: input.name,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        requirement: {
          create: {
            data: emptyRequirement() as unknown as Prisma.InputJsonValue,
          },
        },
        histories: { create: { event: "Project Created" } },
      },
      include: { requirement: true, conversations: true },
    });
    return this.toDetail(project, []);
  }

  async findAll(): Promise<ProjectSummary[]> {
    const projects = await this.prisma.project.findMany({
      include: { requirement: true },
      orderBy: { updatedAt: "desc" },
    });
    return projects.map((p) => this.toSummary(p));
  }

  async findOne(id: string): Promise<ProjectDetail> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        requirement: true,
        conversations: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!project) throw new NotFoundException("Không tìm thấy dự án");
    return this.toDetail(project, project.conversations);
  }

  async update(
    id: string,
    input: UpdateProjectInput,
  ): Promise<ProjectDetail> {
    await this.ensureExists(id);
    await this.prisma.project.update({ where: { id }, data: input });
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ id: string }> {
    await this.ensureExists(id);
    await this.prisma.project.delete({ where: { id } });
    return { id };
  }

  // --- helpers ---

  private async ensureExists(id: string): Promise<void> {
    const count = await this.prisma.project.count({ where: { id } });
    if (count === 0) throw new NotFoundException("Không tìm thấy dự án");
  }

  private parseRequirement(row: RequirementRow | null): Requirement {
    if (!row) return emptyRequirement();
    const parsed = RequirementSchema.safeParse(row.data);
    return parsed.success ? parsed.data : emptyRequirement();
  }

  private toSummary(p: ProjectWithRequirement): ProjectSummary {
    const requirement = this.parseRequirement(p.requirement);
    return {
      id: p.id,
      name: p.name,
      customerName: p.customerName,
      customerPhone: p.customerPhone,
      status: p.status as ProjectStatus,
      score: computeScore(requirement),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }

  private toDetail(
    p: ProjectWithRequirement,
    conversations: {
      id: string;
      role: string;
      message: string;
      createdAt: Date;
    }[],
  ): ProjectDetail {
    const requirement = this.parseRequirement(p.requirement);
    return {
      ...this.toSummary(p),
      requirement,
      missingFields: computeMissingFields(requirement),
      conversation: conversations.map((c) => ({
        id: c.id,
        role: c.role as ProjectDetail["conversation"][number]["role"],
        message: c.message,
        createdAt: c.createdAt.toISOString(),
      })),
    };
  }
}

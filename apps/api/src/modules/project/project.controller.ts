import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from "@nestjs/common";
import {
  CreateProjectInput,
  CreateProjectSchema,
  UpdateProjectInput,
  UpdateProjectSchema,
} from "@acc/shared-types";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { ProjectService } from "./project.service";

@Controller("projects")
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(CreateProjectSchema))
    body: CreateProjectInput,
  ) {
    return this.projectService.create(body);
  }

  @Get()
  findAll() {
    return this.projectService.findAll();
  }

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.projectService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UpdateProjectSchema))
    body: UpdateProjectInput,
  ) {
    return this.projectService.update(id, body);
  }

  @Delete(":id")
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.projectService.remove(id);
  }
}

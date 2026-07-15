import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from "@nestjs/common";
import { CreateMessageInput, CreateMessageSchema } from "@acc/shared-types";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { ConversationService } from "./conversation.service";

@Controller("projects/:projectId/messages")
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Get()
  findAll(@Param("projectId", ParseUUIDPipe) projectId: string) {
    return this.conversationService.findAll(projectId);
  }

  @Post()
  create(
    @Param("projectId", ParseUUIDPipe) projectId: string,
    @Body(new ZodValidationPipe(CreateMessageSchema))
    body: CreateMessageInput,
  ) {
    return this.conversationService.addUserMessage(projectId, body.message);
  }
}

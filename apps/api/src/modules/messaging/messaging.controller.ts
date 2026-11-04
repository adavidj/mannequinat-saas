import { Body, Controller, Delete, Get, Param, Post, Req } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Request } from 'express';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EmailVerifiedRequired } from '../../common/decorators/email-verified.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreateConversationDto,
  createConversationSchema,
  ReportConversationDto,
  reportConversationSchema,
  SendMessageDto,
  sendMessageSchema,
} from './dto/messaging.dto';
import { MessagingService } from './messaging.service';

type AuthenticatedUser = { id: string; role: UserRole };

@Controller('conversations')
@Roles(UserRole.MODELE, UserRole.AGENCE)
@EmailVerifiedRequired()
export class MessagingController {
  constructor(private readonly messaging: MessagingService) {}

  @Post()
  @Roles(UserRole.AGENCE)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createConversationSchema)) body: CreateConversationDto,
    @Req() request: Request,
  ) {
    return this.messaging.createConversation(user.id, body, this.auditContext(request));
  }

  @Get()
  async list(@CurrentUser() user: AuthenticatedUser) {
    return this.messaging.listConversations(user.id, user.role);
  }

  @Get(':conversationId/messages')
  async listMessages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId') conversationId: string,
  ) {
    return this.messaging.listMessages(user.id, user.role, conversationId);
  }

  @Post(':conversationId/messages')
  async sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId') conversationId: string,
    @Body(new ZodValidationPipe(sendMessageSchema)) body: SendMessageDto,
    @Req() request: Request,
  ) {
    return this.messaging.sendMessage(
      user.id,
      user.role,
      conversationId,
      body,
      this.auditContext(request),
    );
  }

  @Get('blocked')
  @Roles(UserRole.MODELE)
  async listBlocked(@CurrentUser() user: AuthenticatedUser) {
    return this.messaging.listBlockedOrganizations(user.id);
  }

  @Post(':conversationId/block')
  @Roles(UserRole.MODELE)
  async block(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId') conversationId: string,
    @Req() request: Request,
  ) {
    await this.messaging.blockOrganization(user.id, conversationId, this.auditContext(request));
    return { message: 'Organisation bloquée.' };
  }

  @Delete(':conversationId/block')
  @Roles(UserRole.MODELE)
  async unblock(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId') conversationId: string,
    @Req() request: Request,
  ) {
    await this.messaging.unblockOrganization(user.id, conversationId, this.auditContext(request));
    return { message: 'Organisation débloquée.' };
  }

  @Post(':conversationId/report')
  async report(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId') conversationId: string,
    @Body(new ZodValidationPipe(reportConversationSchema)) body: ReportConversationDto,
    @Req() request: Request,
  ) {
    return this.messaging.reportConversation(
      user.id,
      user.role,
      conversationId,
      body,
      this.auditContext(request),
    );
  }

  private auditContext(request: Request): { ipAddress: string | null; userAgent: string | null } {
    return { ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null };
  }
}

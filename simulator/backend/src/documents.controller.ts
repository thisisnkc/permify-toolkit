import {
  Controller,
  Get,
  Param,
  UseGuards,
  type ExecutionContext,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  PermifyGuard,
  CheckPermission,
  PermifyResolvers,
} from '@permify-toolkit/nestjs';

@Controller('documents')
export class DocumentsController {
  @UseGuards(PermifyGuard)
  @CheckPermission('document.view')
  @PermifyResolvers({
    resource: (ctx: ExecutionContext) => {
      const req = ctx.switchToHttp().getRequest<Request>();
      const id = req.params.id as string;
      return { type: 'document', id };
    },
    subject: (ctx: ExecutionContext) => {
      const req = ctx.switchToHttp().getRequest<Request>();
      const userId = (req.headers['x-user-id'] as string) || 'user-1';
      return { type: 'user', id: userId };
    },
  })
  @Get(':id')
  view(@Param('id') id: string) {
    return {
      id,
      content: `Content of document ${id}`,
      access: 'granted',
    };
  }
}

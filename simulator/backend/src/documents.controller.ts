import {
  Controller,
  Get,
  Param,
  UseGuards,
  type ExecutionContext,
} from '@nestjs/common';
import type { Request } from 'express';
import { PermifyGuard, PermifyResolvers } from '@permify-toolkit/nestjs';
import { CheckPermission, PermissionResult } from './auth.js';

@Controller('documents')
export class DocumentsController {
  @UseGuards(PermifyGuard)
  /**
   * CheckPermission and PermissionResult here are the schema-typed
   * variants from auth.ts — any name not defined in the schema is a
   * compile error. OR mode: viewers get in, and editors are told apart
   * without a second Permify call.
   */
  @CheckPermission(['document.view', 'document.edit'], { mode: 'OR' })
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
  view(
    @Param('id') id: string,
    @PermissionResult('document.edit') canEdit: boolean,
  ) {
    /**
     * The guard checked both permissions; the decorator injects the
     * edit outcome as a boolean.
     */
    return {
      id,
      content: `Content of document ${id}`,
      access: 'granted',
      canEdit,
    };
  }
}

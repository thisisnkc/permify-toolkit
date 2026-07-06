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
  PermifyResolvers,
  PermissionResult,
  type PermissionCheckResult,
} from '@permify-toolkit/nestjs';
import { CheckPermission } from './auth.js';

@Controller('documents')
export class DocumentsController {
  @UseGuards(PermifyGuard)
  /**
   * CheckPermission here is the schema-typed variant from auth.ts —
   * any name not defined in the schema is a compile error.
   * OR mode: viewers get in, and the handler inspects the individual
   * results to tell editors apart without a second Permify call.
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
    @PermissionResult() results: PermissionCheckResult[],
  ) {
    /**
     * The guard already checked both permissions; @PermissionResult()
     * injects those outcomes so we can shape the response per ability.
     * Result entries carry the bare action name ('edit'), the guard
     * strips the 'document.' prefix before checking.
     */
    const canEdit = results.some((r) => r.permission === 'edit' && r.allowed);
    return {
      id,
      content: `Content of document ${id}`,
      access: 'granted',
      canEdit,
    };
  }
}

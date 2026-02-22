import { Module, type ExecutionContext } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller.js';

import type { Request } from 'express';
import { DocumentsController } from './documents.controller.js';
import { AppService } from './app.service.js';

import { PermifyModule } from '@permify-toolkit/nestjs';

@Module({
  imports: [
    PermifyModule.forRoot({
      configFile: true,
      resolvers: {
        tenant: (ctx: ExecutionContext) => {
          const req = ctx.switchToHttp().getRequest<Request>();
          const tenantId = req.headers['x-tenant-id'] as string;
          if (!tenantId) throw new Error('Missing x-tenant-id header');
          return tenantId;
        },
      },
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), '..', 'frontend'),
    }),
  ],
  controllers: [AppController, DocumentsController],
  providers: [AppService],
})
export class AppModule {}

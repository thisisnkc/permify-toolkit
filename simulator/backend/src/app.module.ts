import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller.js';

import { DocumentsController } from './documents.controller.js';
import { AppService } from './app.service.js';

import { PermifyModule } from '@permify-toolkit/nestjs';
import { clientOptionsFromEnv } from '@permify-toolkit/core';

@Module({
  imports: [
    PermifyModule.forRoot({
      client: clientOptionsFromEnv(),
      resolvers: {
        tenant: () => 'tenant-1',
        subject: () => 'user-1',
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

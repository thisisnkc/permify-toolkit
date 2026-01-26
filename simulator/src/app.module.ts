import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

import { PermifyModule } from '@permify-toolkit/nestjs';

@Module({
  imports: [
    PermifyModule.forRoot({
      client: {
        endpoint: 'localhost:3476',
      },
      tenantResolver: () => 'tenant-1',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Permify Toolkit Simulator API is running successfully.';
  }
}

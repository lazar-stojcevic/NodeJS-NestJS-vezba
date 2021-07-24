import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello(): string {
    return 'Hello World bre';
  }

  @Get('world')
  getWorld(): string {
    return 'WORLD';
  }
}

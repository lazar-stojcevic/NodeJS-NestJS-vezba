import { Controller, Get } from '@nestjs/common';
import { Administrator } from 'src/entities/administrator.entity';
import { AdministratorService } from '../services/administrator/administrator.service';

@Controller()
export class AppController {
  constructor(private administratorService: AdministratorService){}

  @Get()
  getHello(): string {
    return 'Home page';
  }
}

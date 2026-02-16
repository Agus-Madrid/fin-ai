import { Controller, Get } from '@nestjs/common';
import { BudgetsService } from './budgets.service';

@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get('overview')
  getOverview() {
    return this.budgetsService.getOverview();
  }
}

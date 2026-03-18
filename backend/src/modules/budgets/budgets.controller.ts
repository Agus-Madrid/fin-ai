import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { BudgetsService } from './budgets.service';

@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get('overview')
  getOverview(@CurrentUser() user: AuthenticatedUser) {
    return this.budgetsService.getOverview(user.userId);
  }

  @Get('planner')
  getPlanner(@CurrentUser() user: AuthenticatedUser) {
    return this.budgetsService.getPlannerViewModel(user.userId);
  }

  @Get('monthly-summaries')
  getMonthlySummaries(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? Number(limit) : undefined;
    return this.budgetsService.listMonthlySummaries(user.userId, parsedLimit);
  }

  @Get('monthly-summaries/:period')
  getMonthlySummaryForPeriod(
    @CurrentUser() user: AuthenticatedUser,
    @Param('period') period: string,
  ) {
    return this.budgetsService.getMonthlySummaryForPeriod(user.userId, period);
  }

  @Post('monthly-summaries/:period/close')
  closeMonthlySummary(
    @CurrentUser() user: AuthenticatedUser,
    @Param('period') period: string,
  ) {
    return this.budgetsService.closeMonthlySummary(user.userId, period);
  }
}

import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ConfirmSavingsLogDto } from './dtos/confirm-savings-log.dto';
import { SavingsLogsService } from './savings-logs.service';

@Controller('savings-logs')
export class SavingsLogsController {
  constructor(private readonly savingsLogsService: SavingsLogsService) {}

  @Get()
  getAllByUser(
    @CurrentUser() user: AuthenticatedUser,
    @Query('period') period?: string,
  ) {
    return this.savingsLogsService.findAllByUser(user.userId, period);
  }

  @Post('confirm')
  confirm(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ConfirmSavingsLogDto,
  ) {
    return this.savingsLogsService.confirm(user.userId, dto);
  }
}

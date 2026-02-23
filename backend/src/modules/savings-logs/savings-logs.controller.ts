import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ConfirmSavingsLogDto } from './dtos/confirm-savings-log.dto';
import { SavingsLogsService } from './savings-logs.service';

@Controller('savings-logs')
export class SavingsLogsController {
  constructor(private readonly savingsLogsService: SavingsLogsService) {}

  @Get('user/:userId')
  getAllByUser(
    @Param('userId') userId: string,
    @Query('period') period?: string,
  ) {
    return this.savingsLogsService.findAllByUser(userId, period);
  }

  @Post('confirm')
  confirm(@Body() dto: ConfirmSavingsLogDto) {
    return this.savingsLogsService.confirm(dto);
  }
}

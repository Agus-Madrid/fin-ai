import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { UpdateMonthlyGoalSavingsDto } from './dtos/update-monthly-goal-savings.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @Put(':id/monthly-goal-savings')
  updateMonthlyGoalSavings(
    @Param('id') id: string,
    @Body() dto: UpdateMonthlyGoalSavingsDto,
  ) {
    return this.userService.updateMonthlyGoalSavings(id, dto.goalMonthlySavings);
  }
}

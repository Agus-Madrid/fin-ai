import { Body, Controller, Get, Put } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { UpdateMonthlyGoalSavingsDto } from './dtos/update-monthly-goal-savings.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  findCurrentUser(@CurrentUser() user: AuthenticatedUser) {
    return this.userService.findPublicById(user.userId);
  }

  @Put('me/monthly-goal-savings')
  updateMonthlyGoalSavings(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateMonthlyGoalSavingsDto,
  ) {
    return this.userService.updatePublicMonthlyGoalSavings(
      user.userId,
      dto.goalMonthlySavings,
    );
  }
}

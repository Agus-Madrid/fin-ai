import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateSavingGoalDto } from './dtos/create-saving-goal.dto';
import { UpdateSavingGoalDto } from './dtos/update-saving-goal.dto';
import { SavingGoalService } from './saving-goal.service';

@Controller('savings-goals')
export class SavingGoalController {
  constructor(private readonly savingGoalService: SavingGoalService) {}

  @Get()
  getAllByUser(
    @CurrentUser() user: AuthenticatedUser,
    @Query('activeOnly') activeOnly?: string,
  ) {
    const shouldFilterActive = activeOnly === 'true' || activeOnly === '1';

    return this.savingGoalService.findAllByUser(
      user.userId,
      shouldFilterActive,
    );
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createDto: CreateSavingGoalDto,
  ) {
    return this.savingGoalService.create(user.userId, createDto);
  }

  @Put(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateDto: UpdateSavingGoalDto,
  ) {
    return this.savingGoalService.update(user.userId, id, updateDto);
  }

  @Delete(':id')
  delete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.savingGoalService.delete(user.userId, id);
  }
}

import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { CreateSavingGoalDto } from './dtos/create-saving-goal.dto';
import { UpdateSavingGoalDto } from './dtos/update-saving-goal.dto';
import { SavingGoalService } from './saving-goal.service';

@Controller('savings-goals')
export class SavingGoalController {
  constructor(private readonly savingGoalService: SavingGoalService) {}

  @Get('user/:userId')
  getAllByUser(
    @Param('userId') userId: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    const shouldFilterActive =
      activeOnly === 'true' || activeOnly === '1';

    return this.savingGoalService.findAllByUser(userId, shouldFilterActive);
  }

  @Post()
  create(@Body() createDto: CreateSavingGoalDto) {
    return this.savingGoalService.create(createDto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateSavingGoalDto) {
    return this.savingGoalService.update(id, updateDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.savingGoalService.delete(id);
  }
}

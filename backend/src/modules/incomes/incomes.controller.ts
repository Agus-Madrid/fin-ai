import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { IncomesService } from './incomes.service';
import { CreateIncomeDto } from './dtos/create-income.dto';
import { UpdateIncomeDto } from './dtos/update-income.dto';

@Controller('incomes')
export class IncomesController {
  constructor(private readonly incomesService: IncomesService) {}

  @Get('user/:userId')
  getAllByUser(@Param('userId') userId: string) {
    return this.incomesService.findAllByUser(userId);
  }
  
  @Post()
  create(@Body() createIncomeDto: CreateIncomeDto) {
    return this.incomesService.create(createIncomeDto);
  }

  @Put(':id')
  update(@Body() updateData: UpdateIncomeDto, @Param('id') id: string) {
    return this.incomesService.update(id, updateData);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.incomesService.delete(id);
  }
}

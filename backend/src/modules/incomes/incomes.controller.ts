import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IncomesService } from './incomes.service';
import { CreateIncomeDto } from './dtos/create-income.dto';
import { UpdateIncomeDto } from './dtos/update-income.dto';

@Controller('incomes')
export class IncomesController {
  constructor(private readonly incomesService: IncomesService) {}

  @Get()
  getAllByUser(@CurrentUser() user: AuthenticatedUser) {
    return this.incomesService.findAllByUser(user.userId);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createIncomeDto: CreateIncomeDto,
  ) {
    return this.incomesService.create(user.userId, createIncomeDto);
  }

  @Put(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateData: UpdateIncomeDto,
    @Param('id') id: string,
  ) {
    return this.incomesService.update(user.userId, id, updateData);
  }

  @Delete(':id')
  delete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.incomesService.delete(user.userId, id);
  }
}

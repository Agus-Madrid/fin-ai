import { Body, Controller, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dtos/create-transaction.dto';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  getAll() {
    return this.transactionsService.findAll();
  }

  @Get('user/:userId')
  getAllByUser(@Param('userId') userId: string) {
    return this.transactionsService.findAllByUser(userId);
  }

  @Post()
  create(@Body() CreateTransactionDto: CreateTransactionDto) {
    return this.transactionsService.create(CreateTransactionDto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) transactionId: number, @Body() updateTransactionDto: CreateTransactionDto){
    return this.transactionsService.update(transactionId, updateTransactionDto);
  }
}

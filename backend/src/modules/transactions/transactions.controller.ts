import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dtos/create-transaction.dto';
import { TransactionStatus } from './transaction.enum';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  getAll() {
    return this.transactionsService.findAll();
  }

  @Get('user/:userId')
  getAllByUser(
    @Param('userId') userId: string,
    @Query('status') status?: string,
  ) {
    if (status === undefined) {
      return this.transactionsService.findAllByUser(userId);
    }

    const parsedStatus = Number.parseInt(status, 10);
    if (Number.isNaN(parsedStatus)) {
      throw new BadRequestException('status must be a numeric enum value');
    }

    return this.transactionsService.findAllByUserStatus(
      userId,
      parsedStatus as TransactionStatus,
    );
  }

  @Get('user/:userId/latest')
  getLatestByUser(
    @Param('userId') userId: string,
    @Query('limit') limit: number = 5,
  ) {
    return this.transactionsService.findLatestByUser(userId, limit);
  }

  @Post()
  create(@Body() CreateTransactionDto: CreateTransactionDto) {
    return this.transactionsService.create(CreateTransactionDto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) transactionId: number,
    @Body() updateTransactionDto: CreateTransactionDto,
  ) {
    return this.transactionsService.update(transactionId, updateTransactionDto);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) transactionId: number) {
    return this.transactionsService.delete(transactionId);
  }
}

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Param,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dtos/create-transaction.dto';
import { TransactionStatus } from './transaction.enum';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  getAllByUser(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: string,
  ) {
    if (status === undefined) {
      return this.transactionsService.findAllByUser(user.userId);
    }

    const parsedStatus = Number.parseInt(status, 10);
    if (Number.isNaN(parsedStatus)) {
      throw new BadRequestException('status must be a numeric enum value');
    }

    return this.transactionsService.findAllByUserStatus(
      user.userId,
      parsedStatus as TransactionStatus,
    );
  }

  @Get('latest')
  getLatestByUser(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit === undefined ? 5 : Number.parseInt(limit, 10);
    if (!Number.isInteger(parsedLimit) || parsedLimit <= 0) {
      throw new BadRequestException('limit must be a positive integer');
    }

    return this.transactionsService.findLatestByUser(user.userId, parsedLimit);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createTransactionDto: CreateTransactionDto,
  ) {
    return this.transactionsService.create(user.userId, createTransactionDto);
  }

  @Put(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) transactionId: number,
    @Body() updateTransactionDto: CreateTransactionDto,
  ) {
    return this.transactionsService.update(
      user.userId,
      transactionId,
      updateTransactionDto,
    );
  }

  @Delete(':id')
  delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) transactionId: number,
  ) {
    return this.transactionsService.delete(user.userId, transactionId);
  }
}


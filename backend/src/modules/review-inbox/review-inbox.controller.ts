import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Body,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ReviewInboxService } from './review-inbox.service';
import { ReviewTransactionDto } from './dtos/review-transaction.dto';

@Controller('review-inbox')
export class ReviewInboxController {
  constructor(private readonly reviewInboxService: ReviewInboxService) {}

  @Get()
  listPending(@CurrentUser() user: AuthenticatedUser) {
    return this.reviewInboxService.listPending(user.userId);
  }

  @Put(':id/confirm')
  async confirmTransaction(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTransactionDto: ReviewTransactionDto,
  ) {
    return this.reviewInboxService.confirmTransaction(
      user.userId,
      id,
      updateTransactionDto,
    );
  }

  @Put('confirm-many')
  async confirmMany(
    @CurrentUser() user: AuthenticatedUser,
    @Body() ids: number[],
  ) {
    return this.reviewInboxService.confirmMany(user.userId, ids);
  }
}

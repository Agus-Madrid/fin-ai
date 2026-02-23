import { Controller, Get, Param, ParseIntPipe, Put, Body } from '@nestjs/common';
import { ReviewInboxService } from './review-inbox.service';
import { ReviewTransactionDto } from './dtos/review-transaction.dto';

@Controller('review-inbox')
export class ReviewInboxController {
  constructor(private readonly reviewInboxService: ReviewInboxService) {}

  @Get()
  listPending() {
    return this.reviewInboxService.listPending();
  }

  @Put(':id/confirm')
  async confirmTransaction(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTransactionDto: ReviewTransactionDto,
  ) {
    return this.reviewInboxService.confirmTransaction(id, updateTransactionDto);
  }
}

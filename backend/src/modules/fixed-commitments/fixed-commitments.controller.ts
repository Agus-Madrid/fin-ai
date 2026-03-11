import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FixedCommitmentsService } from './fixed-commitments.service';
import { CreateFixedCommitmentDto } from './dtos/create-fixed-commitment.dto';

@Controller('fixed-commitments')
export class FixedCommitmentsController {

    constructor(private readonly fixedCommitmentsService: FixedCommitmentsService) {}

    @Get()
    async getByUserId(@CurrentUser() user: AuthenticatedUser) {
        return await this.fixedCommitmentsService.findAllByUser(user.userId);
    }

    @Post()
    async create(
      @CurrentUser() user: AuthenticatedUser,
      @Body() createFixedCommitmentDto: CreateFixedCommitmentDto,
    ) {
        return await this.fixedCommitmentsService.create(
          user.userId,
          createFixedCommitmentDto,
        );
    }

    @Put(':id')
    async update(
      @CurrentUser() user: AuthenticatedUser,
      @Param('id') id: string,
      @Body() updateData: Partial<CreateFixedCommitmentDto>,
    ) {
        return await this.fixedCommitmentsService.update(user.userId, id, updateData);
    }

    @Delete(':id')
    async delete(
      @CurrentUser() user: AuthenticatedUser,
      @Param('id') id: string,
    ) {
        return await this.fixedCommitmentsService.delete(user.userId, id);
    }
}


import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { FixedCommitmentsService } from './fixed-commitments.service';
import { CreateFixedCommitmentDto } from './dtos/create-fixed-commitment.dto';

@Controller('fixed-commitments')
export class FixedCommitmentsController {

    constructor(private readonly fixedCommitmentsService: FixedCommitmentsService) {}

    @Get('user/:userId')
    async getByUserId(@Param('userId') userId: string) {
        return await this.fixedCommitmentsService.findAllByUser(userId);
    }

    @Post()
    async create(@Body() createFixedCommitmentDto: CreateFixedCommitmentDto) {
        return await this.fixedCommitmentsService.create(createFixedCommitmentDto);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() updateData: Partial<CreateFixedCommitmentDto>) {
        return await this.fixedCommitmentsService.update(id, updateData);
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        return await this.fixedCommitmentsService.delete(id);
    }
}

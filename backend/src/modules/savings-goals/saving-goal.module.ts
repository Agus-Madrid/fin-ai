import { Module } from '@nestjs/common';
import { CategoryController } from '../categories/category.controller';
import { CategoryService } from './saving-goal.service';

@Module({
  imports: [],
  controllers: [CategoryController],
  providers: [CategoryService],
})
export class CategoryModule {}

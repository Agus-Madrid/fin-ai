import { Controller, Get, Param } from '@nestjs/common';
import { CategoryService } from './category.service';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  async findAll() {
    return await this.categoryService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return await this.categoryService.findById(id);
  }

  @Get('user/:id')
  async findByUserId(@Param('id') id: string) {
    return await this.categoryService.findByUserId(id);
  }
}

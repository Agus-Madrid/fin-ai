import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './category.entity';
import { Repository } from 'typeorm';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { UserService } from '../user/user.service';
import { UpdateCategoryDto } from './dtos/update-category.dto';

const CATEGORY_RELATIONS = ['user', 'transactions'] as const;
const DEFAULT_CATEGORY_ICON = '💵';
const DEFAULT_CATEGORY_COLOR = '#000000';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly userService: UserService,
  ) {}

  async findAll(): Promise<Category[]> {
    return await this.categoryRepository.find({
      relations: [...CATEGORY_RELATIONS],
    });
  }

  async findById(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: [...CATEGORY_RELATIONS],
    });
    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }
    return category;
  }

  async findByUserId(userId: string): Promise<Category[]> {
    return await this.categoryRepository.find({
      where: { userId },
      relations: [...CATEGORY_RELATIONS],
    });
  }

  async create(categoryData: CreateCategoryDto): Promise<Category> {
    const name = this.normalizeName(categoryData.name);
    const user = await this.userService.findById(categoryData.userId);

    const category = this.categoryRepository.create({
      name,
      icon: this.normalizeIcon(categoryData.icon),
      color: this.normalizeColor(categoryData.color),
      user,
      userId: user.id,
    });

    return await this.categoryRepository.save(category);
  }

  async update(id: string, updateData: UpdateCategoryDto): Promise<Category> {
    const category = await this.findById(id);

    if (updateData.name !== undefined) {
      category.name = this.normalizeName(updateData.name);
    }

    if (updateData.icon !== undefined) {
      category.icon = this.normalizeIcon(updateData.icon, true);
    }

    if (updateData.color !== undefined) {
      category.color = this.normalizeColor(updateData.color, true);
    }

    return await this.categoryRepository.save(category);
  }

  private normalizeName(name: string): string {
    const normalizedName = name?.trim();
    if (!normalizedName) {
      throw new BadRequestException('Category name is required');
    }

    return normalizedName;
  }

  private normalizeIcon(icon?: string, required = false): string {
    const normalizedIcon = icon?.trim();
    if (!normalizedIcon && required) {
      throw new BadRequestException('Category icon is required');
    }

    return normalizedIcon || DEFAULT_CATEGORY_ICON;
  }

  private normalizeColor(color?: string, required = false): string {
    const normalizedColor = color?.trim();
    if (!normalizedColor) {
      if (required) {
        throw new BadRequestException('Category color is required');
      }

      return DEFAULT_CATEGORY_COLOR;
    }

    return normalizedColor;
  }
}

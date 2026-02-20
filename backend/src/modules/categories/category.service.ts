import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './category.entity';
import { Repository } from 'typeorm';

const CATEGORY_RELATIONS = ['user', 'transactions'] as const;

@Injectable()
export class CategoryService {
    constructor(
        @InjectRepository(Category)
        private readonly categoryRepository: Repository<Category>
    ) {}

    async findAll(): Promise<Category[]> {
        return await this.categoryRepository.find({
            relations: [...CATEGORY_RELATIONS],
        });
    }

    async findById(id:string): Promise<Category> {
        const category = await this.categoryRepository.findOne({
            where: { id },
            relations: [...CATEGORY_RELATIONS],
        });
        if(!category){
            throw new NotFoundException(`Category with id ${id} not found`);
        }
        return category;
    }

    async findByUserId(userId: string): Promise<Category[]> {
        const user = await this.categoryRepository.find({
            where: { userId },
            relations: [...CATEGORY_RELATIONS],
        });
        if(!user){
            throw new NotFoundException(`User with id ${userId} not found`);
        }
        
        const categories = await this.categoryRepository.find({
            where: { userId },
            relations: [...CATEGORY_RELATIONS],
        });
        return categories;
    }

}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './category.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CategoryService {
    constructor(
        @InjectRepository(Category)
        private readonly categoryRepository: Repository<Category>
    ) {}

    async findAll(): Promise<Category[]> {
        return await this.categoryRepository.find();
    }

    async findById(id:string): Promise<Category> {
        const category = await this.categoryRepository.findOne({where: {id}});
        if(!category){
            throw new NotFoundException(`Category with id ${id} not found`);
        }
        return category;
    }

    async findByUserId(userId: string): Promise<Category[]> {
        const user = await this.categoryRepository.find({where: {userId}});
        if(!user){
            throw new NotFoundException(`User with id ${userId} not found`);
        }
        
        const categories = await this.categoryRepository.find({where: {userId}});
        return categories;
    }

}

export interface CreateCategoryRequest {
  name: string;
  icon?: string;
  color?: string;
}

export interface CreateCategoryDto extends CreateCategoryRequest {
  userId: string;
}

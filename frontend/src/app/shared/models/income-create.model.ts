export interface CreateIncomeRequest {
  name: string;
  description?: string;
  amount: number;
}

export interface CreateIncomeDto extends CreateIncomeRequest {
  userId: string;
}

export interface UpdateIncomeRequest {
  name?: string;
  description?: string;
  amount?: number;
}

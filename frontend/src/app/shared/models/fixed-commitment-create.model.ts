export interface CreateFixedCommitmentRequest {
  name: string;
  description?: string;
  amount: number;
}

export interface CreateFixedCommitmentDto extends CreateFixedCommitmentRequest {
  userId: string;
}

export interface UpdateFixedCommitmentRequest {
  name?: string;
  description?: string;
  amount?: number;
}

export interface CreateFixedCommitmentRequest {
  name: string;
  description?: string;
  amount: number;
}

export interface UpdateFixedCommitmentRequest {
  name?: string;
  description?: string;
  amount?: number;
}

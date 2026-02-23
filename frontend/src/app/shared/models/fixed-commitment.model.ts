import { User } from "./user.model";

export interface FixedCommitment {
  id: string;
  name: string;
  description?: string;
  amount: number;
  user?: User;
}
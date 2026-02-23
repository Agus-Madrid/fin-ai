import { User } from "./user.model";

export interface Income {
  id: string;
  name: string;
  description?: string;
  amount: number;
  user?: User;
}

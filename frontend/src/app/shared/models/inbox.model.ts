import { Category } from "./category.model";

export type InboxConfidence = 'low' | 'medium' | 'high';

export interface InboxItem {
  id: string;
  categoryId?: string;
  merchant: string;
  category: string;
  categoryIcon: string;
  dateLabel: string;
  dateValue: string;
  amount: number;
  amountValue: string;
  currency: string;
  status: string;
  confidence: InboxConfidence;
  suggested?: boolean;
  tag?: string;
}

export interface InboxState {
  pendingCount: number;
  items: InboxItem[];
  selectedItem: InboxItem;
  categoryOptions: Category[];
}
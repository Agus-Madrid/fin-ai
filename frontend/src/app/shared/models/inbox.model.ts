export type InboxConfidence = 'low' | 'medium' | 'high';

export interface InboxItem {
  id: string;
  merchant: string;
  category: string;
  dateLabel: string;
  dateValue: string;
  amount: number;
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
  categoryOptions: string[];
}

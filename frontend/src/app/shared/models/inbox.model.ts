export type InboxConfidence = 'low' | 'medium' | 'high';

export interface InboxItem {
  id: string;
  merchant: string;
  category: string;
  dateLabel: string;
  amount: number;
  currency: string;
  status: string;
  confidence: InboxConfidence;
  suggested?: boolean;
  tag?: string;
}

export interface InboxVm {
  pendingCount: number;
  items: InboxItem[];
  selectedItem: InboxItem;
}

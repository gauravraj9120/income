export type UserRole = 'owner' | 'receptionist' | 'admin';

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  paymentMethod: string;
  notes?: string;
  memberName?: string; // Client/Member name for gym income
  payee?: string; // Vendor/Payee name for expenses
  addedBy: UserRole;
  timestamp: string;
}

export interface CategoryConfig {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
}

export interface DailySummary {
  date: string;
  income: number;
  expense: number;
}

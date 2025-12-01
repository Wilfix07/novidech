// Shared types for the application

export type TransactionType = 
  | 'contribution' 
  | 'loan' 
  | 'payment' 
  | 'withdrawal' 
  | 'interest' 
  | 'expense';

export interface Transaction {
  id: string;
  member_id: string;
  type: TransactionType;
  amount: number;
  description: string | null;
  transaction_date: string;
  created_at: string;
  created_by: string | null;
}

export interface Member {
  id: string;
  profile_id: string;
  member_id: string;
  full_name: string;
  phone: string | null;
  address: string | null;
  join_date: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface Loan {
  id: string;
  member_id: string;
  amount: number;
  interest_rate: number;
  status: 'pending' | 'approved' | 'active' | 'paid' | 'defaulted';
  payment_frequency: 'weekly' | 'biweekly' | 'monthly';
  duration_days: number | null;
  number_of_payments: number | null;
  due_date: string | null;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Contribution {
  id: string;
  member_id: string;
  amount: number;
  contribution_date: string;
  period: string | null;
  payment_frequency: 'weekly' | 'biweekly' | 'monthly';
  notes: string | null;
  created_at: string;
  created_by: string | null;
}

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: 'member' | 'admin' | 'treasurer' | 'teller';
  created_at: string;
  updated_at: string;
}

export interface LoanConfig {
  id: string;
  interest_rate: number;
  default_duration_days: number;
  payment_frequency: 'weekly' | 'biweekly' | 'monthly';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}


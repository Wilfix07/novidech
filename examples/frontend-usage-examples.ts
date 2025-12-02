/**
 * Exemples d'utilisation Supabase Client pour l'application Mutuelle
 * Next.js 14 + TypeScript + React
 */

import { supabase } from '@/lib/supabase';
import type { 
  Member, 
  Transaction, 
  Loan, 
  Contribution,
  Profile 
} from '@/types';

// ============================================
// 1. MEMBRES (MEMBERS) - CRUD
// ============================================

/**
 * CREATE - Créer un nouveau membre
 */
export async function createMember(memberData: {
  profile_id: string;
  full_name: string;
  phone?: string;
  address?: string;
  currency?: 'USD' | 'HTG';
}) {
  const { data, error } = await supabase
    .from('members')
    .insert({
      ...memberData,
      member_id: await generateMemberId(memberData.currency || 'HTG'),
      status: 'active',
    })
    .select()
    .single();

  if (error) throw error;
  return data as Member;
}

/**
 * READ - Lire tous les membres (admin seulement)
 */
export async function getAllMembers() {
  const { data, error } = await supabase
    .from('members')
    .select('*, profiles:profile_id(*)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as (Member & { profiles: Profile })[];
}

/**
 * READ - Lire mon propre membre
 */
export async function getMyMember() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('profile_id', user.id)
    .single();

  if (error) throw error;
  return data as Member;
}

/**
 * READ - Lire un membre par ID
 */
export async function getMemberById(memberId: string) {
  const { data, error } = await supabase
    .from('members')
    .select('*, profiles:profile_id(*)')
    .eq('id', memberId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * UPDATE - Mettre à jour un membre
 */
export async function updateMember(
  memberId: string, 
  updates: {
    full_name?: string;
    phone?: string;
    address?: string;
    status?: 'active' | 'inactive' | 'suspended';
  }
) {
  const { data, error } = await supabase
    .from('members')
    .update(updates)
    .eq('id', memberId)
    .select()
    .single();

  if (error) throw error;
  return data as Member;
}

/**
 * DELETE - Supprimer un membre
 */
export async function deleteMember(memberId: string) {
  const { error } = await supabase
    .from('members')
    .delete()
    .eq('id', memberId);

  if (error) throw error;
}

// ============================================
// 2. TRANSACTIONS - CRUD
// ============================================

/**
 * CREATE - Créer une transaction
 */
export async function createTransaction(transactionData: {
  member_id?: string | null;
  type: 'contribution' | 'loan' | 'payment' | 'withdrawal' | 'interest' | 'expense';
  amount: number;
  description?: string;
  transaction_date?: string;
  expense_category_id?: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      ...transactionData,
      created_by: user?.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Transaction;
}

/**
 * READ - Lire toutes les transactions d'un membre
 */
export async function getMemberTransactions(memberId: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, expense_categories(*)')
    .eq('member_id', memberId)
    .order('transaction_date', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * READ - Lire mes propres transactions
 */
export async function getMyTransactions() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: member } = await supabase
    .from('members')
    .select('id')
    .eq('profile_id', user.id)
    .single();

  if (!member) return [];

  const { data, error } = await supabase
    .from('transactions')
    .select('*, expense_categories(*)')
    .eq('member_id', member.id)
    .order('transaction_date', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * READ - Transactions avec pagination et filtres
 */
export async function getTransactionsPaginated(options: {
  page?: number;
  pageSize?: number;
  type?: string;
  memberId?: string;
  startDate?: string;
  endDate?: string;
}) {
  const { page = 1, pageSize = 20 } = options;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('transactions')
    .select('*, members(*), expense_categories(*)', { count: 'exact' })
    .order('transaction_date', { ascending: false })
    .range(from, to);

  if (options.type) {
    query = query.eq('type', options.type);
  }

  if (options.memberId) {
    query = query.eq('member_id', options.memberId);
  }

  if (options.startDate) {
    query = query.gte('transaction_date', options.startDate);
  }

  if (options.endDate) {
    query = query.lte('transaction_date', options.endDate);
  }

  const { data, error, count } = await query;

  if (error) throw error;
  return { data, count, page, pageSize };
}

/**
 * UPDATE - Mettre à jour une transaction
 */
export async function updateTransaction(
  transactionId: string, 
  updates: {
    amount?: number;
    description?: string;
    transaction_date?: string;
  }
) {
  const { data, error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', transactionId)
    .select()
    .single();

  if (error) throw error;
  return data as Transaction;
}

/**
 * DELETE - Supprimer une transaction
 */
export async function deleteTransaction(transactionId: string) {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', transactionId);

  if (error) throw error;
}

// ============================================
// 3. PRÊTS (LOANS) - CRUD
// ============================================

/**
 * CREATE - Créer un prêt
 */
export async function createLoan(loanData: {
  member_id: string;
  amount: number;
  interest_rate?: number;
  payment_frequency?: 'weekly' | 'biweekly' | 'monthly';
  duration_days?: number;
  number_of_payments?: number;
}) {
  const { data, error } = await supabase
    .from('loans')
    .insert({
      ...loanData,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return data as Loan;
}

/**
 * READ - Lire tous les prêts d'un membre
 */
export async function getMemberLoans(memberId: string) {
  const { data, error } = await supabase
    .from('loans')
    .select('*')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Loan[];
}

/**
 * READ - Lire les prêts en attente d'approbation
 */
export async function getPendingLoans() {
  const { data, error } = await supabase
    .from('loans')
    .select('*, members(*)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * READ - Lire les prêts en retard
 */
export async function getOverdueLoans() {
  const { data, error } = await supabase
    .from('loans')
    .select('*, members(*)')
    .eq('status', 'active')
    .lt('due_date', new Date().toISOString())
    .order('due_date', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * UPDATE - Approuver un prêt
 */
export async function approveLoan(loanId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('loans')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: user?.id,
    })
    .eq('id', loanId)
    .select()
    .single();

  if (error) throw error;
  return data as Loan;
}

// ============================================
// 4. CONTRIBUTIONS - CRUD
// ============================================

/**
 * CREATE - Créer une contribution
 */
export async function createContribution(contributionData: {
  member_id: string;
  amount: number;
  contribution_date?: string;
  period?: string;
  payment_frequency?: 'weekly' | 'biweekly' | 'monthly';
  notes?: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('contributions')
    .insert({
      ...contributionData,
      created_by: user?.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Contribution;
}

/**
 * READ - Lire les contributions d'un membre
 */
export async function getMemberContributions(memberId: string) {
  const { data, error } = await supabase
    .from('contributions')
    .select('*')
    .eq('member_id', memberId)
    .order('contribution_date', { ascending: false });

  if (error) throw error;
  return data as Contribution[];
}

// ============================================
// 5. REQUÊTES AVEC JOINTURES
// ============================================

/**
 * Obtenir un membre avec tous ses détails
 */
export async function getMemberWithDetails(memberId: string) {
  const { data, error } = await supabase
    .from('members')
    .select(`
      *,
      profiles:profile_id (*),
      transactions (*),
      loans (*),
      contributions (*)
    `)
    .eq('id', memberId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Obtenir toutes les transactions avec les détails des membres
 */
export async function getTransactionsWithMembers() {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      members (*),
      expense_categories (*)
    `)
    .order('transaction_date', { ascending: false });

  if (error) throw error;
  return data;
}

// ============================================
// 6. REALTIME SUBSCRIPTIONS
// ============================================

/**
 * Écouter les nouvelles transactions en temps réel
 */
export function subscribeToTransactions(
  callback: (transaction: Transaction) => void
) {
  const channel = supabase
    .channel('transactions')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'transactions',
      },
      (payload) => {
        callback(payload.new as Transaction);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Écouter les mises à jour de prêts en temps réel
 */
export function subscribeToLoans(
  callback: (loan: Loan) => void
) {
  const channel = supabase
    .channel('loans')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'loans',
      },
      (payload) => {
        callback(payload.new as Loan);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ============================================
// 7. AGRÉGATIONS ET STATISTIQUES
// ============================================

/**
 * Calculer le solde total d'un membre
 */
export async function getMemberBalance(memberId: string): Promise<number> {
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('type, amount')
    .eq('member_id', memberId);

  if (error) throw error;

  let balance = 0;
  transactions?.forEach(t => {
    if (t.type === 'contribution' || t.type === 'payment') {
      balance += Number(t.amount);
    } else if (t.type === 'loan' || t.type === 'withdrawal' || t.type === 'expense') {
      balance -= Number(t.amount);
    }
  });

  return balance;
}

/**
 * Statistiques globales (admin seulement)
 */
export async function getGlobalStats() {
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('type, amount');

  if (error) throw error;

  const stats = {
    totalContributions: 0,
    totalLoans: 0,
    totalPayments: 0,
    totalWithdrawals: 0,
    totalExpenses: 0,
  };

  transactions?.forEach(t => {
    const amount = Number(t.amount);
    switch (t.type) {
      case 'contribution':
        stats.totalContributions += amount;
        break;
      case 'loan':
        stats.totalLoans += amount;
        break;
      case 'payment':
        stats.totalPayments += amount;
        break;
      case 'withdrawal':
        stats.totalWithdrawals += amount;
        break;
      case 'expense':
        stats.totalExpenses += amount;
        break;
    }
  });

  return stats;
}

// ============================================
// 8. FONCTIONS UTILITAIRES
// ============================================

/**
 * Générer un Member ID (appel à une fonction SQL)
 */
async function generateMemberId(currency: 'USD' | 'HTG' = 'HTG'): Promise<string> {
  const { data, error } = await supabase.rpc('generate_member_id', { currency });
  if (error) throw error;
  return data;
}

/**
 * Vérifier si l'utilisateur est admin
 */
export async function isAdmin(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error) return false;
  return data?.role === 'admin';
}

/**
 * Obtenir le profil de l'utilisateur actuel
 */
export async function getMyProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) return null;
  return data as Profile;
}


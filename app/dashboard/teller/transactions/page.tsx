'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabase';

type TransactionType = 'contribution' | 'loan' | 'payment' | 'withdrawal' | 'expense';

interface MemberOption {
  id: string;
  member_id: string;
  full_name: string;
  phone: string | null;
}

interface ExpenseCategory {
  id: string;
  name: string;
  color: string;
}

interface TransactionFormData {
  member_id: string;
  amount: string;
  description: string;
  transaction_date: string;
  // For contributions
  payment_frequency?: 'weekly' | 'biweekly' | 'monthly';
  period?: string;
  // For loans
  interest_rate?: string;
  duration_days?: string;
  payment_frequency_loan?: 'weekly' | 'biweekly' | 'monthly';
  // For expenses
  expense_category_id?: string;
}

export default function TellerTransactionsPage() {
  const [activeTab, setActiveTab] = useState<TransactionType>('contribution');
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isTeller, setIsTeller] = useState(false);
  const [formData, setFormData] = useState<TransactionFormData>({
    member_id: '',
    amount: '',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    const initialize = async () => {
      const isTellerUser = await checkTellerRole();
      if (isTellerUser) {
        await loadMembers();
        await loadExpenseCategories();
      } else {
        setLoading(false);
      }
    };
    initialize();
  }, []);

  const checkTellerRole = async (): Promise<boolean> => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Auth error:', authError);
        return false;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle(); // Use maybeSingle() to handle case where profile doesn't exist
      
      if (profileError) {
        console.error('Profile error:', profileError);
        return false;
      }

      const isTellerUser = profile?.role === 'teller' || profile?.role === 'admin';
      if (isTellerUser) {
        setIsTeller(true);
      }
      return isTellerUser;
    } catch (err) {
      console.error('Error checking teller role:', err);
      return false;
    }
  };

  const loadMembers = async () => {
    try {
      // Verify user is authenticated first
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setError('Erreur d\'authentification. Veuillez vous reconnecter.');
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('members')
        .select('id, member_id, full_name, phone')
        .eq('status', 'active')
        .order('full_name', { ascending: true });

      if (fetchError) {
        console.error('Error fetching members:', fetchError);
        // Provide more specific error message
        if (fetchError.code === 'PGRST301' || fetchError.message?.includes('permission')) {
          setError('Vous n\'avez pas les permissions nécessaires pour voir les membres.');
        } else {
          setError(`Erreur lors du chargement des membres: ${fetchError.message || 'Erreur inconnue'}`);
        }
        setMembers([]);
        return;
      }

      setMembers(data || []);
      setError(null); // Clear any previous errors
    } catch (err: any) {
      console.error('Error loading members:', err);
      setError(`Erreur lors du chargement des membres: ${err.message || 'Erreur inconnue'}`);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadExpenseCategories = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('expense_categories')
        .select('id, name, color')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (fetchError) {
        console.error('Error loading expense categories:', fetchError);
        // Don't set error state for expense categories, just log it
        setExpenseCategories([]);
        return;
      }

      setExpenseCategories(data || []);
    } catch (err) {
      console.error('Error loading expense categories:', err);
      setExpenseCategories([]);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Montant invalide');
      }

      // Member is optional for expenses
      if (activeTab !== 'expense' && !formData.member_id) {
        throw new Error('Veuillez sélectionner un membre');
      }

      switch (activeTab) {
        case 'contribution':
          await handleContribution();
          break;
        case 'loan':
          await handleLoan();
          break;
        case 'payment':
          await handlePayment();
          break;
        case 'withdrawal':
          await handleWithdrawal();
          break;
        case 'expense':
          await handleExpense();
          break;
      }

      // Reset form
      setFormData({
        member_id: '',
        amount: '',
        description: '',
        transaction_date: new Date().toISOString().split('T')[0],
        expense_category_id: undefined,
      });
      setSuccess('Transaction enregistrée avec succès!');
    } catch (err) {
      console.error('Error submitting transaction:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContribution = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non connecté');

    // Convert date string to ISO format for timestamp
    const transactionDate = formData.transaction_date 
      ? new Date(formData.transaction_date).toISOString()
      : new Date().toISOString();

    // Create transaction
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        member_id: formData.member_id,
        type: 'contribution',
        amount: parseFloat(formData.amount),
        description: formData.description || 'Contribution',
        transaction_date: transactionDate,
        created_by: user.id,
      });

    if (transactionError) throw transactionError;

    // Create contribution record
    const { error: contributionError } = await supabase
      .from('contributions')
      .insert({
        member_id: formData.member_id,
        amount: parseFloat(formData.amount),
        contribution_date: transactionDate,
        payment_frequency: formData.payment_frequency || 'monthly',
        period: formData.period || new Date(transactionDate).toISOString().slice(0, 7),
        created_by: user.id,
      });

    if (contributionError) throw contributionError;
  };

  const handleLoan = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non connecté');

    // Convert date string to ISO format for timestamp
    const transactionDate = formData.transaction_date 
      ? new Date(formData.transaction_date).toISOString()
      : new Date().toISOString();

    // Create transaction
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        member_id: formData.member_id,
        type: 'loan',
        amount: parseFloat(formData.amount),
        description: formData.description || 'Prêt',
        transaction_date: transactionDate,
        created_by: user.id,
      });

    if (transactionError) throw transactionError;

    // Create loan record
    const { error: loanError } = await supabase
      .from('loans')
      .insert({
        member_id: formData.member_id,
        amount: parseFloat(formData.amount),
        interest_rate: parseFloat(formData.interest_rate || '0'),
        payment_frequency: formData.payment_frequency_loan || 'monthly',
        duration_days: parseInt(formData.duration_days || '30'),
        status: 'pending',
      });

    if (loanError) throw loanError;
  };

  const handlePayment = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non connecté');

    // Convert date string to ISO format for timestamp
    const transactionDate = formData.transaction_date 
      ? new Date(formData.transaction_date).toISOString()
      : new Date().toISOString();

    // Create transaction
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        member_id: formData.member_id,
        type: 'payment',
        amount: parseFloat(formData.amount),
        description: formData.description || 'Paiement de prêt',
        transaction_date: transactionDate,
        created_by: user.id,
      });

    if (transactionError) throw transactionError;
  };

  const handleWithdrawal = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non connecté');

    // Convert date string to ISO format for timestamp
    const transactionDate = formData.transaction_date 
      ? new Date(formData.transaction_date).toISOString()
      : new Date().toISOString();

    // Create transaction
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        member_id: formData.member_id,
        type: 'withdrawal',
        amount: parseFloat(formData.amount),
        description: formData.description || 'Retrait',
        transaction_date: transactionDate,
        created_by: user.id,
      });

    if (transactionError) throw transactionError;
  };

  const handleExpense = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non connecté');

    if (!formData.expense_category_id) {
      throw new Error('Veuillez sélectionner une catégorie de dépense');
    }

    // Convert date string to ISO format for timestamp
    const transactionDate = formData.transaction_date 
      ? new Date(formData.transaction_date).toISOString()
      : new Date().toISOString();

    // Create transaction
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        member_id: formData.member_id || null, // Expenses can be without member
        type: 'expense',
        amount: parseFloat(formData.amount),
        description: formData.description || 'Dépense',
        transaction_date: transactionDate,
        expense_category_id: formData.expense_category_id,
        created_by: user.id,
      });

    if (transactionError) {
      console.error('Transaction error details:', transactionError);
      throw transactionError;
    }
  };

  if (!isTeller) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-800 mb-2">Accès refusé</h2>
            <p className="text-red-600">
              Vous devez être teller ou administrateur pour accéder à cette page.
            </p>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  if (loading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement...</p>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  const tabs = [
    { id: 'contribution' as TransactionType, label: 'Contributions', icon: '💰' },
    { id: 'loan' as TransactionType, label: 'Prêts', icon: '💵' },
    { id: 'payment' as TransactionType, label: 'Paiements', icon: '💳' },
    { id: 'withdrawal' as TransactionType, label: 'Retraits', icon: '🏦' },
    { id: 'expense' as TransactionType, label: 'Dépenses', icon: '📝' },
  ];

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-text mb-2">Enregistrer une Transaction</h1>
            <p className="text-gray-600">Enregistrez les transactions pour les membres</p>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'bg-[#d8b3e0] text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-green-600">{success}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Member Selection */}
              <div>
                <label htmlFor="member_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Membre {activeTab !== 'expense' && <span className="text-red-500">*</span>}
                  {activeTab === 'expense' && <span className="text-gray-500 text-xs ml-2">(Optionnel)</span>}
                </label>
                <select
                  id="member_id"
                  name="member_id"
                  value={formData.member_id}
                  onChange={handleInputChange}
                  required={activeTab !== 'expense'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Sélectionnez un membre</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.member_id} - {member.full_name}
                      {member.phone && ` (${member.phone})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                  Montant (HTG) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Transaction Date */}
              <div>
                <label htmlFor="transaction_date" className="block text-sm font-medium text-gray-700 mb-2">
                  Date de transaction <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="transaction_date"
                  name="transaction_date"
                  value={formData.transaction_date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Description de la transaction..."
                />
              </div>

              {/* Contribution-specific fields */}
              {activeTab === 'contribution' && (
                <>
                  <div>
                    <label htmlFor="payment_frequency" className="block text-sm font-medium text-gray-700 mb-2">
                      Fréquence de paiement
                    </label>
                    <select
                      id="payment_frequency"
                      name="payment_frequency"
                      value={formData.payment_frequency || 'monthly'}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="weekly">Hebdomadaire</option>
                      <option value="biweekly">Bi-hebdomadaire</option>
                      <option value="monthly">Mensuel</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="period" className="block text-sm font-medium text-gray-700 mb-2">
                      Période (YYYY-MM)
                    </label>
                    <input
                      type="text"
                      id="period"
                      name="period"
                      value={formData.period || new Date(formData.transaction_date).toISOString().slice(0, 7)}
                      onChange={handleInputChange}
                      pattern="\d{4}-\d{2}"
                      placeholder="2024-01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </>
              )}

              {/* Loan-specific fields */}
              {activeTab === 'loan' && (
                <>
                  <div>
                    <label htmlFor="interest_rate" className="block text-sm font-medium text-gray-700 mb-2">
                      Taux d&apos;intérêt (%)
                    </label>
                    <input
                      type="number"
                      id="interest_rate"
                      name="interest_rate"
                      value={formData.interest_rate || '0'}
                      onChange={handleInputChange}
                      min="0"
                      max="100"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="duration_days" className="block text-sm font-medium text-gray-700 mb-2">
                      Durée (jours)
                    </label>
                    <input
                      type="number"
                      id="duration_days"
                      name="duration_days"
                      value={formData.duration_days || '30'}
                      onChange={handleInputChange}
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="payment_frequency_loan" className="block text-sm font-medium text-gray-700 mb-2">
                      Fréquence de paiement
                    </label>
                    <select
                      id="payment_frequency_loan"
                      name="payment_frequency_loan"
                      value={formData.payment_frequency_loan || 'monthly'}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="weekly">Hebdomadaire</option>
                      <option value="biweekly">Bi-hebdomadaire</option>
                      <option value="monthly">Mensuel</option>
                    </select>
                  </div>
                </>
              )}

              {/* Expense-specific fields */}
              {activeTab === 'expense' && (
                <div>
                  <label htmlFor="expense_category_id" className="block text-sm font-medium text-gray-700 mb-2">
                    Catégorie de dépense <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="expense_category_id"
                    name="expense_category_id"
                    value={formData.expense_category_id || ''}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Sélectionnez une catégorie</option>
                    {expenseCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {expenseCategories.length === 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      Aucune catégorie disponible. Veuillez contacter un administrateur.
                    </p>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end pt-4 border-t">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}


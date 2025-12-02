# Guide Complet: Schéma Supabase PostgreSQL pour Application Mutuelle

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Schéma SQL Complet](#schéma-sql-complet)
3. [Politiques RLS (Row Level Security)](#politiques-rls)
4. [Fonctions et Triggers](#fonctions-et-triggers)
5. [Exemples d'Utilisation Frontend](#exemples-dutilisation-frontend)
6. [Optimisations et Index](#optimisations-et-index)

---

## 🎯 Vue d'ensemble

Cette application est une **Mutuelle (Coopérative Financière)** avec les fonctionnalités suivantes:

### Fonctionnalités Principales:
- ✅ Gestion des membres (adhésion, profils, statuts)
- ✅ Transactions financières (contributions, prêts, paiements, retraits)
- ✅ Gestion des prêts (approbation, échéanciers, remboursements)
- ✅ Formulaires d'adhésion obligatoires
- ✅ Catégories de dépenses
- ✅ Distribution d'intérêts
- ✅ Demandes de changement de mot de passe
- ✅ Système d'approbation des utilisateurs
- ✅ Rôles: member, admin, treasurer, teller

### Architecture:
- **Frontend**: Next.js 14 (App Router) + TypeScript + React
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Authentification**: Email/Password + Dual Login (Email ou Member ID)

---

## 🗄️ Schéma SQL Complet

### 1. Table: `profiles` (Profils Utilisateurs)

```sql
-- Table des profils utilisateurs (extension de auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin', 'treasurer', 'teller')),
  approved BOOLEAN DEFAULT false NOT NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);
CREATE INDEX IF NOT EXISTS profiles_approved_idx ON public.profiles(approved);
```

### 2. Table: `members` (Membres de la Mutuelle)

```sql
CREATE TABLE IF NOT EXISTS public.members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  member_id TEXT UNIQUE NOT NULL, -- Format: YY-SEQUENCE-CURRENCY (ex: 25-0001-USD)
  full_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  currency TEXT DEFAULT 'HTG' CHECK (currency IN ('USD', 'HTG')),
  join_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  form_completed BOOLEAN DEFAULT false,
  form_submission_id UUID REFERENCES public.membership_form_submissions(id),
  password_set BOOLEAN DEFAULT false,
  is_default_password BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index
CREATE INDEX IF NOT EXISTS members_profile_id_idx ON public.members(profile_id);
CREATE INDEX IF NOT EXISTS members_member_id_idx ON public.members(member_id);
CREATE INDEX IF NOT EXISTS members_status_idx ON public.members(status);
CREATE INDEX IF NOT EXISTS members_currency_idx ON public.members(currency);
```

### 3. Table: `transactions` (Transactions Financières)

```sql
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE, -- NULL pour les dépenses
  type TEXT NOT NULL CHECK (type IN ('contribution', 'loan', 'payment', 'withdrawal', 'interest', 'expense')),
  amount DECIMAL(15, 2) NOT NULL,
  description TEXT,
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  expense_category_id UUID REFERENCES public.expense_categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Index
CREATE INDEX IF NOT EXISTS transactions_member_id_idx ON public.transactions(member_id);
CREATE INDEX IF NOT EXISTS transactions_type_idx ON public.transactions(type);
CREATE INDEX IF NOT EXISTS transactions_date_idx ON public.transactions(transaction_date);
CREATE INDEX IF NOT EXISTS transactions_expense_category_idx ON public.transactions(expense_category_id);
```

### 4. Table: `loans` (Prêts)

```sql
CREATE TABLE IF NOT EXISTS public.loans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  interest_rate DECIMAL(5, 2) DEFAULT 0.00,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active', 'paid', 'defaulted')),
  payment_frequency TEXT DEFAULT 'monthly' CHECK (payment_frequency IN ('weekly', 'biweekly', 'monthly')),
  duration_days INTEGER,
  number_of_payments INTEGER,
  due_date TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index
CREATE INDEX IF NOT EXISTS loans_member_id_idx ON public.loans(member_id);
CREATE INDEX IF NOT EXISTS loans_status_idx ON public.loans(status);
CREATE INDEX IF NOT EXISTS loans_due_date_idx ON public.loans(due_date);
```

### 5. Table: `contributions` (Contributions des Membres)

```sql
CREATE TABLE IF NOT EXISTS public.contributions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  contribution_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  period TEXT, -- Format: 'YYYY-MM' (ex: '2024-01')
  payment_frequency TEXT DEFAULT 'monthly' CHECK (payment_frequency IN ('weekly', 'biweekly', 'monthly')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Index
CREATE INDEX IF NOT EXISTS contributions_member_id_idx ON public.contributions(member_id);
CREATE INDEX IF NOT EXISTS contributions_date_idx ON public.contributions(contribution_date);
CREATE INDEX IF NOT EXISTS contributions_period_idx ON public.contributions(period);
```

### 6. Table: `loan_config` (Configuration des Prêts)

```sql
CREATE TABLE IF NOT EXISTS public.loan_config (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  interest_rate DECIMAL(5, 2) DEFAULT 0.00 NOT NULL,
  default_duration_days INTEGER DEFAULT 30 NOT NULL,
  payment_frequency TEXT DEFAULT 'monthly' CHECK (payment_frequency IN ('weekly', 'biweekly', 'monthly')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
```

### 7. Table: `expense_categories` (Catégories de Dépenses)

```sql
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
```

### 8. Table: `membership_form_config` (Configuration Formulaire d'Adhésion)

```sql
CREATE TABLE IF NOT EXISTS public.membership_form_config (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  is_active BOOLEAN DEFAULT false,
  title TEXT DEFAULT 'Formulaire d''Adhésion',
  description TEXT,
  fields JSONB DEFAULT '[]'::jsonb, -- Array of FormField objects
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
```

### 9. Table: `membership_form_submissions` (Soumissions Formulaire)

```sql
CREATE TABLE IF NOT EXISTS public.membership_form_submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL UNIQUE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  form_config_id UUID REFERENCES public.membership_form_config(id),
  responses JSONB DEFAULT '{}'::jsonb,
  signature_data TEXT, -- Base64 encoded signature image
  signature_timestamp TIMESTAMP WITH TIME ZONE,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rejected')),
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

### 10. Table: `interest_distributions` (Distributions d'Intérêts)

```sql
CREATE TABLE IF NOT EXISTS public.interest_distributions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  distribution_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  total_interest_collected DECIMAL(15, 2) NOT NULL,
  number_of_members INTEGER NOT NULL,
  amount_per_member DECIMAL(15, 2) NOT NULL,
  total_distributed DECIMAL(15, 2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL
);
```

### 11. Table: `password_change_requests` (Demandes Changement Mot de Passe)

```sql
CREATE TABLE IF NOT EXISTS public.password_change_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  new_password TEXT, -- Temporaire, sera effacé après utilisation
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  notes TEXT,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index
CREATE INDEX IF NOT EXISTS password_requests_member_id_idx ON public.password_change_requests(member_id);
CREATE INDEX IF NOT EXISTS password_requests_status_idx ON public.password_change_requests(status);
```

---

## 🔒 Politiques RLS (Row Level Security)

### Activer RLS sur toutes les tables

```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_form_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interest_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_change_requests ENABLE ROW LEVEL SECURITY;
```

### Fonction Helper pour Vérifier le Rôle Admin

```sql
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.current_user_is_admin() TO authenticated;
```

### Politiques RLS pour `profiles`

```sql
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.current_user_is_admin());

-- Admins can update approval status
CREATE POLICY "Admins can update approval status"
  ON public.profiles FOR UPDATE
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());
```

### Politiques RLS pour `members`

```sql
-- Users can view their own member record
CREATE POLICY "Users can view own member record"
  ON public.members FOR SELECT
  USING (profile_id = auth.uid());

-- Admins can view all members
CREATE POLICY "Admins can view all members"
  ON public.members FOR SELECT
  USING (public.current_user_is_admin());

-- Admins can insert/update/delete members
CREATE POLICY "Admins can manage members"
  ON public.members FOR ALL
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());
```

### Politiques RLS pour `transactions`

```sql
-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.members
      WHERE members.id = transactions.member_id
      AND members.profile_id = auth.uid()
    )
  );

-- Admins and Tellers can view all transactions
CREATE POLICY "Admins and Tellers can view all transactions"
  ON public.transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'teller')
    )
  );

-- Admins and Tellers can insert transactions
CREATE POLICY "Admins and Tellers can insert transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'teller')
    )
  );

-- Admins can update/delete transactions
CREATE POLICY "Admins can manage transactions"
  ON public.transactions FOR UPDATE
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());
```

### Politiques RLS pour `loans`

```sql
-- Users can view their own loans
CREATE POLICY "Users can view own loans"
  ON public.loans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.members
      WHERE members.id = loans.member_id
      AND members.profile_id = auth.uid()
    )
  );

-- Admins can view and manage all loans
CREATE POLICY "Admins can manage loans"
  ON public.loans FOR ALL
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());
```

### Politiques RLS pour `contributions`

```sql
-- Users can view their own contributions
CREATE POLICY "Users can view own contributions"
  ON public.contributions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.members
      WHERE members.id = contributions.member_id
      AND members.profile_id = auth.uid()
    )
  );

-- Admins can view and insert contributions
CREATE POLICY "Admins can manage contributions"
  ON public.contributions FOR ALL
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());
```

---

## ⚙️ Fonctions et Triggers

### Fonction: Création Automatique de Profil

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, approved)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Fonction: Mise à Jour Automatique de `updated_at`

```sql
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour toutes les tables avec updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_members_updated_at
  BEFORE UPDATE ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_loans_updated_at
  BEFORE UPDATE ON public.loans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

### Fonction: Génération Automatique de Member ID

```sql
CREATE OR REPLACE FUNCTION public.generate_member_id(currency TEXT DEFAULT 'HTG')
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  sequence_num INTEGER;
  new_member_id TEXT;
BEGIN
  -- Extraire les 2 derniers chiffres de l'année
  current_year := RIGHT(EXTRACT(YEAR FROM NOW())::TEXT, 2);
  
  -- Trouver le prochain numéro de séquence pour cette année et devise
  SELECT COALESCE(MAX(CAST(SPLIT_PART(member_id, '-', 2) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM public.members
  WHERE SPLIT_PART(member_id, '-', 1) = current_year
    AND currency = currency;
  
  -- Générer le nouveau member_id: YY-SEQUENCE-CURRENCY
  new_member_id := current_year || '-' || LPAD(sequence_num::TEXT, 4, '0') || '-' || currency;
  
  RETURN new_member_id;
END;
$$ LANGUAGE plpgsql;
```

---

## 💻 Exemples d'Utilisation Frontend (Next.js/React)

### Configuration Supabase Client

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 1. CRUD - Membres (Members)

#### CREATE - Créer un Membre

```typescript
async function createMember(memberData: {
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
  return data;
}
```

#### READ - Lire les Membres

```typescript
// Lire tous les membres (admin seulement)
async function getAllMembers() {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Lire son propre membre
async function getMyMember() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('profile_id', user.id)
    .single();

  if (error) throw error;
  return data;
}

// Lire un membre par ID
async function getMemberById(memberId: string) {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('id', memberId)
    .single();

  if (error) throw error;
  return data;
}
```

#### UPDATE - Mettre à Jour un Membre

```typescript
async function updateMember(memberId: string, updates: {
  full_name?: string;
  phone?: string;
  address?: string;
  status?: 'active' | 'inactive' | 'suspended';
}) {
  const { data, error } = await supabase
    .from('members')
    .update(updates)
    .eq('id', memberId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

#### DELETE - Supprimer un Membre

```typescript
async function deleteMember(memberId: string) {
  const { error } = await supabase
    .from('members')
    .delete()
    .eq('id', memberId);

  if (error) throw error;
}
```

### 2. CRUD - Transactions

#### CREATE - Créer une Transaction

```typescript
async function createTransaction(transactionData: {
  member_id?: string | null; // null pour les dépenses
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
  return data;
}
```

#### READ - Lire les Transactions

```typescript
// Lire toutes les transactions d'un membre
async function getMemberTransactions(memberId: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, expense_categories(*)')
    .eq('member_id', memberId)
    .order('transaction_date', { ascending: false });

  if (error) throw error;
  return data;
}

// Lire mes propres transactions
async function getMyTransactions() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // D'abord obtenir mon membre
  const { data: member } = await supabase
    .from('members')
    .select('id')
    .eq('profile_id', user.id)
    .single();

  if (!member) return [];

  // Ensuite obtenir mes transactions
  const { data, error } = await supabase
    .from('transactions')
    .select('*, expense_categories(*)')
    .eq('member_id', member.id)
    .order('transaction_date', { ascending: false });

  if (error) throw error;
  return data;
}

// Lire les transactions par type
async function getTransactionsByType(type: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, members(*)')
    .eq('type', type)
    .order('transaction_date', { ascending: false });

  if (error) throw error;
  return data;
}
```

#### UPDATE - Mettre à Jour une Transaction

```typescript
async function updateTransaction(transactionId: string, updates: {
  amount?: number;
  description?: string;
  transaction_date?: string;
}) {
  const { data, error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', transactionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

#### DELETE - Supprimer une Transaction

```typescript
async function deleteTransaction(transactionId: string) {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', transactionId);

  if (error) throw error;
}
```

### 3. CRUD - Prêts (Loans)

#### CREATE - Créer un Prêt

```typescript
async function createLoan(loanData: {
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
  return data;
}
```

#### READ - Lire les Prêts

```typescript
// Lire tous les prêts d'un membre
async function getMemberLoans(memberId: string) {
  const { data, error } = await supabase
    .from('loans')
    .select('*')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Lire les prêts en attente d'approbation
async function getPendingLoans() {
  const { data, error } = await supabase
    .from('loans')
    .select('*, members(*)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Lire les prêts en retard
async function getOverdueLoans() {
  const { data, error } = await supabase
    .from('loans')
    .select('*, members(*)')
    .eq('status', 'active')
    .lt('due_date', new Date().toISOString())
    .order('due_date', { ascending: true });

  if (error) throw error;
  return data;
}
```

#### UPDATE - Approuver un Prêt

```typescript
async function approveLoan(loanId: string) {
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
  return data;
}
```

### 4. Requêtes avec Jointures

```typescript
// Obtenir un membre avec son profil et ses transactions
async function getMemberWithDetails(memberId: string) {
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

// Obtenir toutes les transactions avec les détails du membre
async function getTransactionsWithMembers() {
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
```

### 5. Requêtes avec Filtres et Pagination

```typescript
// Transactions avec filtres et pagination
async function getTransactionsPaginated(options: {
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
```

### 6. Realtime Subscriptions

```typescript
// Écouter les nouvelles transactions en temps réel
function subscribeToTransactions(callback: (transaction: any) => void) {
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
        callback(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// Utilisation dans un composant React
useEffect(() => {
  const unsubscribe = subscribeToTransactions((transaction) => {
    console.log('Nouvelle transaction:', transaction);
    // Mettre à jour l'état ou rafraîchir les données
  });

  return () => unsubscribe();
}, []);
```

### 7. Agrégations et Statistiques

```typescript
// Calculer le solde total d'un membre
async function getMemberBalance(memberId: string) {
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('type, amount')
    .eq('member_id', memberId);

  if (error) throw error;

  let balance = 0;
  transactions.forEach(t => {
    if (t.type === 'contribution' || t.type === 'payment') {
      balance += Number(t.amount);
    } else if (t.type === 'loan' || t.type === 'withdrawal' || t.type === 'expense') {
      balance -= Number(t.amount);
    }
  });

  return balance;
}

// Statistiques globales (admin seulement)
async function getGlobalStats() {
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

  transactions.forEach(t => {
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
```

---

## 🚀 Optimisations et Index

### Index Recommandés

```sql
-- Index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS transactions_member_type_idx 
  ON public.transactions(member_id, type);

CREATE INDEX IF NOT EXISTS loans_member_status_idx 
  ON public.loans(member_id, status);

CREATE INDEX IF NOT EXISTS members_profile_status_idx 
  ON public.members(profile_id, status);

-- Index pour les recherches par date
CREATE INDEX IF NOT EXISTS transactions_date_type_idx 
  ON public.transactions(transaction_date DESC, type);

-- Index pour les recherches full-text (si nécessaire)
CREATE INDEX IF NOT EXISTS members_full_name_idx 
  ON public.members USING gin(to_tsvector('french', full_name));
```

### Vues Matérialisées (Optionnel)

```sql
-- Vue pour les statistiques des membres
CREATE MATERIALIZED VIEW IF NOT EXISTS member_statistics AS
SELECT 
  m.id,
  m.member_id,
  m.full_name,
  COUNT(DISTINCT t.id) as transaction_count,
  SUM(CASE WHEN t.type = 'contribution' THEN t.amount ELSE 0 END) as total_contributions,
  SUM(CASE WHEN t.type = 'loan' THEN t.amount ELSE 0 END) as total_loans,
  COUNT(DISTINCT l.id) as loan_count,
  COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'active') as active_loans
FROM public.members m
LEFT JOIN public.transactions t ON t.member_id = m.id
LEFT JOIN public.loans l ON l.member_id = m.id
GROUP BY m.id, m.member_id, m.full_name;

-- Rafraîchir la vue
REFRESH MATERIALIZED VIEW member_statistics;
```

---

## 📝 Notes Importantes

1. **Sécurité**: Toutes les tables ont RLS activé. Les utilisateurs ne peuvent accéder qu'à leurs propres données sauf si ils sont admins.

2. **Performance**: Les index sont optimisés pour les requêtes fréquentes. Surveillez les performances avec `EXPLAIN ANALYZE`.

3. **Realtime**: Les tables `transactions`, `loans`, et `contributions` sont publiées pour Realtime.

4. **Foreign Keys**: Toutes les clés étrangères utilisent `ON DELETE CASCADE` ou `ON DELETE SET NULL` selon le contexte.

5. **Validation**: Utilisez les contraintes CHECK pour valider les données au niveau de la base.

---

## ✅ Checklist de Déploiement

- [ ] Appliquer toutes les migrations SQL
- [ ] Vérifier que RLS est activé sur toutes les tables
- [ ] Tester les politiques RLS avec différents rôles
- [ ] Configurer les variables d'environnement Supabase
- [ ] Tester les requêtes CRUD depuis le frontend
- [ ] Configurer Realtime si nécessaire
- [ ] Créer les index pour optimiser les performances
- [ ] Documenter les APIs personnalisées

---

**Document généré le:** 2024-12-01  
**Version:** 1.0.0  
**Application:** Mutuelle (Coopérative Financière)


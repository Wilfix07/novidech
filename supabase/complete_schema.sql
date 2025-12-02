-- ============================================
-- SCHEMA COMPLET POUR APPLICATION MUTUELLE
-- Supabase PostgreSQL
-- ============================================
-- Ce fichier contient le schéma complet de la base de données
-- pour l'application de mutuelle (coopérative financière)
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. TABLE: profiles
-- ============================================
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

-- Index pour profiles
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);
CREATE INDEX IF NOT EXISTS profiles_approved_idx ON public.profiles(approved);

-- ============================================
-- 2. TABLE: members
-- ============================================
CREATE TABLE IF NOT EXISTS public.members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  member_id TEXT UNIQUE NOT NULL,
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

-- Index pour members
CREATE INDEX IF NOT EXISTS members_profile_id_idx ON public.members(profile_id);
CREATE INDEX IF NOT EXISTS members_member_id_idx ON public.members(member_id);
CREATE INDEX IF NOT EXISTS members_status_idx ON public.members(status);
CREATE INDEX IF NOT EXISTS members_currency_idx ON public.members(currency);

-- ============================================
-- 3. TABLE: transactions
-- ============================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('contribution', 'loan', 'payment', 'withdrawal', 'interest', 'expense')),
  amount DECIMAL(15, 2) NOT NULL,
  description TEXT,
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  expense_category_id UUID REFERENCES public.expense_categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Index pour transactions
CREATE INDEX IF NOT EXISTS transactions_member_id_idx ON public.transactions(member_id);
CREATE INDEX IF NOT EXISTS transactions_type_idx ON public.transactions(type);
CREATE INDEX IF NOT EXISTS transactions_date_idx ON public.transactions(transaction_date);
CREATE INDEX IF NOT EXISTS transactions_expense_category_idx ON public.transactions(expense_category_id);
CREATE INDEX IF NOT EXISTS transactions_member_type_idx ON public.transactions(member_id, type);

-- ============================================
-- 4. TABLE: loans
-- ============================================
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

-- Index pour loans
CREATE INDEX IF NOT EXISTS loans_member_id_idx ON public.loans(member_id);
CREATE INDEX IF NOT EXISTS loans_status_idx ON public.loans(status);
CREATE INDEX IF NOT EXISTS loans_due_date_idx ON public.loans(due_date);
CREATE INDEX IF NOT EXISTS loans_member_status_idx ON public.loans(member_id, status);

-- ============================================
-- 5. TABLE: contributions
-- ============================================
CREATE TABLE IF NOT EXISTS public.contributions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  contribution_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  period TEXT,
  payment_frequency TEXT DEFAULT 'monthly' CHECK (payment_frequency IN ('weekly', 'biweekly', 'monthly')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Index pour contributions
CREATE INDEX IF NOT EXISTS contributions_member_id_idx ON public.contributions(member_id);
CREATE INDEX IF NOT EXISTS contributions_date_idx ON public.contributions(contribution_date);
CREATE INDEX IF NOT EXISTS contributions_period_idx ON public.contributions(period);

-- ============================================
-- 6. TABLE: loan_config
-- ============================================
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

-- ============================================
-- 7. TABLE: expense_categories
-- ============================================
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

-- ============================================
-- 8. TABLE: membership_form_config
-- ============================================
CREATE TABLE IF NOT EXISTS public.membership_form_config (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  is_active BOOLEAN DEFAULT false,
  title TEXT DEFAULT 'Formulaire d''Adhésion',
  description TEXT,
  fields JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================
-- 9. TABLE: membership_form_submissions
-- ============================================
CREATE TABLE IF NOT EXISTS public.membership_form_submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL UNIQUE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  form_config_id UUID REFERENCES public.membership_form_config(id),
  responses JSONB DEFAULT '{}'::jsonb,
  signature_data TEXT,
  signature_timestamp TIMESTAMP WITH TIME ZONE,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rejected')),
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- 10. TABLE: interest_distributions
-- ============================================
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

-- ============================================
-- 11. TABLE: password_change_requests
-- ============================================
CREATE TABLE IF NOT EXISTS public.password_change_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  new_password TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  notes TEXT,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index pour password_change_requests
CREATE INDEX IF NOT EXISTS password_requests_member_id_idx ON public.password_change_requests(member_id);
CREATE INDEX IF NOT EXISTS password_requests_status_idx ON public.password_change_requests(status);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
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

-- ============================================
-- FUNCTIONS
-- ============================================

-- Fonction: Création automatique de profil
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

-- Fonction: Mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction: Vérifier si l'utilisateur est admin
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

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger: Créer profil automatiquement
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers: Mise à jour automatique de updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_members_updated_at
  BEFORE UPDATE ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_loans_updated_at
  BEFORE UPDATE ON public.loans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- ENABLE REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.loans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contributions;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE public.profiles IS 'Profils utilisateurs (extension de auth.users)';
COMMENT ON TABLE public.members IS 'Membres de la mutuelle';
COMMENT ON TABLE public.transactions IS 'Toutes les transactions financières';
COMMENT ON TABLE public.loans IS 'Enregistrements de prêts';
COMMENT ON TABLE public.contributions IS 'Suivi des contributions des membres';
COMMENT ON TABLE public.loan_config IS 'Configuration des prêts définie par les admins';
COMMENT ON TABLE public.expense_categories IS 'Catégories de dépenses définies par l''admin';
COMMENT ON TABLE public.membership_form_config IS 'Configuration du formulaire d''adhésion défini par l''admin';
COMMENT ON TABLE public.membership_form_submissions IS 'Soumissions du formulaire d''adhésion par les membres';
COMMENT ON TABLE public.interest_distributions IS 'Historique des distributions d''intérêts aux membres';
COMMENT ON TABLE public.password_change_requests IS 'Demandes de changement de mot de passe par les membres';


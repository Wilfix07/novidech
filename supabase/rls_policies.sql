-- ============================================
-- POLITIQUES RLS (ROW LEVEL SECURITY)
-- ============================================
-- Toutes les politiques de sécurité pour l'application Mutuelle
-- ============================================

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Admins can view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.current_user_is_admin());

-- Admins can update approval status
DROP POLICY IF EXISTS "Admins can update approval status" ON public.profiles;
CREATE POLICY "Admins can update approval status"
  ON public.profiles FOR UPDATE
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

-- ============================================
-- MEMBERS POLICIES
-- ============================================

-- Users can view their own member record
DROP POLICY IF EXISTS "Users can view own member record" ON public.members;
CREATE POLICY "Users can view own member record"
  ON public.members FOR SELECT
  USING (profile_id = auth.uid());

-- Admins can view all members
DROP POLICY IF EXISTS "Admins can view all members" ON public.members;
CREATE POLICY "Admins can view all members"
  ON public.members FOR SELECT
  USING (public.current_user_is_admin());

-- Admins can insert/update/delete members
DROP POLICY IF EXISTS "Admins can manage members" ON public.members;
CREATE POLICY "Admins can manage members"
  ON public.members FOR ALL
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

-- ============================================
-- TRANSACTIONS POLICIES
-- ============================================

-- Users can view their own transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
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
DROP POLICY IF EXISTS "Admins and Tellers can view all transactions" ON public.transactions;
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
DROP POLICY IF EXISTS "Admins and Tellers can insert transactions" ON public.transactions;
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
DROP POLICY IF EXISTS "Admins can manage transactions" ON public.transactions;
CREATE POLICY "Admins can manage transactions"
  ON public.transactions FOR UPDATE
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

DROP POLICY IF EXISTS "Admins can delete transactions" ON public.transactions;
CREATE POLICY "Admins can delete transactions"
  ON public.transactions FOR DELETE
  USING (public.current_user_is_admin());

-- ============================================
-- LOANS POLICIES
-- ============================================

-- Users can view their own loans
DROP POLICY IF EXISTS "Users can view own loans" ON public.loans;
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
DROP POLICY IF EXISTS "Admins can manage loans" ON public.loans;
CREATE POLICY "Admins can manage loans"
  ON public.loans FOR ALL
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

-- ============================================
-- CONTRIBUTIONS POLICIES
-- ============================================

-- Users can view their own contributions
DROP POLICY IF EXISTS "Users can view own contributions" ON public.contributions;
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
DROP POLICY IF EXISTS "Admins can manage contributions" ON public.contributions;
CREATE POLICY "Admins can manage contributions"
  ON public.contributions FOR ALL
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

-- ============================================
-- LOAN_CONFIG POLICIES
-- ============================================

-- Everyone can view active loan config
DROP POLICY IF EXISTS "Everyone can view active loan config" ON public.loan_config;
CREATE POLICY "Everyone can view active loan config"
  ON public.loan_config FOR SELECT
  USING (is_active = true);

-- Admins can view and manage all loan config
DROP POLICY IF EXISTS "Admins can manage loan config" ON public.loan_config;
CREATE POLICY "Admins can manage loan config"
  ON public.loan_config FOR ALL
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

-- ============================================
-- EXPENSE_CATEGORIES POLICIES
-- ============================================

-- Everyone can view active expense categories
DROP POLICY IF EXISTS "Everyone can view active expense categories" ON public.expense_categories;
CREATE POLICY "Everyone can view active expense categories"
  ON public.expense_categories FOR SELECT
  USING (is_active = true);

-- Admins can view and manage all expense categories
DROP POLICY IF EXISTS "Admins can manage expense categories" ON public.expense_categories;
CREATE POLICY "Admins can manage expense categories"
  ON public.expense_categories FOR ALL
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

-- ============================================
-- MEMBERSHIP_FORM_CONFIG POLICIES
-- ============================================

-- Everyone can view active form config
DROP POLICY IF EXISTS "Everyone can view active form config" ON public.membership_form_config;
CREATE POLICY "Everyone can view active form config"
  ON public.membership_form_config FOR SELECT
  USING (is_active = true);

-- Admins can view and manage all form config
DROP POLICY IF EXISTS "Admins can manage form config" ON public.membership_form_config;
CREATE POLICY "Admins can manage form config"
  ON public.membership_form_config FOR ALL
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

-- ============================================
-- MEMBERSHIP_FORM_SUBMISSIONS POLICIES
-- ============================================

-- Users can view their own submission
DROP POLICY IF EXISTS "Users can view own submission" ON public.membership_form_submissions;
CREATE POLICY "Users can view own submission"
  ON public.membership_form_submissions FOR SELECT
  USING (profile_id = auth.uid());

-- Users can insert their own submission
DROP POLICY IF EXISTS "Users can insert own submission" ON public.membership_form_submissions;
CREATE POLICY "Users can insert own submission"
  ON public.membership_form_submissions FOR INSERT
  WITH CHECK (profile_id = auth.uid());

-- Users can update their own submission (if pending)
DROP POLICY IF EXISTS "Users can update own pending submission" ON public.membership_form_submissions;
CREATE POLICY "Users can update own pending submission"
  ON public.membership_form_submissions FOR UPDATE
  USING (profile_id = auth.uid() AND status = 'pending')
  WITH CHECK (profile_id = auth.uid());

-- Admins can view and manage all submissions
DROP POLICY IF EXISTS "Admins can manage submissions" ON public.membership_form_submissions;
CREATE POLICY "Admins can manage submissions"
  ON public.membership_form_submissions FOR ALL
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

-- ============================================
-- INTEREST_DISTRIBUTIONS POLICIES
-- ============================================

-- Everyone can view interest distributions
DROP POLICY IF EXISTS "Everyone can view interest distributions" ON public.interest_distributions;
CREATE POLICY "Everyone can view interest distributions"
  ON public.interest_distributions FOR SELECT
  USING (true);

-- Admins can insert interest distributions
DROP POLICY IF EXISTS "Admins can insert interest distributions" ON public.interest_distributions;
CREATE POLICY "Admins can insert interest distributions"
  ON public.interest_distributions FOR INSERT
  WITH CHECK (public.current_user_is_admin());

-- ============================================
-- PASSWORD_CHANGE_REQUESTS POLICIES
-- ============================================

-- Users can view their own password change requests
DROP POLICY IF EXISTS "Users can view own password requests" ON public.password_change_requests;
CREATE POLICY "Users can view own password requests"
  ON public.password_change_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.members
      WHERE members.id = password_change_requests.member_id
      AND members.profile_id = auth.uid()
    )
  );

-- Users can insert their own password change requests
DROP POLICY IF EXISTS "Users can insert own password requests" ON public.password_change_requests;
CREATE POLICY "Users can insert own password requests"
  ON public.password_change_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.members
      WHERE members.id = password_change_requests.member_id
      AND members.profile_id = auth.uid()
    )
  );

-- Admins can view and manage all password change requests
DROP POLICY IF EXISTS "Admins can manage password requests" ON public.password_change_requests;
CREATE POLICY "Admins can manage password requests"
  ON public.password_change_requests FOR ALL
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());


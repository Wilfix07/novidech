-- Update role constraint to include 'teller'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('member', 'admin', 'treasurer', 'teller'));

-- RLS Policies for tellers on members table
-- Tellers can view all members
CREATE POLICY "Tellers can view all members"
  ON public.members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teller'
    )
  );

-- Tellers can insert new members
CREATE POLICY "Tellers can insert members"
  ON public.members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teller'
    )
  );

-- Tellers can update member information
CREATE POLICY "Tellers can update members"
  ON public.members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teller'
    )
  );

-- RLS Policies for tellers on transactions table
-- Tellers can insert transactions for any member
CREATE POLICY "Tellers can insert transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teller'
    )
  );

-- Tellers can update transactions
CREATE POLICY "Tellers can update transactions"
  ON public.transactions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teller'
    )
  );

-- RLS Policies for tellers on contributions table
-- Tellers can insert contributions for any member
CREATE POLICY "Tellers can insert contributions"
  ON public.contributions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teller'
    )
  );

-- Tellers can update contributions
CREATE POLICY "Tellers can update contributions"
  ON public.contributions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teller'
    )
  );

-- RLS Policies for tellers on loans table
-- Tellers can insert loans
CREATE POLICY "Tellers can insert loans"
  ON public.loans FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teller'
    )
  );

-- Tellers can update loans (approve, update status, etc.)
CREATE POLICY "Tellers can update loans"
  ON public.loans FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teller'
    )
  );

-- Tellers can view all loans
CREATE POLICY "Tellers can view all loans"
  ON public.loans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teller'
    )
  );

-- Tellers can view all transactions
CREATE POLICY "Tellers can view all transactions"
  ON public.transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teller'
    )
  );

-- Tellers can view all contributions
CREATE POLICY "Tellers can view all contributions"
  ON public.contributions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teller'
    )
  );


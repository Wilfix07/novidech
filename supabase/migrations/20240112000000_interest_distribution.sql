-- Interest Distribution System
-- Allows admin to distribute collected loan interest equally among all active members

-- Table to track interest distributions
CREATE TABLE IF NOT EXISTS public.interest_distributions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  distribution_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  total_interest_collected DECIMAL(15, 2) NOT NULL,
  number_of_members INTEGER NOT NULL,
  amount_per_member DECIMAL(15, 2) NOT NULL,
  total_distributed DECIMAL(15, 2) NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.interest_distributions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for interest_distributions
CREATE POLICY "Admins can view all distributions"
  ON public.interest_distributions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Members can view distributions"
  ON public.interest_distributions FOR SELECT
  USING (true); -- All members can see distributions

CREATE POLICY "Admins can create distributions"
  ON public.interest_distributions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create index
CREATE INDEX IF NOT EXISTS interest_distributions_date_idx ON public.interest_distributions(distribution_date);

-- Function to calculate total interest collected from loan payments
CREATE OR REPLACE FUNCTION public.calculate_collected_interest(
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS DECIMAL AS $$
DECLARE
  total_interest DECIMAL := 0;
  loan_record RECORD;
  payment_amount DECIMAL;
  principal_amount DECIMAL;
  interest_amount DECIMAL;
BEGIN
  -- Calculate interest from all paid loans
  FOR loan_record IN 
    SELECT 
      l.id,
      l.amount as loan_amount,
      l.interest_rate,
      l.duration_days,
      l.payment_frequency,
      l.number_of_payments,
      l.approved_at
    FROM public.loans l
    WHERE l.status IN ('active', 'paid')
    AND (start_date IS NULL OR l.approved_at >= start_date)
    AND (end_date IS NULL OR l.approved_at <= end_date)
  LOOP
    -- Get total payments made for this loan
    SELECT COALESCE(SUM(amount), 0) INTO payment_amount
    FROM public.transactions
    WHERE member_id = loan_record.member_id
    AND type = 'payment'
    AND transaction_date >= COALESCE(start_date, loan_record.approved_at)
    AND (end_date IS NULL OR transaction_date <= end_date);
    
    -- Calculate interest portion of payments
    -- Interest = (loan_amount * interest_rate / 100) * (duration_days / 365)
    -- But we need to calculate based on actual payments made
    IF payment_amount > 0 AND loan_record.interest_rate > 0 THEN
      -- Calculate total interest for the loan
      interest_amount := loan_record.loan_amount * (loan_record.interest_rate / 100.0) * 
                         (COALESCE(loan_record.duration_days, 30) / 365.0);
      
      -- Calculate total amount (principal + interest)
      DECLARE
        total_amount DECIMAL;
      BEGIN
        total_amount := loan_record.loan_amount + interest_amount;
        
        -- Calculate interest portion of payments made
        -- Proportion of interest in total
        IF total_amount > 0 THEN
          interest_amount := (payment_amount / total_amount) * interest_amount;
          total_interest := total_interest + interest_amount;
        END IF;
      END;
    END IF;
  END LOOP;
  
  RETURN COALESCE(total_interest, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to distribute interest equally among all active members
CREATE OR REPLACE FUNCTION public.distribute_interest(
  distribution_date_param TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description_param TEXT DEFAULT NULL,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
  distribution_id UUID,
  total_interest DECIMAL,
  number_of_members INTEGER,
  amount_per_member DECIMAL,
  total_distributed DECIMAL
) AS $$
DECLARE
  total_interest_collected DECIMAL;
  active_members_count INTEGER;
  amount_per_member_calc DECIMAL;
  total_distributed_calc DECIMAL;
  distribution_id_result UUID;
  member_record RECORD;
  admin_user_id UUID;
BEGIN
  -- Get admin user
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE id = auth.uid();
  
  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;
  
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = admin_user_id
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can distribute interest';
  END IF;
  
  -- Calculate total interest collected
  SELECT public.calculate_collected_interest(start_date, end_date) INTO total_interest_collected;
  
  -- Count active members
  SELECT COUNT(*) INTO active_members_count
  FROM public.members
  WHERE status = 'active';
  
  IF active_members_count = 0 THEN
    RAISE EXCEPTION 'No active members found';
  END IF;
  
  -- Calculate amount per member
  amount_per_member_calc := total_interest_collected / active_members_count;
  total_distributed_calc := amount_per_member_calc * active_members_count;
  
  -- Create distribution record
  INSERT INTO public.interest_distributions (
    distribution_date,
    total_interest_collected,
    number_of_members,
    amount_per_member,
    total_distributed,
    description,
    created_by
  ) VALUES (
    distribution_date_param,
    total_interest_collected,
    active_members_count,
    amount_per_member_calc,
    total_distributed_calc,
    description_param,
    admin_user_id
  ) RETURNING id INTO distribution_id_result;
  
  -- Distribute to each active member
  FOR member_record IN
    SELECT id FROM public.members WHERE status = 'active'
  LOOP
    -- Create interest transaction for each member
    INSERT INTO public.transactions (
      member_id,
      type,
      amount,
      description,
      transaction_date,
      created_by
    ) VALUES (
      member_record.id,
      'interest',
      amount_per_member_calc,
      COALESCE(description_param, 'Partage des intérêts collectés sur les prêts'),
      distribution_date_param,
      admin_user_id
    );
  END LOOP;
  
  -- Return distribution details
  RETURN QUERY SELECT 
    distribution_id_result,
    total_interest_collected,
    active_members_count,
    amount_per_member_calc,
    total_distributed_calc;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE public.interest_distributions IS 'Historique des distributions d''intérêts aux membres';
COMMENT ON FUNCTION public.calculate_collected_interest IS 'Calcule le total des intérêts collectés sur les prêts';
COMMENT ON FUNCTION public.distribute_interest IS 'Distribue les intérêts collectés équitablement entre tous les membres actifs';




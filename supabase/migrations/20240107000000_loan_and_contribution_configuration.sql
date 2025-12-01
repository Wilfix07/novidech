-- Loan and Contribution Configuration
-- Allows admin to set interest rate, duration, and payment frequency for loans
-- Allows members to choose payment frequency for contributions

-- Create loan configuration table for admin settings
CREATE TABLE IF NOT EXISTS public.loan_config (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  interest_rate DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  default_duration_days INTEGER NOT NULL DEFAULT 30,
  payment_frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (payment_frequency IN ('weekly', 'biweekly', 'monthly')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID REFERENCES auth.users(id)
);

-- Add payment frequency and duration to loans table
ALTER TABLE public.loans 
  ADD COLUMN IF NOT EXISTS payment_frequency TEXT DEFAULT 'monthly' CHECK (payment_frequency IN ('weekly', 'biweekly', 'monthly')),
  ADD COLUMN IF NOT EXISTS duration_days INTEGER,
  ADD COLUMN IF NOT EXISTS number_of_payments INTEGER;

-- Add payment frequency to contributions table
ALTER TABLE public.contributions
  ADD COLUMN IF NOT EXISTS payment_frequency TEXT DEFAULT 'monthly' CHECK (payment_frequency IN ('weekly', 'biweekly', 'monthly'));

-- Enable RLS on loan_config
ALTER TABLE public.loan_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for loan_config
CREATE POLICY "Admins can view loan config"
  ON public.loan_config FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage loan config"
  ON public.loan_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create index
CREATE INDEX IF NOT EXISTS loan_config_active_idx ON public.loan_config(is_active) WHERE is_active = true;

-- Function to calculate loan payment details
CREATE OR REPLACE FUNCTION public.calculate_loan_payments(
  loan_amount DECIMAL,
  interest_rate DECIMAL,
  duration_days INTEGER,
  payment_frequency TEXT
)
RETURNS TABLE (
  number_of_payments INTEGER,
  payment_amount DECIMAL,
  total_interest DECIMAL,
  total_amount DECIMAL
) AS $$
DECLARE
  num_payments INTEGER;
  days_per_payment INTEGER;
  payment_amt DECIMAL;
  total_int DECIMAL;
  total_amt DECIMAL;
BEGIN
  CASE payment_frequency
    WHEN 'weekly' THEN days_per_payment := 7;
    WHEN 'biweekly' THEN days_per_payment := 14;
    WHEN 'monthly' THEN days_per_payment := 30;
    ELSE days_per_payment := 30;
  END CASE;

  num_payments := CEIL(duration_days::DECIMAL / days_per_payment);
  total_int := loan_amount * (interest_rate / 100) * (duration_days / 365.0);
  total_amt := loan_amount + total_int;
  payment_amt := total_amt / num_payments;

  RETURN QUERY SELECT num_payments, payment_amt, total_int, total_amt;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-calculate loan details
CREATE OR REPLACE FUNCTION public.set_loan_details()
RETURNS TRIGGER AS $$
DECLARE
  config_record RECORD;
  calc_result RECORD;
BEGIN
  SELECT * INTO config_record
  FROM public.loan_config
  WHERE is_active = true
  ORDER BY created_at DESC
  LIMIT 1;

  IF config_record IS NULL THEN
    NEW.interest_rate := COALESCE(NEW.interest_rate, 0.00);
    NEW.payment_frequency := COALESCE(NEW.payment_frequency, 'monthly');
    NEW.duration_days := COALESCE(NEW.duration_days, 30);
  ELSE
    NEW.interest_rate := COALESCE(NEW.interest_rate, config_record.interest_rate);
    NEW.payment_frequency := COALESCE(NEW.payment_frequency, config_record.payment_frequency);
    NEW.duration_days := COALESCE(NEW.duration_days, config_record.default_duration_days);
  END IF;

  SELECT * INTO calc_result
  FROM public.calculate_loan_payments(
    NEW.amount,
    NEW.interest_rate,
    NEW.duration_days,
    NEW.payment_frequency
  );

  NEW.number_of_payments := calc_result.number_of_payments;
  
  IF NEW.due_date IS NULL THEN
    NEW.due_date := NOW() + (NEW.duration_days || ' days')::INTERVAL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS set_loan_details_trigger ON public.loans;
CREATE TRIGGER set_loan_details_trigger
  BEFORE INSERT ON public.loans
  FOR EACH ROW
  EXECUTE FUNCTION public.set_loan_details();

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_loan_config_updated_at ON public.loan_config;
CREATE TRIGGER set_loan_config_updated_at
  BEFORE UPDATE ON public.loan_config
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Comments
COMMENT ON TABLE public.loan_config IS 'Configuration des prêts définie par les admins';
COMMENT ON COLUMN public.loans.payment_frequency IS 'Fréquence de paiement : weekly, biweekly, monthly';
COMMENT ON COLUMN public.contributions.payment_frequency IS 'Fréquence de paiement choisie par le membre';




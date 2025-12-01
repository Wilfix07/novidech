-- Loan Payment Schedule Function
-- Generates payment schedule for a loan based on loan details

-- Function to generate payment schedule dates
CREATE OR REPLACE FUNCTION public.generate_loan_schedule(
  loan_id_param UUID,
  start_date TIMESTAMP WITH TIME ZONE,
  payment_frequency_param TEXT,
  number_of_payments_param INTEGER
)
RETURNS TABLE (
  payment_number INTEGER,
  due_date TIMESTAMP WITH TIME ZONE,
  payment_amount DECIMAL,
  status TEXT
) AS $$
DECLARE
  loan_record RECORD;
  payment_amt DECIMAL;
  payment_due_date TIMESTAMP WITH TIME ZONE;
  days_to_add INTEGER;
  payment_num INTEGER;
  payment_status TEXT;
BEGIN
  -- Get loan details
  SELECT 
    l.amount,
    l.interest_rate,
    l.number_of_payments,
    l.payment_frequency,
    l.duration_days
  INTO loan_record
  FROM public.loans l
  WHERE l.id = loan_id_param;

  IF loan_record IS NULL THEN
    RETURN;
  END IF;

  -- Calculate payment amount using existing function
  SELECT payment_amount INTO payment_amt
  FROM public.calculate_loan_payments(
    loan_record.amount,
    loan_record.interest_rate,
    loan_record.duration_days,
    payment_frequency_param
  );

  -- Determine days to add based on frequency
  CASE payment_frequency_param
    WHEN 'weekly' THEN days_to_add := 7;
    WHEN 'biweekly' THEN days_to_add := 14;
    WHEN 'monthly' THEN days_to_add := 30;
    ELSE days_to_add := 30;
  END CASE;

  payment_due_date := start_date;
  payment_num := 1;

  -- Generate schedule
  WHILE payment_num <= number_of_payments_param LOOP
    -- Check if payment was made (by checking transactions)
    SELECT 
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM public.transactions t
          WHERE t.member_id = (SELECT member_id FROM public.loans WHERE id = loan_id_param)
          AND t.type = 'payment'
          AND t.transaction_date >= payment_due_date - (days_to_add || ' days')::INTERVAL
          AND t.transaction_date < payment_due_date + (days_to_add || ' days')::INTERVAL
          AND ABS(t.amount - payment_amt) < 0.01
        ) THEN 'paid'
        WHEN payment_due_date < NOW() THEN 'overdue'
        ELSE 'pending'
      END
    INTO payment_status;

    RETURN QUERY SELECT payment_num, payment_due_date, payment_amt, payment_status;

    payment_due_date := payment_due_date + (days_to_add || ' days')::INTERVAL;
    payment_num := payment_num + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get next payment date for a loan
CREATE OR REPLACE FUNCTION public.get_next_payment_date(
  loan_id_param UUID
)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
  loan_record RECORD;
  next_payment_date TIMESTAMP WITH TIME ZONE;
  days_to_add INTEGER;
  payment_num INTEGER;
  payment_due_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get loan details
  SELECT 
    l.approved_at,
    l.payment_frequency,
    l.number_of_payments,
    l.due_date
  INTO loan_record
  FROM public.loans l
  WHERE l.id = loan_id_param
  AND l.status = 'active';

  IF loan_record IS NULL OR loan_record.approved_at IS NULL THEN
    RETURN NULL;
  END IF;

  -- Determine days to add based on frequency
  CASE loan_record.payment_frequency
    WHEN 'weekly' THEN days_to_add := 7;
    WHEN 'biweekly' THEN days_to_add := 14;
    WHEN 'monthly' THEN days_to_add := 30;
    ELSE days_to_add := 30;
  END CASE;

  payment_due_date := loan_record.approved_at;
  payment_num := 1;

  -- Find next unpaid payment
  WHILE payment_num <= COALESCE(loan_record.number_of_payments, 1) LOOP
    -- Check if this payment was made
    IF NOT EXISTS (
      SELECT 1 FROM public.transactions t
      WHERE t.member_id = (SELECT member_id FROM public.loans WHERE id = loan_id_param)
      AND t.type = 'payment'
      AND t.transaction_date >= payment_due_date - (days_to_add || ' days')::INTERVAL
      AND t.transaction_date < payment_due_date + (days_to_add || ' days')::INTERVAL
    ) THEN
      -- This payment hasn't been made yet
      RETURN payment_due_date;
    END IF;

    payment_due_date := payment_due_date + (days_to_add || ' days')::INTERVAL;
    payment_num := payment_num + 1;
  END LOOP;

  -- All payments made
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON FUNCTION public.generate_loan_schedule IS 'Génère l''échéancier complet d''un prêt avec les dates et statuts de paiement';
COMMENT ON FUNCTION public.get_next_payment_date IS 'Retourne la date du prochain paiement pour un prêt actif';


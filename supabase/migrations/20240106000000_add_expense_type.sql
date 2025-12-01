-- Add 'expense' type to transactions for tellers to record expenses
-- This allows tellers to record organizational expenses separately from member withdrawals

-- Drop the existing constraint
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;

-- Add new constraint with 'expense' type included
ALTER TABLE public.transactions ADD CONSTRAINT transactions_type_check 
  CHECK (type IN ('contribution', 'loan', 'payment', 'withdrawal', 'interest', 'expense'));

-- Add documentation
COMMENT ON COLUMN public.transactions.type IS 
'Transaction type: contribution (member contribution), loan (loan transaction), payment (loan payment), withdrawal (member withdrawal), interest (interest payment), expense (organization expense)';

-- Note: Tellers can already insert transactions via existing RLS policy
-- "Tellers can insert transactions" policy covers all transaction types including expenses


-- Allow members to view all overdue loans in the mutuelle
-- Overdue loans are defined as loans with status 'active' and due_date < NOW()

-- RLS Policy for members to view all overdue loans
CREATE POLICY "Members can view all overdue loans"
  ON public.loans FOR SELECT
  USING (
    -- Loan must be overdue (active status and past due date)
    status = 'active' 
    AND due_date IS NOT NULL 
    AND due_date < NOW()
    -- User must be a member (not admin or teller)
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'member'
    )
  );

-- Add index for better query performance on overdue loans
CREATE INDEX IF NOT EXISTS loans_overdue_idx ON public.loans(status, due_date) 
  WHERE status = 'active' AND due_date IS NOT NULL;

-- Comment
COMMENT ON POLICY "Members can view all overdue loans" ON public.loans IS 
  'Permet aux membres de voir tous les prêts en retard de la mutuelle pour transparence';



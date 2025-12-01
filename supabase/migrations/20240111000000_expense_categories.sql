-- Expense Categories Management
-- Allows admin to create and manage expense categories
-- Allows tellers to categorize expenses when recording them

-- Create expense categories table
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#6366f1', -- Default color for display
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID REFERENCES auth.users(id)
);

-- Add category_id to transactions table for expenses
ALTER TABLE public.transactions 
  ADD COLUMN IF NOT EXISTS expense_category_id UUID REFERENCES public.expense_categories(id) ON DELETE SET NULL;

-- Enable Row Level Security
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for expense_categories
CREATE POLICY "Everyone can view active expense categories"
  ON public.expense_categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can view all expense categories"
  ON public.expense_categories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage expense categories"
  ON public.expense_categories FOR ALL
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

-- Create indexes
CREATE INDEX IF NOT EXISTS expense_categories_active_idx ON public.expense_categories(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS transactions_expense_category_idx ON public.transactions(expense_category_id) WHERE expense_category_id IS NOT NULL;

-- Create trigger for updated_at on expense_categories
DROP TRIGGER IF EXISTS set_expense_categories_updated_at ON public.expense_categories;
CREATE TRIGGER set_expense_categories_updated_at
  BEFORE UPDATE ON public.expense_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert default categories
INSERT INTO public.expense_categories (name, description, color) VALUES
  ('Bureau', 'Dépenses de bureau et fournitures', '#3b82f6'),
  ('Services', 'Services externes (électricité, eau, internet, etc.)', '#10b981'),
  ('Marketing', 'Dépenses de marketing et publicité', '#f59e0b'),
  ('Maintenance', 'Maintenance et réparations', '#ef4444'),
  ('Formation', 'Formation et développement', '#8b5cf6'),
  ('Autres', 'Autres dépenses', '#6b7280')
ON CONFLICT (name) DO NOTHING;

-- Comments
COMMENT ON TABLE public.expense_categories IS 'Catégories de dépenses définies par l''admin';
COMMENT ON COLUMN public.transactions.expense_category_id IS 'Catégorie de la dépense (uniquement pour les transactions de type expense)';



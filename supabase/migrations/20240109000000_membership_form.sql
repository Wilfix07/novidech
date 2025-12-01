-- Membership Form Configuration and Submissions
-- Allows admin to configure a membership form that new members must complete

-- Table for form configuration (admin-defined fields)
CREATE TABLE IF NOT EXISTS public.membership_form_config (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  is_active BOOLEAN DEFAULT false,
  title TEXT NOT NULL DEFAULT 'Formulaire d''Adhésion',
  description TEXT,
  fields JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of field definitions
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID REFERENCES auth.users(id)
);

-- Table for member form submissions
CREATE TABLE IF NOT EXISTS public.membership_form_submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  form_config_id UUID REFERENCES public.membership_form_config(id) ON DELETE SET NULL,
  responses JSONB NOT NULL DEFAULT '{}'::jsonb, -- User responses to form fields
  signature_data TEXT, -- Base64 encoded signature image
  signature_timestamp TIMESTAMP WITH TIME ZONE,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rejected')),
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(member_id) -- One submission per member
);

-- Add form_completed field to members table
ALTER TABLE public.members 
  ADD COLUMN IF NOT EXISTS form_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS form_submission_id UUID REFERENCES public.membership_form_submissions(id) ON DELETE SET NULL;

-- Enable Row Level Security
ALTER TABLE public.membership_form_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_form_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for membership_form_config
CREATE POLICY "Admins can view form config"
  ON public.membership_form_config FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage form config"
  ON public.membership_form_config FOR ALL
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

CREATE POLICY "Members can view active form config"
  ON public.membership_form_config FOR SELECT
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'member'
    )
  );

-- RLS Policies for membership_form_submissions
CREATE POLICY "Members can view own submission"
  ON public.membership_form_submissions FOR SELECT
  USING (
    profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.members
      WHERE members.id = membership_form_submissions.member_id
      AND members.profile_id = auth.uid()
    )
  );

CREATE POLICY "Members can insert own submission"
  ON public.membership_form_submissions FOR INSERT
  WITH CHECK (
    profile_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.members
      WHERE members.id = membership_form_submissions.member_id
      AND members.profile_id = auth.uid()
    )
  );

CREATE POLICY "Members can update own submission"
  ON public.membership_form_submissions FOR UPDATE
  USING (
    profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.members
      WHERE members.id = membership_form_submissions.member_id
      AND members.profile_id = auth.uid()
    )
  )
  WITH CHECK (
    profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.members
      WHERE members.id = membership_form_submissions.member_id
      AND members.profile_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all submissions"
  ON public.membership_form_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all submissions"
  ON public.membership_form_submissions FOR ALL
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
CREATE INDEX IF NOT EXISTS membership_form_config_active_idx ON public.membership_form_config(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS membership_form_submissions_member_id_idx ON public.membership_form_submissions(member_id);
CREATE INDEX IF NOT EXISTS membership_form_submissions_profile_id_idx ON public.membership_form_submissions(profile_id);
CREATE INDEX IF NOT EXISTS membership_form_submissions_status_idx ON public.membership_form_submissions(status);
CREATE INDEX IF NOT EXISTS members_form_completed_idx ON public.members(form_completed) WHERE form_completed = false;

-- Create trigger for updated_at on membership_form_config
DROP TRIGGER IF EXISTS set_membership_form_config_updated_at ON public.membership_form_config;
CREATE TRIGGER set_membership_form_config_updated_at
  BEFORE UPDATE ON public.membership_form_config
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create trigger for updated_at on membership_form_submissions
DROP TRIGGER IF EXISTS set_membership_form_submissions_updated_at ON public.membership_form_submissions;
CREATE TRIGGER set_membership_form_submissions_updated_at
  BEFORE UPDATE ON public.membership_form_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to update member form_completed status when submission is completed
CREATE OR REPLACE FUNCTION public.update_member_form_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE public.members
    SET form_completed = true,
        form_submission_id = NEW.id
    WHERE id = NEW.member_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update member form_completed status
DROP TRIGGER IF EXISTS update_member_form_status_trigger ON public.membership_form_submissions;
CREATE TRIGGER update_member_form_status_trigger
  AFTER UPDATE ON public.membership_form_submissions
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION public.update_member_form_status();

-- Comments
COMMENT ON TABLE public.membership_form_config IS 'Configuration du formulaire d''adhésion défini par l''admin';
COMMENT ON TABLE public.membership_form_submissions IS 'Soumissions du formulaire d''adhésion par les membres';
COMMENT ON COLUMN public.membership_form_config.fields IS 'Tableau JSON des définitions de champs du formulaire';
COMMENT ON COLUMN public.membership_form_submissions.responses IS 'Réponses JSON du membre aux champs du formulaire';
COMMENT ON COLUMN public.membership_form_submissions.signature_data IS 'Image de signature encodée en Base64';
COMMENT ON COLUMN public.members.form_completed IS 'Indique si le membre a complété le formulaire d''adhésion';


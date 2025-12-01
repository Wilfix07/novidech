-- ============================================
-- Initialiser la Configuration des Prêts
-- ============================================
-- Ce script crée une configuration par défaut pour les prêts
-- À exécuter par un admin après la migration
-- ============================================

-- Vérifier que vous êtes admin
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Seuls les admins peuvent créer une configuration';
  END IF;
END $$;

-- Créer la configuration par défaut
INSERT INTO public.loan_config (
  interest_rate,
  default_duration_days,
  payment_frequency,
  is_active,
  created_by
)
VALUES (
  5.00,        -- 5% d'intérêt annuel par défaut
  60,          -- 60 jours de durée par défaut
  'monthly',   -- Paiement mensuel par défaut
  true,
  auth.uid()
)
RETURNING *;

-- ============================================
-- Exemples de Configurations
-- ============================================

-- Configuration pour prêts courts (30 jours, hebdomadaire)
-- INSERT INTO public.loan_config (
--   interest_rate, default_duration_days, payment_frequency, is_active, created_by
-- ) VALUES (3.00, 30, 'weekly', true, auth.uid());

-- Configuration pour prêts moyens (60 jours, bi-hebdomadaire)
-- INSERT INTO public.loan_config (
--   interest_rate, default_duration_days, payment_frequency, is_active, created_by
-- ) VALUES (4.00, 60, 'biweekly', true, auth.uid());

-- Configuration pour prêts longs (90 jours, mensuel)
-- INSERT INTO public.loan_config (
--   interest_rate, default_duration_days, payment_frequency, is_active, created_by
-- ) VALUES (5.00, 90, 'monthly', true, auth.uid());




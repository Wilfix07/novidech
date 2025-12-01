-- ============================================
-- Test de Génération d'ID de Membre
-- ============================================
-- Ce script teste la génération automatique d'ID
-- Format: 0000-MOIS (ex: 0001-NOV, 0002-DEC)
-- ============================================

-- Test 1: Voir le prochain ID qui sera généré
SELECT 
  'Prochain ID à générer' as test,
  LPAD(
    (COALESCE(MAX(CAST(SUBSTRING(member_id FROM '^([0-9]+)') AS INTEGER)), 0) + 1)::TEXT,
    4,
    '0'
  ) || '-' || 
  CASE EXTRACT(MONTH FROM NOW())
    WHEN 1 THEN 'JAN' WHEN 2 THEN 'FEV' WHEN 3 THEN 'MAR' WHEN 4 THEN 'AVR'
    WHEN 5 THEN 'MAI' WHEN 6 THEN 'JUN' WHEN 7 THEN 'JUL' WHEN 8 THEN 'AOU'
    WHEN 9 THEN 'SEP' WHEN 10 THEN 'OCT' WHEN 11 THEN 'NOV' WHEN 12 THEN 'DEC'
  END as result
FROM public.members
WHERE member_id LIKE '%-' || 
  CASE EXTRACT(MONTH FROM NOW())
    WHEN 1 THEN 'JAN' WHEN 2 THEN 'FEV' WHEN 3 THEN 'MAR' WHEN 4 THEN 'AVR'
    WHEN 5 THEN 'MAI' WHEN 6 THEN 'JUN' WHEN 7 THEN 'JUL' WHEN 8 THEN 'AOU'
    WHEN 9 THEN 'SEP' WHEN 10 THEN 'OCT' WHEN 11 THEN 'NOV' WHEN 12 THEN 'DEC'
  END
  AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW())
  AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());

-- Test 2: Voir tous les membres créés ce mois avec leur ID
SELECT 
  member_id,
  full_name,
  TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') as date_creation
FROM public.members
WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW())
  AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
ORDER BY member_id;

-- Test 3: Statistiques par mois
SELECT 
  TO_CHAR(created_at, 'YYYY-MM') as mois,
  CASE EXTRACT(MONTH FROM created_at)
    WHEN 1 THEN 'Janvier' WHEN 2 THEN 'Février' WHEN 3 THEN 'Mars' WHEN 4 THEN 'Avril'
    WHEN 5 THEN 'Mai' WHEN 6 THEN 'Juin' WHEN 7 THEN 'Juillet' WHEN 8 THEN 'Août'
    WHEN 9 THEN 'Septembre' WHEN 10 THEN 'Octobre' WHEN 11 THEN 'Novembre' WHEN 12 THEN 'Décembre'
  END as mois_nom,
  COUNT(*) as total_membres,
  MIN(member_id) as premier_id,
  MAX(member_id) as dernier_id
FROM public.members
WHERE member_id ~ '^[0-9]{4}-[A-Z]{3}$' -- Format automatique uniquement
GROUP BY TO_CHAR(created_at, 'YYYY-MM'), EXTRACT(MONTH FROM created_at)
ORDER BY mois DESC;

-- ============================================
-- Exemple d'insertion (nécessite un profile_id valide)
-- ============================================
-- Pour tester la génération automatique, décommentez et remplacez le profile_id :
/*
INSERT INTO public.members (profile_id, full_name, phone, address)
VALUES (
  'VOTRE_PROFILE_ID_ICI', -- Remplacez par un UUID valide de auth.users
  'Test Membre',
  '+50912345678',
  'Adresse de test'
) RETURNING member_id, full_name, created_at;
-- Le member_id sera généré automatiquement au format 0000-MOIS
*/


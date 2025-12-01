-- Script pour créer un membre de test
-- Utilisez ce script si vous voulez créer un membre pour un profil existant

-- Option 1 : Créer un membre pour un profil existant (admin ou teller)
-- Remplacez 'PROFILE_UUID_HERE' par l'UUID du profil
-- SELECT public.create_member_for_profile(
--   'PROFILE_UUID_HERE',  -- UUID du profil
--   'Nom du Membre',      -- Nom complet
--   '+50912345678',       -- Téléphone (optionnel)
--   'Adresse'             -- Adresse (optionnel)
-- );

-- Option 2 : Créer un nouvel utilisateur avec le rôle 'member'
-- 1. Créez d'abord l'utilisateur via l'interface d'inscription
-- 2. Approuvez-le via la page admin "Approbation Utilisateurs"
-- 3. Le trigger créera automatiquement un membre

-- Option 3 : Changer le rôle d'un utilisateur existant en 'member' et l'approuver
-- Remplacez 'PROFILE_UUID_HERE' par l'UUID du profil
-- UPDATE public.profiles
-- SET 
--   role = 'member',
--   approved = true
-- WHERE id = 'PROFILE_UUID_HERE';
-- Le trigger créera automatiquement un membre

-- Vérifier les membres créés
SELECT 
  m.id,
  m.member_id,
  m.full_name,
  m.status,
  p.email,
  p.role,
  p.approved
FROM public.members m
JOIN public.profiles p ON p.id = m.profile_id
ORDER BY m.created_at DESC;



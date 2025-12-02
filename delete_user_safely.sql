-- Script de suppression sécurisée d'un utilisateur
-- Utilisation: Remplacez '250000201@members.tikredi.ht' par l'email de l'utilisateur à supprimer

-- ============================================
-- ÉTAPE 1: Vérifier l'utilisateur et ses données
-- ============================================
DO $$
DECLARE
    user_id_to_delete UUID;
    user_email TEXT := '250000201@members.tikredi.ht'; -- ⚠️ MODIFIER ICI
    transaction_count INT;
    loan_count INT;
    member_count INT;
BEGIN
    -- Trouver l'ID de l'utilisateur
    SELECT id INTO user_id_to_delete
    FROM auth.users
    WHERE email = user_email;
    
    IF user_id_to_delete IS NULL THEN
        RAISE EXCEPTION 'Utilisateur non trouvé: %', user_email;
    END IF;
    
    -- Compter les données liées
    SELECT COUNT(*) INTO transaction_count
    FROM public.transactions
    WHERE created_by = user_id_to_delete;
    
    SELECT COUNT(*) INTO loan_count
    FROM public.loans
    WHERE approved_by = user_id_to_delete;
    
    SELECT COUNT(*) INTO member_count
    FROM public.members
    WHERE profile_id = user_id_to_delete;
    
    -- Afficher les informations
    RAISE NOTICE '========================================';
    RAISE NOTICE 'INFORMATIONS UTILISATEUR';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'ID: %', user_id_to_delete;
    RAISE NOTICE 'Email: %', user_email;
    RAISE NOTICE 'Transactions créées: %', transaction_count;
    RAISE NOTICE 'Prêts approuvés: %', loan_count;
    RAISE NOTICE 'Membres associés: %', member_count;
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  ATTENTION: La suppression est PERMANENTE!';
    RAISE NOTICE 'Les transactions créées seront préservées (created_by = NULL)';
    RAISE NOTICE 'Les prêts approuvés seront préservés (approved_by = NULL)';
    RAISE NOTICE 'Les membres associés seront supprimés (CASCADE)';
    RAISE NOTICE '';
    RAISE NOTICE 'Pour procéder à la suppression, décommentez la section ci-dessous';
    RAISE NOTICE 'et exécutez ce script à nouveau.';
    
END $$;

-- ============================================
-- ÉTAPE 2: Supprimer l'utilisateur (DÉCOMMENTEZ POUR EXÉCUTER)
-- ============================================
-- ⚠️ DÉCOMMENTEZ LES LIGNES CI-DESSOUS POUR SUPPRIMER L'UTILISATEUR
-- ⚠️ CETTE ACTION EST IRRÉVERSIBLE!

/*
DO $$
DECLARE
    user_id_to_delete UUID;
    user_email TEXT := '250000201@members.tikredi.ht'; -- ⚠️ MODIFIER ICI
BEGIN
    -- Trouver l'ID de l'utilisateur
    SELECT id INTO user_id_to_delete
    FROM auth.users
    WHERE email = user_email;
    
    IF user_id_to_delete IS NULL THEN
        RAISE EXCEPTION 'Utilisateur non trouvé: %', user_email;
    END IF;
    
    -- Supprimer l'utilisateur (cela supprimera automatiquement):
    -- - Le profil (profiles) via CASCADE
    -- - Les membres associés (members) via CASCADE
    -- - Les sessions, identités, etc. via CASCADE
    -- Les transactions et prêts seront préservés avec created_by/approved_by = NULL
    
    DELETE FROM auth.users
    WHERE id = user_id_to_delete;
    
    RAISE NOTICE '✅ Utilisateur supprimé avec succès: %', user_email;
    
END $$;
*/


-- Migration script to update existing users to use technical email system
-- This script updates users who were created with normal emails to use technical emails
-- based on their member_id

-- Step 1: Update auth.users to use technical email format for members
-- This requires admin access to auth.users table

-- For each member, update their auth.users email to technical email format
DO $$
DECLARE
    member_record RECORD;
    clean_member_id TEXT;
    technical_email TEXT;
BEGIN
    -- Loop through all members that have a profile_id
    FOR member_record IN 
        SELECT m.member_id, m.profile_id, u.email as current_email
        FROM public.members m
        INNER JOIN auth.users u ON m.profile_id = u.id
        WHERE u.email NOT LIKE '%@members.tikredi.ht'
    LOOP
        -- Clean member ID (remove hyphens)
        clean_member_id := REPLACE(member_record.member_id, '-', '');
        
        -- Create technical email
        technical_email := clean_member_id || '@members.tikredi.ht';
        
        -- Update auth.users email and metadata
        UPDATE auth.users
        SET 
            email = technical_email,
            raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
                jsonb_build_object(
                    'true_email', member_record.current_email,
                    'member_id', clean_member_id
                )
        WHERE id = member_record.profile_id;
        
        RAISE NOTICE 'Updated user % from % to %', member_record.profile_id, member_record.current_email, technical_email;
    END LOOP;
END $$;

-- Step 2: Verify the migration
SELECT 
    m.member_id,
    u.email as technical_email,
    u.raw_user_meta_data->>'true_email' as real_email,
    u.raw_user_meta_data->>'member_id' as metadata_member_id
FROM public.members m
INNER JOIN auth.users u ON m.profile_id = u.id
ORDER BY m.created_at DESC;


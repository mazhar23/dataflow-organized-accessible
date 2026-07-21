-- Add willsmiths987@gmail.com as admin
-- This migration sets the role to 'admin' for the specified user

DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Find the user ID by email
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = 'willsmiths987@gmail.com';

    -- If user exists, update their profile to admin
    IF target_user_id IS NOT NULL THEN
        UPDATE public.profiles
        SET role = 'admin'
        WHERE user_id = target_user_id;

        RAISE NOTICE 'User willsmiths987@gmail.com has been set as admin';
    ELSE
        RAISE NOTICE 'User willsmiths987@gmail.com not found in auth.users';
    END IF;
END $$;

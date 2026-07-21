-- Quick script to add willsmiths987@gmail.com as admin
-- Run this in the Supabase SQL Editor

-- Find the user and update their role to admin
UPDATE public.profiles
SET role = 'admin'
WHERE user_id = (
    SELECT id 
    FROM auth.users 
    WHERE email = 'willsmiths987@gmail.com'
);

-- Verify the change
SELECT 
    p.name,
    p.email,
    p.role,
    u.email as auth_email
FROM public.profiles p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email = 'willsmiths987@gmail.com';

-- Fix User Visibility and Ensure Admin Access
-- Run this in your Supabase SQL Editor.

-- 1. Create/Update the checking function (Security Definer is crucial to bypass RLS)
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the user has the 'admin' role in the users table
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. reset policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can view own profile and admins can view all" ON users;
DROP POLICY IF EXISTS "Allow Read" ON users;

-- 3. Create the new policy
-- Allows users to see their own profile
-- Allows admins (checked via function) to see ALL profiles
CREATE POLICY "Enable access for users and admins" ON users 
FOR SELECT USING (
  auth.uid() = id OR is_admin() 
);

-- 4. (Optional) Run this line to force your specific user to be an admin if not already
-- Replace 'your-email@example.com' with your actual email if needed, 
-- or just rely on the existing data if you are sure you have 'admin' role.
-- UPDATE users SET role = 'admin' WHERE email = 'YOUR_EMAIL_HERE';

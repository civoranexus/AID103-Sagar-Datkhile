-- RUN THIS SCRIPT IN SUPABASE SQL EDITOR TO FIX THE BAN SYSTEM

-- 1. Ensure 'status' column exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'status') THEN 
        ALTER TABLE users ADD COLUMN status TEXT CHECK (status IN ('active', 'banned')) DEFAULT 'active'; 
    END IF; 
END $$;

-- 2. Create helper function to check if user is admin (Security Definer bypasses RLS)
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update Policies for VIEWING users
DROP POLICY IF EXISTS "Enable access for users and admins" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can view own profile and admins can view all" ON users;

CREATE POLICY "Enable access to view users" ON users 
FOR SELECT USING (
  auth.uid() = id OR is_admin() 
);

-- 4. Update Policies for BANNING users (Updating status)
DROP POLICY IF EXISTS "Admins can update user status" ON users;

CREATE POLICY "Admins can update user status" ON users 
FOR UPDATE 
USING (is_admin())
WITH CHECK (is_admin());

-- 4. Update Policies for DELETING users (Optional but good for management)
DROP POLICY IF EXISTS "Admins can delete users" ON users;

CREATE POLICY "Admins can delete users" ON users 
FOR DELETE 
USING (is_admin());

-- 5. (Crucial) Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

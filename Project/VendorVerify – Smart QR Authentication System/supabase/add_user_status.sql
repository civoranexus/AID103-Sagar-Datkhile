-- Add status column to users table for ban functionality
ALTER TABLE users 
ADD COLUMN status TEXT CHECK (status IN ('active', 'banned')) DEFAULT 'active';

-- Allow admins to update user status
CREATE POLICY "Admins can update user status" ON users 
FOR UPDATE 
USING (is_admin())
WITH CHECK (is_admin());

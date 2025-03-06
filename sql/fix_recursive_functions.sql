
-- Fix potential recursion issues in user_platform_roles queries

-- First, create a security definer function to safely check platform roles
-- This will prevent infinite recursion in RLS policies
CREATE OR REPLACE FUNCTION public.get_current_user_platform_role()
RETURNS platform_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role 
  FROM public.user_platform_roles 
  WHERE user_id = auth.uid() 
  LIMIT 1;
$$;

-- Create a function to check platform role without recursion
CREATE OR REPLACE FUNCTION public.has_platform_role_safe(required_role platform_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_platform_roles
    WHERE user_id = auth.uid()
    AND (
      role = required_role 
      OR (required_role = 'user' AND (role = 'super_admin' OR role = 'staff')) -- Super admins and staff are also users
      OR (required_role = 'staff' AND role = 'super_admin') -- Super admins are also staff
    )
  );
END;
$$;

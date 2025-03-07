
-- Fix potential recursion issues in user_platform_roles queries

-- First, create a security definer function to safely check platform roles
-- This will prevent infinite recursion in RLS policies
CREATE OR REPLACE FUNCTION public.get_user_platform_role_direct(user_uuid uuid)
RETURNS platform_role
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT role 
  FROM public.user_platform_roles 
  WHERE user_id = user_uuid
  LIMIT 1;
$$;

-- Create a function to check platform role without recursion
CREATE OR REPLACE FUNCTION public.has_platform_role_safe(required_role platform_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role platform_role;
BEGIN
  -- Get the user's role directly without going through RLS
  user_role := public.get_user_platform_role_direct(auth.uid());
  
  -- Return true if the user has the required role or higher
  RETURN 
    user_role = required_role OR
    (required_role = 'user' AND (user_role = 'super_admin' OR user_role = 'staff')) OR
    (required_role = 'staff' AND user_role = 'super_admin');
END;
$$;

-- Make sure RLS is enabled on the user_platform_roles table
ALTER TABLE public.user_platform_roles ENABLE ROW LEVEL SECURITY;

-- Create policies using the safe functions
CREATE POLICY "Users can view their own roles"
ON public.user_platform_roles
FOR SELECT
USING (auth.uid() = user_id OR has_platform_role_safe('staff'));

CREATE POLICY "Only super_admins can manage roles"
ON public.user_platform_roles
FOR ALL
USING (has_platform_role_safe('super_admin'))
WITH CHECK (has_platform_role_safe('super_admin'));

-- Enable RLS on organizations_data_uploads
ALTER TABLE public.organizations_data_uploads ENABLE ROW LEVEL SECURITY;

-- Allow super_admins and staff to manage uploads
CREATE POLICY "Super admins can manage uploads"
ON public.organizations_data_uploads
FOR ALL
USING (has_platform_role_safe('staff'))
WITH CHECK (has_platform_role_safe('staff'));

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE redeemed_perks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_platform_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;

-- Profiles table policies
-- Users can read their own profile
CREATE POLICY "Users can read own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Users can insert their own profile (on signup)
CREATE POLICY "Users can insert own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Staff can read all profiles
CREATE POLICY "Staff can read all profiles" 
ON profiles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_platform_roles
    WHERE user_id = auth.uid() 
    AND (role = 'staff' OR role = 'super_admin')
  )
);

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles" 
ON profiles FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM user_platform_roles
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Redeemed perks policies
-- Users can read their own redeemed perks
CREATE POLICY "Users can read own redeemed perks" 
ON redeemed_perks FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own redeemed perks
CREATE POLICY "Users can insert own redeemed perks" 
ON redeemed_perks FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Staff can read all redeemed perks
CREATE POLICY "Staff can read all redeemed perks" 
ON redeemed_perks FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_platform_roles
    WHERE user_id = auth.uid() 
    AND (role = 'staff' OR role = 'super_admin')
  )
);

-- Course enrollments policies
-- Users can read their own enrollments
CREATE POLICY "Users can read own enrollments" 
ON course_enrollments FOR SELECT 
USING (auth.uid() = user_id);

-- Users can enroll themselves
CREATE POLICY "Users can enroll themselves" 
ON course_enrollments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Staff can read all enrollments
CREATE POLICY "Staff can read all enrollments" 
ON course_enrollments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_platform_roles
    WHERE user_id = auth.uid() 
    AND (role = 'staff' OR role = 'super_admin')
  )
);

-- Staff can manage enrollments
CREATE POLICY "Staff can manage enrollments" 
ON course_enrollments FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_platform_roles
    WHERE user_id = auth.uid() 
    AND (role = 'staff' OR role = 'super_admin')
  )
);

-- Audit logs policies
-- Users can read their own audit logs
CREATE POLICY "Users can read own audit logs" 
ON audit_logs FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own audit logs
CREATE POLICY "Users can insert own audit logs" 
ON audit_logs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Staff can read all audit logs
CREATE POLICY "Staff can read all audit logs" 
ON audit_logs FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_platform_roles
    WHERE user_id = auth.uid() 
    AND (role = 'staff' OR role = 'super_admin')
  )
);

-- Tiers and milestones are readable by all authenticated users
CREATE POLICY "Authenticated users can read tiers" 
ON tiers FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read milestones" 
ON milestones FOR SELECT 
USING (auth.role() = 'authenticated');

-- Only admins can manage tiers and milestones
CREATE POLICY "Admins can manage tiers" 
ON tiers FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_platform_roles
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

CREATE POLICY "Admins can manage milestones" 
ON milestones FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_platform_roles
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Storage bucket policies
-- Create policies for the avatars bucket
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Users can upload their own avatar
CREATE POLICY "Users can upload their own avatar" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own avatar
CREATE POLICY "Users can update their own avatar" 
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own avatar
CREATE POLICY "Users can delete their own avatar" 
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Staff can manage all avatars
CREATE POLICY "Staff can manage all avatars" 
ON storage.objects FOR ALL
USING (
  bucket_id = 'avatars' AND
  EXISTS (
    SELECT 1 FROM user_platform_roles
    WHERE user_id = auth.uid() 
    AND (role = 'staff' OR role = 'super_admin')
  )
); 
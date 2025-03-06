
-- Set REPLICA IDENTITY FULL for tables we want to track with realtime
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.tiers REPLICA IDENTITY FULL;
ALTER TABLE public.milestones REPLICA IDENTITY FULL;
ALTER TABLE public.redeemed_perks REPLICA IDENTITY FULL;

-- Create publication for realtime updates if it doesn't exist
CREATE PUBLICATION IF NOT EXISTS supabase_realtime 
FOR TABLE public.profiles, public.tiers, public.milestones, public.redeemed_perks;

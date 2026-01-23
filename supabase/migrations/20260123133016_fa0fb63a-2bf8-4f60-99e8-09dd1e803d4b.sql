-- Add country and currency columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS country text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD';
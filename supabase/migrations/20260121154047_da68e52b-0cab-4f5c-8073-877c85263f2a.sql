-- Site settings table for admin customization
CREATE TABLE public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings (for rendering)
CREATE POLICY "Anyone can view site settings"
ON public.site_settings
FOR SELECT
USING (true);

-- Only admins can update settings
CREATE POLICY "Admins can manage site settings"
ON public.site_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default settings
INSERT INTO public.site_settings (setting_key, setting_value) VALUES
('theme', '{"primaryColor": "142 76% 36%", "accentColor": "142 76% 36%", "backgroundColor": "0 0% 100%"}'::jsonb),
('navbar', '{"links": [{"label": "Home", "url": "/"}, {"label": "About", "url": "/about"}, {"label": "Contact", "url": "/contact"}]}'::jsonb),
('footer', '{"companyName": "GrowShare", "description": "Connecting farmers with conscious consumers", "contactEmail": "support@growshare.com", "contactPhone": "+91 123-456-7890", "socialLinks": []}'::jsonb);

-- Farmer-Admin messages table
CREATE TABLE public.admin_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id UUID NOT NULL REFERENCES public.farmer_profiles(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('farmer', 'admin')),
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  attachments TEXT[] DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;

-- Farmers can view messages for their profile
CREATE POLICY "Farmers can view their messages"
ON public.admin_messages
FOR SELECT
USING (farmer_id IN (
  SELECT id FROM public.farmer_profiles WHERE user_id = auth.uid()
));

-- Farmers can send messages
CREATE POLICY "Farmers can send messages"
ON public.admin_messages
FOR INSERT
WITH CHECK (
  sender_type = 'farmer' AND
  farmer_id IN (SELECT id FROM public.farmer_profiles WHERE user_id = auth.uid())
);

-- Admins can view all messages
CREATE POLICY "Admins can view all messages"
ON public.admin_messages
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can send messages
CREATE POLICY "Admins can send messages"
ON public.admin_messages
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) AND sender_type = 'admin'
);

-- Admins can update messages (mark as read)
CREATE POLICY "Admins can update messages"
ON public.admin_messages
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for verification documents
INSERT INTO storage.buckets (id, name, public) VALUES ('verification-docs', 'verification-docs', false);

-- Storage policies for verification documents
CREATE POLICY "Farmers can upload verification docs"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'verification-docs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Farmers can view their own docs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'verification-docs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all verification docs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'verification-docs' AND
  has_role(auth.uid(), 'admin'::app_role)
);

-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'farmer', 'user');

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create farmer_profiles table
CREATE TABLE public.farmer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  farm_name TEXT NOT NULL,
  farm_description TEXT,
  location TEXT NOT NULL,
  experience_years INTEGER DEFAULT 0,
  specializations TEXT[],
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  verification_notes TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create land_listings table
CREATE TABLE public.land_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES public.farmer_profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  total_size_sqft DECIMAL NOT NULL,
  available_size_sqft DECIMAL NOT NULL,
  price_per_sqft DECIMAL NOT NULL,
  supported_vegetables TEXT[] NOT NULL,
  soil_type TEXT,
  water_source TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  images TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vegetable_orders table
CREATE TABLE public.vegetable_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  land_listing_id UUID REFERENCES public.land_listings(id) ON DELETE CASCADE NOT NULL,
  farmer_id UUID REFERENCES public.farmer_profiles(id) ON DELETE CASCADE NOT NULL,
  vegetable_name TEXT NOT NULL,
  land_size_sqft DECIMAL NOT NULL,
  planting_instructions TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'planted', 'growing', 'ready_to_harvest', 'harvested', 'delivered', 'cancelled')),
  total_price DECIMAL NOT NULL,
  advance_amount DECIMAL NOT NULL,
  final_amount DECIMAL NOT NULL,
  expected_harvest_date DATE,
  actual_harvest_date DATE,
  delivery_address TEXT,
  delivery_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.vegetable_orders(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('advance', 'final')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method TEXT,
  transaction_id TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create growth_status table
CREATE TABLE public.growth_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.vegetable_orders(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL,
  notes TEXT,
  images TEXT[],
  recorded_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.land_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vegetable_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_status ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Create function to check if user is first (becomes admin)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INTEGER;
  selected_role app_role;
BEGIN
  -- Count existing users
  SELECT COUNT(*) INTO user_count FROM public.user_roles;
  
  -- First user becomes admin, otherwise check metadata for role selection
  IF user_count = 0 THEN
    selected_role := 'admin';
  ELSE
    -- Get role from user metadata, default to 'user'
    selected_role := COALESCE(
      (NEW.raw_user_meta_data->>'role')::app_role,
      'user'
    );
  END IF;
  
  -- Insert role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, selected_role);
  
  -- Create profile
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  
  -- If farmer, create farmer profile
  IF selected_role = 'farmer' THEN
    INSERT INTO public.farmer_profiles (user_id, farm_name, location)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'farm_name', 'My Farm'), 'To be updated');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for farmer_profiles
CREATE POLICY "Farmers can view their own profile"
  ON public.farmer_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Farmers can update their own profile"
  ON public.farmer_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view approved farmers"
  ON public.farmer_profiles FOR SELECT
  USING (verification_status = 'approved');

CREATE POLICY "Admins can view all farmer profiles"
  ON public.farmer_profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update farmer profiles"
  ON public.farmer_profiles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for land_listings
CREATE POLICY "Farmers can manage their own listings"
  ON public.land_listings FOR ALL
  USING (farmer_id IN (SELECT id FROM public.farmer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can view active listings from approved farmers"
  ON public.land_listings FOR SELECT
  USING (
    is_active = true 
    AND farmer_id IN (SELECT id FROM public.farmer_profiles WHERE verification_status = 'approved')
  );

CREATE POLICY "Admins can view all listings"
  ON public.land_listings FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for vegetable_orders
CREATE POLICY "Users can view their own orders"
  ON public.vegetable_orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders"
  ON public.vegetable_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Farmers can view orders for their land"
  ON public.vegetable_orders FOR SELECT
  USING (farmer_id IN (SELECT id FROM public.farmer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Farmers can update orders for their land"
  ON public.vegetable_orders FOR UPDATE
  USING (farmer_id IN (SELECT id FROM public.farmer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all orders"
  ON public.vegetable_orders FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all orders"
  ON public.vegetable_orders FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for payments
CREATE POLICY "Users can view their own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create payments"
  ON public.payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments"
  ON public.payments FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update payments"
  ON public.payments FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for growth_status
CREATE POLICY "Users can view growth status for their orders"
  ON public.growth_status FOR SELECT
  USING (order_id IN (SELECT id FROM public.vegetable_orders WHERE user_id = auth.uid()));

CREATE POLICY "Farmers can manage growth status"
  ON public.growth_status FOR ALL
  USING (order_id IN (
    SELECT vo.id FROM public.vegetable_orders vo
    JOIN public.farmer_profiles fp ON vo.farmer_id = fp.id
    WHERE fp.user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all growth status"
  ON public.growth_status FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_farmer_profiles_updated_at
  BEFORE UPDATE ON public.farmer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_land_listings_updated_at
  BEFORE UPDATE ON public.land_listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vegetable_orders_updated_at
  BEFORE UPDATE ON public.vegetable_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

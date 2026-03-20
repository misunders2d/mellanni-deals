-- Mellanni Promotions Portal - Production Schema
-- Run this entirely in your Supabase SQL Editor

-- 1. Create Profiles Table (RBAC)
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email text UNIQUE NOT NULL,
  first_name text,
  last_name text,
  role text CHECK (role IN ('influencer', 'admin', 'superuser')) DEFAULT 'influencer',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile." 
ON public.profiles FOR SELECT USING ( auth.uid() = id );

CREATE POLICY "Platform Managers can view all profiles." 
ON public.profiles FOR SELECT USING ( 
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'superuser')
  )
);

CREATE POLICY "Admins can modify profiles." 
ON public.profiles FOR ALL USING ( 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'first_name', 
    new.raw_user_meta_data->>'last_name',
    COALESCE(new.raw_user_meta_data->>'role', 'influencer')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. Create Promotions Table
CREATE TABLE public.promotions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_name text NOT NULL,
  amazon_link text NOT NULL,
  promo_code text,
  discount_percent integer NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  promo_type text NOT NULL,
  image_url text NOT NULL,
  is_active boolean DEFAULT false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Influencers can view active promotions" 
ON public.promotions FOR SELECT USING ( 
  is_active = true OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superuser')
  )
);

CREATE POLICY "Platform Managers can modify promotions" 
ON public.promotions FOR ALL USING ( 
  EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superuser')
  )
);

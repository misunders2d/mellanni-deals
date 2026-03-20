-- Helper function to break infinite recursion by bypassing RLS during role evaluation
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- 1. Drop all the recursive policies
DROP POLICY IF EXISTS "Platform Managers can view all profiles." ON public.profiles;
DROP POLICY IF EXISTS "Admins can modify profiles." ON public.profiles;
DROP POLICY IF EXISTS "Superusers can modify profiles." ON public.profiles;
DROP POLICY IF EXISTS "Platform Managers can modify promotions" ON public.promotions;
DROP POLICY IF EXISTS "Influencers can view active promotions" ON public.promotions;

-- 2. Re-create them using the safe helper function

-- Profiles
CREATE POLICY "Platform Managers can view all profiles." 
ON public.profiles FOR SELECT USING ( 
  public.get_user_role() IN ('admin', 'superuser')
);

CREATE POLICY "Admins can modify profiles." 
ON public.profiles FOR ALL USING ( 
  public.get_user_role() = 'admin'
);

-- Promotions
CREATE POLICY "Influencers can view active promotions" 
ON public.promotions FOR SELECT USING ( 
  is_active = true OR public.get_user_role() IN ('admin', 'superuser')
);

CREATE POLICY "Platform Managers can modify promotions" 
ON public.promotions FOR ALL USING ( 
  public.get_user_role() IN ('admin', 'superuser')
);

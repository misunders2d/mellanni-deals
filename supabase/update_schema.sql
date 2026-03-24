-- Mellanni Promotions Portal - Schema Update
-- Consolidates all required changes: Deal Archiving and Favorites System

-- 1. Add Archiving Support to Promotions
ALTER TABLE public.promotions 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

-- 2. Create Favorites Table
CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  promotion_id uuid REFERENCES public.promotions ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  UNIQUE(user_id, promotion_id)
);

-- 3. Enable RLS on Favorites
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for Favorites
CREATE POLICY "Users can view their own favorites" 
ON public.favorites FOR SELECT USING ( auth.uid() = user_id );

CREATE POLICY "Users can manage their own favorites" 
ON public.favorites FOR ALL USING ( auth.uid() = user_id );

-- 5. Update Promotions RLS (Support Archiving)
-- Note: Existing policy "Influencers can view active promotions" already allows viewing if is_active = true.
-- However, we might want to differentiate archived vs active in the UI.
-- For now, influencers can view active promotions. We'll handle is_archived filtering in the app logic.

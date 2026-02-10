-- Fix the is_super_admin(uuid) function: it was checking profiles.id instead of profiles.user_id
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    is_super boolean;
BEGIN
    SELECT is_super_admin INTO is_super
    FROM profiles 
    WHERE user_id = _user_id
    LIMIT 1;
    
    RETURN COALESCE(is_super, false);
END;
$$;
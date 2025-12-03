-- Function to make the first registered user an admin
CREATE OR REPLACE FUNCTION public.make_first_user_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count integer;
BEGIN
  -- Count existing users (excluding the one being inserted)
  SELECT COUNT(*) INTO user_count FROM public.user_roles;
  
  -- If this is the first user, make them an admin
  IF user_count = 0 THEN
    UPDATE public.user_roles 
    SET role = 'admin'
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to run after user_roles insert
DROP TRIGGER IF EXISTS on_first_user_make_admin ON public.user_roles;
CREATE TRIGGER on_first_user_make_admin
  AFTER INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.make_first_user_admin();

-- Also automatically approve the first user's profile
CREATE OR REPLACE FUNCTION public.approve_first_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_count integer;
BEGIN
  -- Count existing profiles (excluding the one being inserted)
  SELECT COUNT(*) INTO profile_count FROM public.profiles WHERE id != NEW.id;
  
  -- If this is the first profile, set status to active
  IF profile_count = 0 THEN
    NEW.status := 'active';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to run before profile insert
DROP TRIGGER IF EXISTS on_first_profile_approve ON public.profiles;
CREATE TRIGGER on_first_profile_approve
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.approve_first_user_profile();
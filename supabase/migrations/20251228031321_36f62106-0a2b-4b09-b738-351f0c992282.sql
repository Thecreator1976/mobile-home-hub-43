-- Create the missing trigger for new user signups
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill profiles for existing users who don't have one
INSERT INTO public.profiles (user_id, email, full_name)
SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', '')
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.profiles)
ON CONFLICT DO NOTHING;

-- Backfill agent role for existing users who don't have one
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'agent'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT DO NOTHING;

-- Make the first registered user an admin
UPDATE public.user_roles
SET role = 'admin'
WHERE user_id = (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1);
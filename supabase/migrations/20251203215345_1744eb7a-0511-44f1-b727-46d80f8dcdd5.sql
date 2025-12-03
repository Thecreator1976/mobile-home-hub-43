-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'agent', 'viewer');

-- Create enum for lead status
CREATE TYPE public.lead_status AS ENUM ('new', 'contacted', 'offer_made', 'under_contract', 'closed', 'lost');

-- Create enum for home type
CREATE TYPE public.home_type AS ENUM ('single', 'double', 'triple');

-- Create enum for appointment type
CREATE TYPE public.appointment_type AS ENUM ('call', 'meeting', 'property_viewing', 'closing');

-- Create enum for expense category
CREATE TYPE public.expense_category AS ENUM ('marketing', 'travel', 'repairs', 'legal', 'closing', 'other');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'viewer',
  UNIQUE (user_id, role)
);

-- Create seller_leads table
CREATE TABLE public.seller_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Contact Info
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  -- Address
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  zip TEXT,
  -- Property Info
  home_type home_type DEFAULT 'single',
  year_built INTEGER,
  condition INTEGER CHECK (condition >= 1 AND condition <= 5),
  length_ft NUMERIC,
  width_ft NUMERIC,
  park_owned BOOLEAN DEFAULT true,
  lot_rent NUMERIC,
  -- Financial Info
  asking_price NUMERIC NOT NULL,
  owed_amount NUMERIC DEFAULT 0,
  estimated_value NUMERIC,
  target_offer NUMERIC,
  -- Status
  status lead_status DEFAULT 'new',
  notes TEXT,
  -- Tracking
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create buyers table
CREATE TABLE public.buyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  min_price NUMERIC,
  max_price NUMERIC,
  home_types home_type[] DEFAULT ARRAY['single'::home_type],
  locations TEXT[],
  credit_score INTEGER,
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'closed')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type appointment_type DEFAULT 'call',
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  location TEXT,
  seller_lead_id UUID REFERENCES public.seller_leads(id) ON DELETE SET NULL,
  buyer_id UUID REFERENCES public.buyers(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category expense_category DEFAULT 'other',
  receipt_url TEXT,
  seller_lead_id UUID REFERENCES public.seller_leads(id) ON DELETE SET NULL,
  expense_date DATE DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create lead_timeline table for activity tracking
CREATE TABLE public.lead_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_lead_id UUID REFERENCES public.seller_leads(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_timeline ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
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

-- Create function to check if user is admin or agent
CREATE OR REPLACE FUNCTION public.is_admin_or_agent(_user_id UUID)
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
      AND role IN ('admin', 'agent')
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for seller_leads
CREATE POLICY "Authenticated users can view leads" ON public.seller_leads
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and agents can create leads" ON public.seller_leads
  FOR INSERT WITH CHECK (public.is_admin_or_agent(auth.uid()));

CREATE POLICY "Admins and agents can update leads" ON public.seller_leads
  FOR UPDATE USING (public.is_admin_or_agent(auth.uid()));

CREATE POLICY "Admins can delete leads" ON public.seller_leads
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for buyers
CREATE POLICY "Authenticated users can view buyers" ON public.buyers
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and agents can manage buyers" ON public.buyers
  FOR ALL USING (public.is_admin_or_agent(auth.uid()));

-- RLS Policies for appointments
CREATE POLICY "Authenticated users can view appointments" ON public.appointments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and agents can manage appointments" ON public.appointments
  FOR ALL USING (public.is_admin_or_agent(auth.uid()));

-- RLS Policies for expenses
CREATE POLICY "Authenticated users can view expenses" ON public.expenses
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and agents can manage expenses" ON public.expenses
  FOR ALL USING (public.is_admin_or_agent(auth.uid()));

-- RLS Policies for lead_timeline
CREATE POLICY "Authenticated users can view timeline" ON public.lead_timeline
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and agents can add timeline entries" ON public.lead_timeline
  FOR INSERT WITH CHECK (public.is_admin_or_agent(auth.uid()));

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_seller_leads_updated_at
  BEFORE UPDATE ON public.seller_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_buyers_updated_at
  BEFORE UPDATE ON public.buyers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  );
  
  -- Assign default agent role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'agent');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.seller_leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'agent',
    'viewer'
);


--
-- Name: appointment_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.appointment_type AS ENUM (
    'call',
    'meeting',
    'property_viewing',
    'closing'
);


--
-- Name: expense_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.expense_category AS ENUM (
    'marketing',
    'travel',
    'repairs',
    'legal',
    'closing',
    'other'
);


--
-- Name: home_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.home_type AS ENUM (
    'single',
    'double',
    'triple'
);


--
-- Name: lead_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.lead_status AS ENUM (
    'new',
    'contacted',
    'offer_made',
    'under_contract',
    'closed',
    'lost'
);


--
-- Name: approve_first_user_profile(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.approve_first_user_profile() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: is_admin_or_agent(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin_or_agent(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'agent')
  )
$$;


--
-- Name: make_first_user_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.make_first_user_admin() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: appointments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appointments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    type public.appointment_type DEFAULT 'call'::public.appointment_type,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone,
    location text,
    seller_lead_id uuid,
    buyer_id uuid,
    status text DEFAULT 'scheduled'::text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT appointments_status_check CHECK ((status = ANY (ARRAY['scheduled'::text, 'completed'::text, 'cancelled'::text])))
);


--
-- Name: buyers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.buyers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    phone text,
    email text,
    min_price numeric,
    max_price numeric,
    home_types public.home_type[] DEFAULT ARRAY['single'::public.home_type],
    locations text[],
    credit_score integer,
    notes text,
    status text DEFAULT 'active'::text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT buyers_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'closed'::text])))
);


--
-- Name: contract_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contract_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    category text DEFAULT 'purchase'::text NOT NULL,
    content text NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: expenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expenses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    description text NOT NULL,
    amount numeric NOT NULL,
    category public.expense_category DEFAULT 'other'::public.expense_category,
    receipt_url text,
    seller_lead_id uuid,
    expense_date date DEFAULT CURRENT_DATE,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: external_integrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.external_integrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    service_name text NOT NULL,
    webhook_url text,
    config jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    last_sync timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: lead_timeline; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_timeline (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    seller_lead_id uuid NOT NULL,
    action text NOT NULL,
    user_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: personal_advances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.personal_advances (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    seller_lead_id uuid,
    amount numeric NOT NULL,
    purpose text NOT NULL,
    interest_rate numeric DEFAULT 0,
    repayment_terms text,
    status text DEFAULT 'active'::text NOT NULL,
    issued_date date DEFAULT CURRENT_DATE NOT NULL,
    due_date date,
    repaid_date date,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT personal_advances_status_check CHECK ((status = ANY (ARRAY['active'::text, 'repaid'::text, 'defaulted'::text])))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    email text NOT NULL,
    full_name text,
    avatar_url text,
    status text DEFAULT 'pending'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT profiles_status_check CHECK ((status = ANY (ARRAY['active'::text, 'pending'::text, 'suspended'::text])))
);


--
-- Name: purchase_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchase_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    po_number text NOT NULL,
    seller_lead_id uuid,
    vendor text NOT NULL,
    items jsonb DEFAULT '[]'::jsonb NOT NULL,
    total_amount numeric DEFAULT 0 NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    due_date date,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT purchase_orders_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'sent'::text, 'received'::text, 'paid'::text])))
);


--
-- Name: seller_leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seller_leads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    phone text,
    email text,
    address text NOT NULL,
    city text,
    state text,
    zip text,
    home_type public.home_type DEFAULT 'single'::public.home_type,
    year_built integer,
    condition integer,
    length_ft numeric,
    width_ft numeric,
    park_owned boolean DEFAULT true,
    lot_rent numeric,
    asking_price numeric NOT NULL,
    owed_amount numeric DEFAULT 0,
    estimated_value numeric,
    target_offer numeric,
    status public.lead_status DEFAULT 'new'::public.lead_status,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT seller_leads_condition_check CHECK (((condition >= 1) AND (condition <= 5)))
);


--
-- Name: sms_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sms_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    category text DEFAULT 'general'::text NOT NULL,
    content text NOT NULL,
    is_default boolean DEFAULT false,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: social_posts_queue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.social_posts_queue (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    seller_lead_id uuid,
    platform text NOT NULL,
    content text NOT NULL,
    media_urls text[] DEFAULT '{}'::text[],
    scheduled_time timestamp with time zone,
    status text DEFAULT 'pending'::text,
    external_post_id text,
    error_message text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'viewer'::public.app_role NOT NULL
);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: buyers buyers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.buyers
    ADD CONSTRAINT buyers_pkey PRIMARY KEY (id);


--
-- Name: contract_templates contract_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_templates
    ADD CONSTRAINT contract_templates_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: external_integrations external_integrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_integrations
    ADD CONSTRAINT external_integrations_pkey PRIMARY KEY (id);


--
-- Name: lead_timeline lead_timeline_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_timeline
    ADD CONSTRAINT lead_timeline_pkey PRIMARY KEY (id);


--
-- Name: personal_advances personal_advances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_advances
    ADD CONSTRAINT personal_advances_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: purchase_orders purchase_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_pkey PRIMARY KEY (id);


--
-- Name: purchase_orders purchase_orders_po_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_po_number_key UNIQUE (po_number);


--
-- Name: seller_leads seller_leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seller_leads
    ADD CONSTRAINT seller_leads_pkey PRIMARY KEY (id);


--
-- Name: sms_templates sms_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sms_templates
    ADD CONSTRAINT sms_templates_pkey PRIMARY KEY (id);


--
-- Name: social_posts_queue social_posts_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_posts_queue
    ADD CONSTRAINT social_posts_queue_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: idx_appointments_start_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_start_status ON public.appointments USING btree (start_time, status);


--
-- Name: idx_appointments_start_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_start_time ON public.appointments USING btree (start_time);


--
-- Name: idx_appointments_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_status ON public.appointments USING btree (status);


--
-- Name: idx_buyers_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_buyers_created_at ON public.buyers USING btree (created_at DESC);


--
-- Name: idx_buyers_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_buyers_status ON public.buyers USING btree (status);


--
-- Name: idx_buyers_status_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_buyers_status_created ON public.buyers USING btree (status, created_at DESC);


--
-- Name: idx_expenses_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expenses_date ON public.expenses USING btree (expense_date DESC);


--
-- Name: idx_expenses_seller_lead; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expenses_seller_lead ON public.expenses USING btree (seller_lead_id);


--
-- Name: idx_lead_timeline_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_timeline_created ON public.lead_timeline USING btree (created_at DESC);


--
-- Name: idx_lead_timeline_seller_lead; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_timeline_seller_lead ON public.lead_timeline USING btree (seller_lead_id);


--
-- Name: idx_seller_leads_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seller_leads_created_at ON public.seller_leads USING btree (created_at DESC);


--
-- Name: idx_seller_leads_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seller_leads_created_by ON public.seller_leads USING btree (created_by);


--
-- Name: idx_seller_leads_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seller_leads_status ON public.seller_leads USING btree (status);


--
-- Name: idx_seller_leads_status_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seller_leads_status_created ON public.seller_leads USING btree (status, created_at DESC);


--
-- Name: profiles on_first_profile_approve; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_first_profile_approve BEFORE INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.approve_first_user_profile();


--
-- Name: user_roles on_first_user_make_admin; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_first_user_make_admin AFTER INSERT ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.make_first_user_admin();


--
-- Name: appointments update_appointments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: buyers update_buyers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_buyers_updated_at BEFORE UPDATE ON public.buyers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: contract_templates update_contract_templates_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_contract_templates_updated_at BEFORE UPDATE ON public.contract_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: external_integrations update_external_integrations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_external_integrations_updated_at BEFORE UPDATE ON public.external_integrations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: personal_advances update_personal_advances_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_personal_advances_updated_at BEFORE UPDATE ON public.personal_advances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: purchase_orders update_purchase_orders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: seller_leads update_seller_leads_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_seller_leads_updated_at BEFORE UPDATE ON public.seller_leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: sms_templates update_sms_templates_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_sms_templates_updated_at BEFORE UPDATE ON public.sms_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: social_posts_queue update_social_posts_queue_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_social_posts_queue_updated_at BEFORE UPDATE ON public.social_posts_queue FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: appointments appointments_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.buyers(id) ON DELETE SET NULL;


--
-- Name: appointments appointments_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: appointments appointments_seller_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_seller_lead_id_fkey FOREIGN KEY (seller_lead_id) REFERENCES public.seller_leads(id) ON DELETE SET NULL;


--
-- Name: buyers buyers_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.buyers
    ADD CONSTRAINT buyers_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: expenses expenses_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: expenses expenses_seller_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_seller_lead_id_fkey FOREIGN KEY (seller_lead_id) REFERENCES public.seller_leads(id) ON DELETE SET NULL;


--
-- Name: external_integrations external_integrations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_integrations
    ADD CONSTRAINT external_integrations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: lead_timeline lead_timeline_seller_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_timeline
    ADD CONSTRAINT lead_timeline_seller_lead_id_fkey FOREIGN KEY (seller_lead_id) REFERENCES public.seller_leads(id) ON DELETE CASCADE;


--
-- Name: lead_timeline lead_timeline_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_timeline
    ADD CONSTRAINT lead_timeline_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: personal_advances personal_advances_seller_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_advances
    ADD CONSTRAINT personal_advances_seller_lead_id_fkey FOREIGN KEY (seller_lead_id) REFERENCES public.seller_leads(id) ON DELETE SET NULL;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: purchase_orders purchase_orders_seller_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_seller_lead_id_fkey FOREIGN KEY (seller_lead_id) REFERENCES public.seller_leads(id) ON DELETE SET NULL;


--
-- Name: seller_leads seller_leads_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seller_leads
    ADD CONSTRAINT seller_leads_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: sms_templates sms_templates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sms_templates
    ADD CONSTRAINT sms_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: social_posts_queue social_posts_queue_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_posts_queue
    ADD CONSTRAINT social_posts_queue_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: social_posts_queue social_posts_queue_seller_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_posts_queue
    ADD CONSTRAINT social_posts_queue_seller_lead_id_fkey FOREIGN KEY (seller_lead_id) REFERENCES public.seller_leads(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: lead_timeline Admins and agents can add timeline entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and agents can add timeline entries" ON public.lead_timeline FOR INSERT WITH CHECK (public.is_admin_or_agent(auth.uid()));


--
-- Name: seller_leads Admins and agents can create leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and agents can create leads" ON public.seller_leads FOR INSERT WITH CHECK (public.is_admin_or_agent(auth.uid()));


--
-- Name: appointments Admins and agents can manage appointments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and agents can manage appointments" ON public.appointments USING (public.is_admin_or_agent(auth.uid()));


--
-- Name: buyers Admins and agents can manage buyers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and agents can manage buyers" ON public.buyers USING (public.is_admin_or_agent(auth.uid()));


--
-- Name: expenses Admins and agents can manage expenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and agents can manage expenses" ON public.expenses USING (public.is_admin_or_agent(auth.uid()));


--
-- Name: purchase_orders Admins and agents can manage purchase orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and agents can manage purchase orders" ON public.purchase_orders USING (public.is_admin_or_agent(auth.uid()));


--
-- Name: seller_leads Admins and agents can update leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and agents can update leads" ON public.seller_leads FOR UPDATE USING (public.is_admin_or_agent(auth.uid()));


--
-- Name: contract_templates Admins can create contract templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can create contract templates" ON public.contract_templates FOR INSERT WITH CHECK (public.is_admin_or_agent(auth.uid()));


--
-- Name: contract_templates Admins can delete contract templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete contract templates" ON public.contract_templates FOR DELETE USING (public.is_admin_or_agent(auth.uid()));


--
-- Name: seller_leads Admins can delete leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete leads" ON public.seller_leads FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can manage all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all roles" ON public.user_roles USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: contract_templates Admins can update contract templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update contract templates" ON public.contract_templates FOR UPDATE USING (public.is_admin_or_agent(auth.uid()));


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: personal_advances Agents and admins can create personal advances; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Agents and admins can create personal advances" ON public.personal_advances FOR INSERT WITH CHECK (public.is_admin_or_agent(auth.uid()));


--
-- Name: personal_advances Agents and admins can delete personal advances; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Agents and admins can delete personal advances" ON public.personal_advances FOR DELETE USING (public.is_admin_or_agent(auth.uid()));


--
-- Name: social_posts_queue Agents and admins can manage social posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Agents and admins can manage social posts" ON public.social_posts_queue USING (public.is_admin_or_agent(auth.uid()));


--
-- Name: sms_templates Agents and admins can manage templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Agents and admins can manage templates" ON public.sms_templates USING (public.is_admin_or_agent(auth.uid()));


--
-- Name: personal_advances Agents and admins can update personal advances; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Agents and admins can update personal advances" ON public.personal_advances FOR UPDATE USING (public.is_admin_or_agent(auth.uid()));


--
-- Name: sms_templates Agents and admins can view SMS templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Agents and admins can view SMS templates" ON public.sms_templates FOR SELECT USING (public.is_admin_or_agent(auth.uid()));


--
-- Name: contract_templates Agents and admins can view contract templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Agents and admins can view contract templates" ON public.contract_templates FOR SELECT USING (public.is_admin_or_agent(auth.uid()));


--
-- Name: social_posts_queue Agents and admins can view social posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Agents and admins can view social posts" ON public.social_posts_queue FOR SELECT USING (public.is_admin_or_agent(auth.uid()));


--
-- Name: external_integrations Users can manage their own integrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own integrations" ON public.external_integrations USING (((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: purchase_orders Users can view POs they created or admins/agents see all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view POs they created or admins/agents see all" ON public.purchase_orders FOR SELECT USING (((created_by = auth.uid()) OR public.is_admin_or_agent(auth.uid())));


--
-- Name: personal_advances Users can view advances they created or admins/agents see all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view advances they created or admins/agents see all" ON public.personal_advances FOR SELECT USING (((created_by = auth.uid()) OR public.is_admin_or_agent(auth.uid())));


--
-- Name: appointments Users can view appointments they created or admins/agents see a; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view appointments they created or admins/agents see a" ON public.appointments FOR SELECT USING (((created_by = auth.uid()) OR public.is_admin_or_agent(auth.uid())));


--
-- Name: buyers Users can view buyers they created or admins/agents see all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view buyers they created or admins/agents see all" ON public.buyers FOR SELECT USING (((created_by = auth.uid()) OR public.is_admin_or_agent(auth.uid())));


--
-- Name: expenses Users can view expenses they created or admins/agents see all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view expenses they created or admins/agents see all" ON public.expenses FOR SELECT USING (((created_by = auth.uid()) OR public.is_admin_or_agent(auth.uid())));


--
-- Name: seller_leads Users can view leads they created or admins/agents see all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view leads they created or admins/agents see all" ON public.seller_leads FOR SELECT USING (((created_by = auth.uid()) OR public.is_admin_or_agent(auth.uid())));


--
-- Name: external_integrations Users can view their own integrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own integrations" ON public.external_integrations FOR SELECT USING (((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: lead_timeline Users can view timeline for leads they have access to; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view timeline for leads they have access to" ON public.lead_timeline FOR SELECT USING (((user_id = auth.uid()) OR public.is_admin_or_agent(auth.uid())));


--
-- Name: appointments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

--
-- Name: buyers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.buyers ENABLE ROW LEVEL SECURITY;

--
-- Name: contract_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: expenses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

--
-- Name: external_integrations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.external_integrations ENABLE ROW LEVEL SECURITY;

--
-- Name: lead_timeline; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lead_timeline ENABLE ROW LEVEL SECURITY;

--
-- Name: personal_advances; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.personal_advances ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: purchase_orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

--
-- Name: seller_leads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.seller_leads ENABLE ROW LEVEL SECURITY;

--
-- Name: sms_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: social_posts_queue; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.social_posts_queue ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--



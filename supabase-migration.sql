-- =====================================================================
-- USERS FIRST (base table for nearly all relationships)
-- =====================================================================

CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  email text,
  phone text,
  password text,
  created_at timestamp with time zone DEFAULT now(),
  is_admin boolean DEFAULT false,
  total_points integer DEFAULT 0,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- =====================================================================
-- ORGANIZATIONS
-- =====================================================================

CREATE TABLE public.organizations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  address text,
  is_verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  password text,
  role text DEFAULT 'Organization',
  status text DEFAULT 'active',
  funding text,
  region text DEFAULT 'Yangon',
  volunteer_count numeric,
  CONSTRAINT organizations_pkey PRIMARY KEY (id)
);

-- =====================================================================
-- ORG-MEMBER (SPECIAL NAME, NEEDS QUOTES)
-- =====================================================================

CREATE TABLE public."org-member" (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid,
  user_id uuid,
  status text DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at timestamp with time zone DEFAULT now(),
  type text DEFAULT 'normal',
  CONSTRAINT "org-member_pkey" PRIMARY KEY (id),
  CONSTRAINT "org-member_organization_id_fkey"
      FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT "org-member_user_id_fkey"
      FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- =====================================================================
-- SAFETY MODULES (needed before quiz & Q&A)
-- =====================================================================

CREATE TABLE public.safety_modules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL,
  icon_name text NOT NULL,
  point_value integer DEFAULT 0,
  video_url text,
  duration integer DEFAULT 15,
  difficulty text DEFAULT 'Beginner',
  tags text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT safety_modules_pkey PRIMARY KEY (id)
);

-- =====================================================================
-- QUIZ QUESTIONS
-- =====================================================================

CREATE TABLE public.quiz_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  module_id uuid,
  question text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text,
  option_d text,
  correct_answer text NOT NULL,
  explanation text,
  points integer DEFAULT 1,
  question_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT quiz_questions_pkey PRIMARY KEY (id),
  CONSTRAINT quiz_questions_module_id_fkey
     FOREIGN KEY (module_id) REFERENCES public.safety_modules(id)
);

-- =====================================================================
-- QNA
-- =====================================================================

CREATE TABLE public.qna (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  module_id uuid,
  question text NOT NULL,
  answer text NOT NULL,
  is_frequent boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT qna_pkey PRIMARY KEY (id),
  CONSTRAINT qna_module_id_fkey FOREIGN KEY (module_id)
      REFERENCES public.safety_modules(id)
);

-- =====================================================================
-- ITEMS LIST
-- =====================================================================

CREATE TABLE public.items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  unit text,
  category text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT items_pkey PRIMARY KEY (id)
);

-- =====================================================================
-- PINS (needed before pin_items)
-- =====================================================================

CREATE TABLE public.pins (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  type text CHECK (type IN ('damage','shelter')),
  image_url text,
  description text,
  status text DEFAULT 'pending' CHECK (status IN ('pending','confirmed','completed')),
  confirmed_by uuid,
  confirmed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  phone numeric,
  CONSTRAINT pins_pkey PRIMARY KEY (id),
  CONSTRAINT pins_user_id_fkey FOREIGN KEY (user_id)
      REFERENCES public.users(id),
  CONSTRAINT pins_confirmed_by_fkey FOREIGN KEY (confirmed_by)
      REFERENCES public."org-member"(id)
);

-- =====================================================================
-- PIN ITEMS
-- =====================================================================

CREATE TABLE public.pin_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  pin_id uuid,
  item_id uuid,
  requested_qty integer NOT NULL CHECK (requested_qty > 0),
  remaining_qty integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pin_items_pkey PRIMARY KEY (id),
  CONSTRAINT pin_items_pin_id_fkey FOREIGN KEY (pin_id)
      REFERENCES public.pins(id),
  CONSTRAINT pin_items_item_id_fkey FOREIGN KEY (item_id)
      REFERENCES public.items(id)
);

-- =====================================================================
-- DONATIONS
-- =====================================================================

CREATE TABLE public.donations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid,
  pin_item_id uuid,
  donated_quantity integer NOT NULL CHECK (donated_quantity > 0),
  donated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT donations_pkey PRIMARY KEY (id),
  CONSTRAINT donations_organization_id_fkey FOREIGN KEY (organization_id)
      REFERENCES public.organizations(id),
  CONSTRAINT donations_pin_item_id_fkey FOREIGN KEY (pin_item_id)
      REFERENCES public.pin_items(id)
);

-- =====================================================================
-- EMERGENCY KIT ITEMS
-- =====================================================================

CREATE TABLE public.emergency_kit_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE,
  description text,
  category character varying,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT emergency_kit_items_pkey PRIMARY KEY (id)
);

-- SPECIAL NAME: emergency_kit_items(not used)
CREATE TABLE public."emergency_kit_items(not used)" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT "emergency_kit_items(not used)_pkey" PRIMARY KEY (id)
);

-- =====================================================================
-- USER EMERGENCY KITS (references auth.users)
-- =====================================================================

CREATE TABLE public.user_emergency_kits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kit_item_id uuid NOT NULL,
  is_checked boolean DEFAULT false,
  checked_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_emergency_kits_pkey PRIMARY KEY (id),
  CONSTRAINT user_emergency_kits_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- SPECIAL NAME: user_emergency_kits(not used)
CREATE TABLE public."user_emergency_kits(not used)" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_id uuid NOT NULL,
  is_checked boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT "user_emergency_kits(not used)_pkey" PRIMARY KEY (id),
  CONSTRAINT "user_emergency_kits(not used)_item_id_fkey"
      FOREIGN KEY (item_id) REFERENCES public."emergency_kit_items(not used)"(id),
  CONSTRAINT "user_emergency_kits(not used)_user_id_fkey"
      FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- =====================================================================
-- FAMILY TABLES
-- =====================================================================

CREATE TABLE public.family_members (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  member_id uuid NOT NULL,
  relation text,
  created_at timestamp with time zone DEFAULT now(),
  safety_status text CHECK (safety_status IN ('safe','danger','unknown')),
  safety_check_started_at timestamp with time zone,
  safety_check_expires_at timestamp with time zone,
  CONSTRAINT family_members_pkey PRIMARY KEY (id),
  CONSTRAINT family_members_user_id_fkey FOREIGN KEY (user_id)
      REFERENCES public.users(id),
  CONSTRAINT family_members_member_id_fkey FOREIGN KEY (member_id)
      REFERENCES public.users(id)
);

CREATE TABLE public.family_requests (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  from_user_id uuid NOT NULL,
  to_user_id uuid NOT NULL,
  relation text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT family_requests_pkey PRIMARY KEY (id),
  CONSTRAINT family_requests_from_user_id_fkey FOREIGN KEY (from_user_id)
      REFERENCES public.users(id),
  CONSTRAINT family_requests_to_user_id_fkey FOREIGN KEY (to_user_id)
      REFERENCES public.users(id)
);

-- =====================================================================
-- USER LAST SEEN
-- =====================================================================

CREATE TABLE public.user_last_seen (
  user_id uuid NOT NULL,
  lat double precision,
  lng double precision,
  address text,
  last_seen_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_last_seen_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_last_seen_user_id_fkey FOREIGN KEY (user_id)
      REFERENCES public.users(id)
);

-- =====================================================================
-- MESSAGES
-- =====================================================================

CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  content text NOT NULL,
  status text DEFAULT 'sent' CHECK (status IN ('sent','delivered','read')),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id)
      REFERENCES public.users(id),
  CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id)
      REFERENCES public.users(id)
);

-- =====================================================================
-- NOTIFICATIONS
-- =====================================================================

CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text,
  body text,
  payload jsonb,
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone,
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id)
      REFERENCES public.users(id)
);

-- =====================================================================
-- ORGANIZATION REQUESTS
-- =====================================================================

CREATE TABLE public.organization_requests (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT organization_requests_pkey PRIMARY KEY (id),
  CONSTRAINT organization_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT organization_requests_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.organizations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  address text,
  is_verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  password text,
  role text DEFAULT 'Organization'::text,
  latitude double precision,
  longitude double precision,
  image text,
  CONSTRAINT organizations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.pin_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  pin_id uuid,
  item_id uuid,
  requested_qty integer NOT NULL CHECK (requested_qty > 0),
  remaining_qty integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pin_items_pkey PRIMARY KEY (id),
  CONSTRAINT pin_items_pin_id_fkey FOREIGN KEY (pin_id) REFERENCES public.pins(id),
  CONSTRAINT pin_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id)
);
CREATE TABLE public.pins (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  type text CHECK (type = ANY (ARRAY['damage'::text, 'shelter'::text])),
  image_url text,
  description text,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'completed'::text])),
  confirmed_by uuid,
  confirmed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  phone numeric,
  CONSTRAINT pins_pkey PRIMARY KEY (id),
  CONSTRAINT pins_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT pins_confirmed_by_fkey FOREIGN KEY (confirmed_by) REFERENCES public.org-member(id)
);
CREATE TABLE public.quiz_options (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  question_id uuid NOT NULL,
  option_text text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT quiz_options_pkey PRIMARY KEY (id),
  CONSTRAINT quiz_options_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.module_quiz_questions(id)
);
CREATE TABLE public.safety_modules (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  category text,
  icon text,
  video_url text,
  point integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT safety_modules_pkey PRIMARY KEY (id)
);

CREATE TABLE public.user_modules (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  module_id uuid NOT NULL,
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  score integer DEFAULT 0,
  CONSTRAINT user_modules_pkey PRIMARY KEY (id),
  CONSTRAINT user_modules_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT user_modules_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.safety_modules(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  email text,
  phone text,
  password text,
  created_at timestamp with time zone DEFAULT now(),
  is_admin boolean DEFAULT false,
  total_points integer DEFAULT 0,
  address text,
  latitude double precision,
  longitude double precision,
  image text,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- Track users' last seen location and time
CREATE TABLE IF NOT EXISTS public.user_last_seen (
  user_id uuid PRIMARY KEY,
  lat double precision,
  lng double precision,
  address text,
  last_seen_at timestamptz DEFAULT now()
  CONSTRAINT organization_requests_user_id_fkey FOREIGN KEY (user_id)
      REFERENCES public.users(id),
  CONSTRAINT organization_requests_organization_id_fkey FOREIGN KEY (organization_id)
      REFERENCES public.organizations(id)
);

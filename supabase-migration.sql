-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.donations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid,
  pin_item_id uuid,
  donated_quantity integer NOT NULL CHECK (donated_quantity > 0),
  donated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT donations_pkey PRIMARY KEY (id),
  CONSTRAINT donations_pin_item_id_fkey FOREIGN KEY (pin_item_id) REFERENCES public.pin_items(id),
  CONSTRAINT donations_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.family_members (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  member_id uuid NOT NULL,
  relation character varying,
  created_at timestamp with time zone DEFAULT now(),
  safety_status text CHECK (safety_status = ANY (ARRAY['safe'::text, 'danger'::text, 'unknown'::text])),
  safety_check_started_at timestamp with time zone,
  safety_check_expires_at timestamp with time zone,
  CONSTRAINT family_members_pkey PRIMARY KEY (id),
  CONSTRAINT family_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT family_members_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.users(id)
);
CREATE TABLE public.family_requests (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  from_user_id uuid NOT NULL,
  to_user_id uuid NOT NULL,
  relation character varying NOT NULL,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT family_requests_pkey PRIMARY KEY (id),
  CONSTRAINT family_requests_from_user_id_fkey FOREIGN KEY (from_user_id) REFERENCES public.users(id),
  CONSTRAINT family_requests_to_user_id_fkey FOREIGN KEY (to_user_id) REFERENCES public.users(id)
);
CREATE TABLE public.items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  unit text,
  category text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT items_pkey PRIMARY KEY (id)
);
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  content text NOT NULL,
  status text DEFAULT 'sent'::text CHECK (status = ANY (ARRAY['sent'::text, 'delivered'::text, 'read'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id),
  CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id)
);
CREATE TABLE public.module_qna (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  module_id uuid NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT module_qna_pkey PRIMARY KEY (id),
  CONSTRAINT module_qna_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.safety_modules(id)
);
CREATE TABLE public.module_quiz_questions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  module_id uuid NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT module_quiz_questions_pkey PRIMARY KEY (id),
  CONSTRAINT module_quiz_questions_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.safety_modules(id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text,
  body text,
  payload jsonb,
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.org-member (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid,
  user_id uuid,
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text])),
  created_at timestamp with time zone DEFAULT now(),
  type text DEFAULT 'normal'::text,
  CONSTRAINT org-member_pkey PRIMARY KEY (id),
  CONSTRAINT trackers_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT trackers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.organization_requests (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  message text,
  status text NOT NULL DEFAULT '''''''pending''''::text''::text'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
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
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
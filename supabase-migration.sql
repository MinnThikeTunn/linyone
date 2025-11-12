-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE donations (
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
  -- Persistent safety window fields
  safety_status text CHECK (safety_status IN ('safe','danger','unknown')),
  safety_check_started_at timestamptz,
  safety_check_expires_at timestamptz,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT family_members_pkey PRIMARY KEY (id),
  CONSTRAINT family_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT family_members_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.users(id)
);



-- Helpful index for checking active/expired windows
CREATE INDEX IF NOT EXISTS family_members_safety_expires_idx
  ON family_members (safety_check_expires_at)
  WHERE safety_check_expires_at IS NOT NULL;


CREATE TABLE items (
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
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  email text,
  phone text,
  password text,
  created_at timestamp with time zone DEFAULT now(),
  is_admin boolean DEFAULT false,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
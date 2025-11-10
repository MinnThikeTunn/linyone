-- Enable UUID extension first
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS
create table users (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text,
  phone text,
  password text,
  created_at timestamptz default now()
);

-- ORGANIZATIONS
create table organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null,
  phone text not null,
  password text not null,
  address text,
  is_verified boolean default false,
  created_at timestamptz default now()
);

-- TRACKERS
create table trackers (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  status text check (status in ('active', 'inactive')) default 'active',
  created_at timestamptz default now()
);

-- DAMAGE PINS
create table pins (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id),
  latitude decimal not null,
  longitude decimal not null,
  type text check (type in ('damage','shelter')),
  image_url text,
  description text,
  status text check (status in ('pending','confirmed','completed')) default 'pending',
  confirmed_by uuid references trackers(id),
  confirmed_at timestamptz,
  created_at timestamptz default now()
);

-- 
-- ==========================================================
-- NEW ITEMS TABLE (Static Data)
-- ==========================================================
--
create table items (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  unit text, -- e.g., 'packs', 'liters', 'units'
  category text,
  created_at timestamptz default now()
);

-- Insert 5 static data rows
INSERT INTO items (name, unit, category) VALUES
('Food Pack', 'packs', 'Food'),
('Bottled Water', 'liters', 'Water'),
('Blanket', 'units', 'Shelter'),
('First Aid Kit', 'kits', 'Medical'),
('Tarp', 'units', 'Shelter');

-- 
-- ==========================================================
-- MODIFIED PIN_ITEMS TABLE
-- ==========================================================
--
create table pin_items (
  id uuid primary key default uuid_generate_v4(),
  pin_id uuid references pins(id) on delete cascade,
  item_id uuid references items(id), -- <-- Changed from item_name
  requested_qty int not null check (requested_qty > 0),
  remaining_qty int not null,
  created_at timestamptz default now(),
  
  -- Ensures remaining qty is always valid
  CHECK (remaining_qty >= 0 AND remaining_qty <= requested_qty)
);

-- 
-- ==========================================================
-- DONATION SYSTEM TABLE (No changes needed)
-- ==========================================================
--
create table donations (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete set null,
  pin_item_id uuid references pin_items(id) on delete cascade,
  donated_quantity int not null check (donated_quantity > 0),
  donated_at timestamptz default now()
);

-- 
-- ==========================================================
-- ROW LEVEL SECURITY (No changes needed)
-- ==========================================================
--
alter table pins enable row level security;

create policy "anyone_can_create_pin"
on pins
for insert
to public
with check (true);

create policy "tracker_confirm"
on pins
for update 
using (auth.uid() in (select user_id from trackers where status='active'));

--
-- ==========================================================
-- AUTOMATION TRIGGER (No changes needed)
-- ==========================================================
--
create or replace function handle_donation_and_pin_completion()
returns trigger as $$
DECLARE
    v_pin_id UUID;
    v_total_remaining INT;
BEGIN
    -- 1. Update the remaining_qty on the specific pin_item
    UPDATE pin_items
    SET remaining_qty = remaining_qty - NEW.donated_quantity
    WHERE id = NEW.pin_item_id
    RETURNING pin_id INTO v_pin_id;

    -- 2. Check if all items on that pin are now complete
    SELECT SUM(remaining_qty)
    INTO v_total_remaining
    FROM pin_items
    WHERE pin_id = v_pin_id;

    -- 3. If total remaining is 0, complete the pin
    IF v_total_remaining = 0 THEN
        UPDATE pins
        SET status = 'completed'
        WHERE id = v_pin_id;
    END IF;

    RETURN NEW;
END;
$$ language plpgsql;

create trigger t_handle_donation
after insert on donations
for each row
execute procedure handle_donation_and_pin_completion();
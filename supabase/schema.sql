-- ============================================
-- DAWN MAIL - Database Schema
-- ============================================

-- Common tables (shared across DAWN SERIES)
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

create table if not exists staff (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  user_id uuid,
  name text not null,
  email text not null,
  role text default 'member' check (role in ('admin', 'member')),
  created_at timestamptz default now()
);

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  name text not null,
  email text not null,
  phone text,
  created_at timestamptz default now()
);

-- Mail-specific tables
create table if not exists email_lists (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  name text not null,
  created_at timestamptz default now()
);

create table if not exists email_list_members (
  id uuid primary key default gen_random_uuid(),
  list_id uuid references email_lists(id),
  contact_id uuid references contacts(id),
  subscribed_at timestamptz default now(),
  unsubscribed_at timestamptz
);

create table if not exists email_campaigns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  list_id uuid references email_lists(id),
  subject text not null,
  body text not null,
  status text default 'draft' check (status in ('draft', 'scheduled', 'sending', 'sent')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  sent_count integer default 0,
  open_count integer default 0,
  created_at timestamptz default now()
);

-- Row Level Security
alter table organizations enable row level security;
alter table staff enable row level security;
alter table contacts enable row level security;
alter table email_lists enable row level security;
alter table email_list_members enable row level security;
alter table email_campaigns enable row level security;

-- Policies for staff
create policy "Staff can view own org" on staff
  for select using (auth.uid() = user_id);

-- Policies for organizations
create policy "Org members can view" on organizations
  for select using (
    id in (select organization_id from staff where user_id = auth.uid())
  );

-- Policies for contacts
create policy "Org members can manage contacts" on contacts
  for all using (
    organization_id in (select organization_id from staff where user_id = auth.uid())
  );

-- Policies for email_lists
create policy "Org members can manage lists" on email_lists
  for all using (
    organization_id in (select organization_id from staff where user_id = auth.uid())
  );

-- Policies for email_list_members
create policy "Org members can manage list members" on email_list_members
  for all using (
    list_id in (
      select el.id from email_lists el
      join staff s on s.organization_id = el.organization_id
      where s.user_id = auth.uid()
    )
  );

-- Policies for email_campaigns
create policy "Org members can manage campaigns" on email_campaigns
  for all using (
    organization_id in (select organization_id from staff where user_id = auth.uid())
  );

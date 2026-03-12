-- ============================================================
-- LEKKERSTOCK — SUPABASE SCHEMA
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── PROFILES ───────────────────────────────────────────────
create table public.profiles (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null unique references auth.users(id) on delete cascade,
  full_name       text not null default '',
  avatar_url      text,
  bio             text,
  role            text not null default 'buyer' check (role in ('buyer','contributor','admin')),
  plan            text not null default 'free' check (plan in ('free','buyer_pro','buyer_studio','contributor_pro')),
  country         text,
  website         text,
  paystack_customer_id        text,
  paystack_subscription_code  text,
  total_earnings      numeric(12,2) not null default 0,
  available_balance   numeric(12,2) not null default 0,
  downloads_this_month integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── ASSETS ─────────────────────────────────────────────────
create table public.assets (
  id              uuid primary key default uuid_generate_v4(),
  contributor_id  uuid not null references public.profiles(id) on delete cascade,
  title           text not null,
  description     text,
  tags            text[] not null default '{}',
  type            text not null default 'photo' check (type in ('photo','video','illustration','3d')),
  status          text not null default 'pending' check (status in ('pending','approved','rejected')),
  rejection_reason text,
  file_url        text not null,
  preview_url     text not null,
  thumbnail_url   text not null,
  file_size       bigint not null default 0,
  width           integer,
  height          integer,
  duration        numeric(10,2),
  downloads       integer not null default 0,
  views           integer not null default 0,
  price_usd       numeric(10,2) not null default 15.00,
  price_ngn       numeric(10,2) not null default 22500.00,
  is_editorial    boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index assets_contributor_idx on public.assets(contributor_id);
create index assets_status_idx on public.assets(status);
create index assets_type_idx on public.assets(type);
create index assets_tags_idx on public.assets using gin(tags);
create index assets_created_idx on public.assets(created_at desc);



-- ─── LICENSES ───────────────────────────────────────────────
create table public.licenses (
  id              uuid primary key default uuid_generate_v4(),
  asset_id        uuid not null references public.assets(id) on delete restrict,
  buyer_id        uuid not null references public.profiles(id) on delete restrict,
  license_type    text not null default 'standard' check (license_type in ('standard','extended','editorial')),
  price_paid      numeric(10,2) not null,
  currency        text not null check (currency in ('NGN','USD')),
  transaction_ref text not null unique,
  created_at      timestamptz not null default now()
);

create index licenses_buyer_idx on public.licenses(buyer_id);
create index licenses_asset_idx on public.licenses(asset_id);

-- ─── SUBSCRIPTIONS ──────────────────────────────────────────
create table public.subscriptions (
  id                          uuid primary key default uuid_generate_v4(),
  user_id                     uuid not null references public.profiles(id) on delete cascade,
  plan                        text not null,
  paystack_subscription_code  text not null unique,
  paystack_email_token        text,
  status                      text not null default 'active' check (status in ('active','cancelled','expired')),
  currency                    text not null check (currency in ('NGN','USD')),
  amount                      numeric(10,2) not null,
  current_period_start        timestamptz,
  current_period_end          timestamptz,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index subscriptions_user_idx on public.subscriptions(user_id);

-- ─── WITHDRAWALS ────────────────────────────────────────────
create table public.withdrawals (
  id                      uuid primary key default uuid_generate_v4(),
  contributor_id          uuid not null references public.profiles(id) on delete restrict,
  amount                  numeric(10,2) not null,
  currency                text not null check (currency in ('NGN','USD')),
  bank_name               text not null,
  account_number          text not null,
  account_name            text not null,
  status                  text not null default 'pending' check (status in ('pending','processing','completed','failed')),
  paystack_transfer_code  text,
  failure_reason          text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index withdrawals_contributor_idx on public.withdrawals(contributor_id);

-- ─── EARNINGS (per-download ledger) ─────────────────────────
create table public.earnings (
  id              uuid primary key default uuid_generate_v4(),
  contributor_id  uuid not null references public.profiles(id) on delete cascade,
  license_id      uuid not null references public.licenses(id) on delete restrict,
  asset_id        uuid not null references public.assets(id) on delete restrict,
  gross_amount    numeric(10,2) not null,
  royalty_rate    numeric(5,2) not null default 60.00,
  net_amount      numeric(10,2) not null,
  currency        text not null,
  created_at      timestamptz not null default now()
);

create index earnings_contributor_idx on public.earnings(contributor_id);

-- ─── COLLECTIONS ────────────────────────────────────────────
create table public.collections (
  id              uuid primary key default uuid_generate_v4(),
  buyer_id        uuid not null references public.profiles(id) on delete cascade,
  name            text not null,
  is_public       boolean not null default false,
  created_at      timestamptz not null default now()
);

create table public.collection_items (
  collection_id   uuid not null references public.collections(id) on delete cascade,
  asset_id        uuid not null references public.assets(id) on delete cascade,
  added_at        timestamptz not null default now(),
  primary key (collection_id, asset_id)
);

-- ─── ROW LEVEL SECURITY ─────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.assets enable row level security;
alter table public.licenses enable row level security;
alter table public.subscriptions enable row level security;
alter table public.withdrawals enable row level security;
alter table public.earnings enable row level security;
alter table public.collections enable row level security;
alter table public.collection_items enable row level security;

-- Profiles: users can read all, write own
create policy "Public profiles are viewable" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = user_id);

-- Assets: approved are public, contributors manage own
create policy "Approved assets are public" on public.assets for select using (status = 'approved');
create policy "Contributors see own assets" on public.assets for select using (auth.uid() = (select user_id from profiles where id = contributor_id));
create policy "Contributors insert own assets" on public.assets for insert with check (auth.uid() = (select user_id from profiles where id = contributor_id));
create policy "Contributors update own assets" on public.assets for update using (auth.uid() = (select user_id from profiles where id = contributor_id));

-- Licenses: buyers see own
create policy "Buyers see own licenses" on public.licenses for select using (auth.uid() = (select user_id from profiles where id = buyer_id));

-- Subscriptions: users see own
create policy "Users see own subscriptions" on public.subscriptions for select using (auth.uid() = (select user_id from profiles where id = user_id));

-- Withdrawals: contributors see own
create policy "Contributors see own withdrawals" on public.withdrawals for select using (auth.uid() = (select user_id from profiles where id = contributor_id));

-- Earnings: contributors see own
create policy "Contributors see own earnings" on public.earnings for select using (auth.uid() = (select user_id from profiles where id = contributor_id));

-- Collections
create policy "Public collections viewable" on public.collections for select using (is_public = true or auth.uid() = (select user_id from profiles where id = buyer_id));
create policy "Users manage own collections" on public.collections for all using (auth.uid() = (select user_id from profiles where id = buyer_id));

-- ─── STORAGE BUCKETS ────────────────────────────────────────
-- Run these in Supabase Dashboard → Storage
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('assets',    'assets',    false, 524288000, array['image/jpeg','image/png','image/webp','image/tiff','video/mp4','video/quicktime']),
  ('previews',  'previews',  true,  10485760,  array['image/jpeg','image/png','image/webp']),
  ('avatars',   'avatars',   true,  2097152,   array['image/jpeg','image/png','image/webp'])
on conflict do nothing;

-- Storage policies
create policy "Contributors upload assets" on storage.objects for insert
  with check (bucket_id = 'assets' and auth.role() = 'authenticated');
create policy "Previews are public" on storage.objects for select
  using (bucket_id = 'previews');
create policy "Avatars are public" on storage.objects for select
  using (bucket_id = 'avatars');
create policy "Users upload own avatar" on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- ─── HELPER FUNCTIONS ───────────────────────────────────────
-- Increment asset views
create or replace function increment_asset_views(asset_id uuid)
returns void language plpgsql security definer as $$
begin
  update public.assets set views = views + 1 where id = asset_id;
end;
$$;

-- Record a download and pay contributor
create or replace function record_download(
  p_asset_id uuid,
  p_buyer_id uuid,
  p_license_type text,
  p_price numeric,
  p_currency text,
  p_transaction_ref text
) returns uuid language plpgsql security definer as $$
declare
  v_license_id uuid;
  v_contributor_id uuid;
  v_royalty_rate numeric;
  v_net numeric;
begin
  -- Get contributor
  select contributor_id into v_contributor_id from public.assets where id = p_asset_id;

  -- Determine royalty rate based on plan
  select case
    when plan = 'contributor_pro' then 65.00
    else 60.00
  end into v_royalty_rate
  from public.profiles where id = v_contributor_id;

  v_net := p_price * (v_royalty_rate / 100);

  -- Create license
  insert into public.licenses (asset_id, buyer_id, license_type, price_paid, currency, transaction_ref)
  values (p_asset_id, p_buyer_id, p_license_type, p_price, p_currency, p_transaction_ref)
  returning id into v_license_id;

  -- Record earning
  insert into public.earnings (contributor_id, license_id, asset_id, gross_amount, royalty_rate, net_amount, currency)
  values (v_contributor_id, v_license_id, p_asset_id, p_price, v_royalty_rate, v_net, p_currency);

  -- Update contributor balance
  update public.profiles
  set total_earnings = total_earnings + v_net,
      available_balance = available_balance + v_net
  where id = v_contributor_id;

  -- Increment download count
  update public.assets set downloads = downloads + 1 where id = p_asset_id;

  return v_license_id;
end;
$$;

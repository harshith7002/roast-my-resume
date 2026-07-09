-- ── Macoostudy 2.0 Supabase Schema ──

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table (Synced from auth.users)
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text unique not null,
    full_name text,
    avatar_url text,
    credits integer default 5, -- 5 free starter credits
    tier text default 'free' check (tier in ('free', 'pro', 'pro_plus')),
    created_at timestamp with time zone default timezone('utc'::text, now()),
    last_active_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS on Profiles
alter table public.profiles enable row level security;

create policy "Allow public read access to profiles"
    on public.profiles for select
    using (true);

create policy "Allow users to update their own profile"
    on public.profiles for update
    using (auth.uid() = id);

-- Trigger to automatically create a profile when a new user signs up in auth.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, email, full_name, avatar_url, credits, tier)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'User'),
        new.raw_user_meta_data->>'avatar_url',
        5,
        'free'
    );
    return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();


-- 2. Analyses Table (Resume Roast, JD Matches, Company Compare)
-- NO raw_text or PDF files are stored in the database.
create table public.analyses (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) on delete set null,
    filename text not null,
    type text not null check (type in ('roast', 'jd_match', 'company_compare', 'rewrite', 'interview_prep')),
    ats_score integer,
    verdict text,
    result_json jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS on Analyses
alter table public.analyses enable row level security;

create policy "Allow users to read their own analyses"
    on public.analyses for select
    using (auth.uid() = user_id);

create policy "Allow users to insert their own analyses"
    on public.analyses for insert
    with check (auth.uid() = user_id);

create policy "Allow users to delete their own analyses"
    on public.analyses for delete
    using (auth.uid() = user_id);


-- 3. Resume Chat Messages Table (AI Chat sessions)
create table public.chat_messages (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) on delete cascade,
    analysis_id uuid references public.analyses(id) on delete cascade,
    role text not null check (role in ('user', 'assistant')),
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS on Chat Messages
alter table public.chat_messages enable row level security;

create policy "Allow users to read their own chat messages"
    on public.chat_messages for select
    using (auth.uid() = user_id);

create policy "Allow users to insert their own chat messages"
    on public.chat_messages for insert
    with check (auth.uid() = user_id);


-- 4. Transactions Table (Razorpay billing tracking)
create table public.transactions (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) on delete cascade,
    razorpay_order_id text unique not null,
    razorpay_payment_id text,
    amount integer not null, -- in paise
    status text not null check (status in ('created', 'paid', 'failed')),
    tier_purchased text not null check (tier_purchased in ('pro', 'pro_plus')),
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS on Transactions
alter table public.transactions enable row level security;

create policy "Allow users to view their own transactions"
    on public.transactions for select
    using (auth.uid() = user_id);

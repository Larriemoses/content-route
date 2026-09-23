create extension if not exists pgcrypto;
create extension if not exists vector;

create table profiles (id uuid primary key references auth.users(id) on delete cascade, email text not null, display_name text not null, timezone text not null default 'Africa/Lagos', publishing_paused boolean not null default true, daily_post_limit integer not null default 1, minimum_publish_score integer not null default 85, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table content_routes (id uuid primary key default gen_random_uuid(), name text not null, description text not null, audience text not null, required_structure jsonb not null default '{}'::jsonb, evidence_level text not null, enabled boolean not null default true, minimum_gap_days integer not null default 0, weight numeric not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table content_ideas (id uuid primary key default gen_random_uuid(), title text not null, raw_note text not null, route_id uuid references content_routes(id), status text not null default 'new' check (status in ('new','planned','used','archived')), not_before timestamptz, expires_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table content_sources (id uuid primary key default gen_random_uuid(), idea_id uuid references content_ideas(id) on delete cascade, url text, title text not null, publisher text, published_at timestamptz, source_type text not null check (source_type in ('primary','secondary','personal_note')), retrieved_at timestamptz, excerpt text, content_hash text, verification_status text not null default 'unverified', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table drafts (id uuid primary key default gen_random_uuid(), idea_id uuid references content_ideas(id), revision_number integer not null default 0, body text not null, reader_gain text not null, factual_claims jsonb not null default '[]'::jsonb, source_ids uuid[] not null default '{}', status text not null default 'generated' check (status in ('generated','evaluating','failed','passed','scheduled','published','skipped')), final_score numeric, failure_reasons jsonb not null default '[]'::jsonb, embedding vector(1536), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table evaluations (id uuid primary key default gen_random_uuid(), draft_id uuid not null references drafts(id) on delete cascade, gate_name text not null, gate_version text not null, evaluator_type text not null check (evaluator_type in ('deterministic','model')), passed boolean not null, score numeric, reason text not null, evidence jsonb not null default '{}'::jsonb, model text, created_at timestamptz not null default now());
create table audit_events (id uuid primary key default gen_random_uuid(), event_type text not null, entity_type text not null, entity_id uuid, actor text not null check (actor in ('owner','scheduler','system')), details jsonb not null default '{}'::jsonb, created_at timestamptz not null default now());

alter table profiles enable row level security;
alter table content_routes enable row level security;
alter table content_ideas enable row level security;
alter table content_sources enable row level security;
alter table drafts enable row level security;
alter table evaluations enable row level security;
alter table audit_events enable row level security;

create policy "owner reads own profile" on profiles for select using (auth.uid() = id);
create policy "owner manages routes" on content_routes for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "owner manages ideas" on content_ideas for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "owner manages sources" on content_sources for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "owner reads drafts" on drafts for select using (auth.uid() is not null);
create policy "owner reads evaluations" on evaluations for select using (auth.uid() is not null);
create policy "owner reads audit" on audit_events for select using (auth.uid() is not null);

create table if not exists content_drafts (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid references content_ideas(id) on delete set null,
  headline text not null,
  body text not null,
  follow_up_comment text,
  source_urls jsonb not null default '[]'::jsonb,
  status text not null default 'review' check (status in ('review','approved','scheduled','published','rejected')),
  scheduled_for timestamptz,
  linkedin_post_urn text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists content_drafts_status_schedule_idx on content_drafts(status, scheduled_for);
alter table content_drafts enable row level security;

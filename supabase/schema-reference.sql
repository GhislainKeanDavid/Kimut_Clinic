-- REFERENCE ONLY — do NOT run on the live project unless additive
-- This is what already exists in Supabase project qhhxiplzmxtxlkmmaqxs

/*
create table public.patient_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  submission_date timestamptz,            -- set by n8n in Asia/Manila timezone, stored UTC
  full_name text,
  age text,                                -- stored as text, not int
  sex text,
  email text,                              -- NOT unique; same patient can have multiple bookings
  phone_number text,
  occupation text,
  service text,
  datetime text,                           -- ISO 8601 string, Asia/Manila offset
  datetime_parsed timestamptz,             -- parsed for date queries
  status text default 'Booked',            -- 'Booked' | 'Confirmed' | 'Showed Up' | 'No Show' | 'Lost'
  status_updated_at timestamptz default now(),
  reminder_sent boolean default false,     -- L1 day-before reminder
  follow_up_count integer default 0,       -- L2 no-show follow-up tracking (0→1→2)
  re_engagement_sent_at timestamptz,       -- L3 dedup
  escalation_sent boolean default false    -- L4 stale booked escalation
);
*/

-- ==========================================
-- ADDITIVE CHANGES FOR SVELTE DASHBOARD
-- ==========================================

-- Additive columns for the new admin dashboard. Safe to run on the live project.
alter table public.patient_leads add column if not exists assigned_pt text;  -- 'reyes' | 'santos' | 'dizon'
alter table public.patient_leads add column if not exists internal_notes text;

-- NEW table — safe to create. Feeds the admin dashboard's funnel/conversion charts.
create table public.funnel_events (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,            -- generated on first visit, persisted in localStorage
  event text not null check (event in (
    'page_view','form_started',
    'step_1_completed','step_2_completed','step_3_completed',
    'step_4_completed','step_5_completed','step_6_completed',
    'submitted','submission_failed'
  )),
  created_at timestamptz not null default now(),
  utm_source text,
  utm_medium text,
  utm_campaign text,
  user_agent text,
  -- if/when the submission succeeds, we link back to the patient_leads row
  patient_lead_id uuid references public.patient_leads(id)
);
create index funnel_events_session_idx on public.funnel_events (session_id);
create index funnel_events_created_idx on public.funnel_events (created_at desc);
create index funnel_events_lead_idx on public.funnel_events (patient_lead_id);

-- enable RLS on the new table only
alter table public.funnel_events enable row level security;

create policy "anon can insert funnel events"
on public.funnel_events for insert
to anon
with check (true);

create policy "auth can read funnel events"
on public.funnel_events for select
to authenticated
using (true);

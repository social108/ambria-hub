-- Maps our internal page ids (see PAGES in src/lib/constants.js) to the
-- Instagram Business Account ID Meta uses for Graph API calls. Run this once
-- in the Supabase SQL editor before deploying the instagram-stats function.
--
-- The Instagram *access token* is NOT stored here — it's a secret and lives
-- only in the instagram-stats Edge Function's environment
-- (supabase secrets set INSTAGRAM_ACCESS_TOKEN=...). This table only holds
-- the (non-secret) account id per page, editable by admin from the Pages tab.

create table if not exists instagram_accounts (
  page_id text primary key,
  ig_business_id text not null,
  updated_at timestamptz not null default now()
);

alter table instagram_accounts enable row level security;

-- Any signed-in user can read the mapping (needed so the Pages tab knows
-- which pages are connected). Only admins can add/change a mapping —
-- mirrors how department/team management is gated elsewhere in this app.
create policy "instagram_accounts_select_authenticated"
  on instagram_accounts for select
  to authenticated
  using (true);

create policy "instagram_accounts_upsert_admin"
  on instagram_accounts for insert
  to authenticated
  with check (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.department = 'admin')
  );

create policy "instagram_accounts_update_admin"
  on instagram_accounts for update
  to authenticated
  using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.department = 'admin')
  );

create policy "instagram_accounts_delete_admin"
  on instagram_accounts for delete
  to authenticated
  using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.department = 'admin')
  );

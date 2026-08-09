-- Adds the sub-targets selected under the "API Campaign" action on an event
-- (Pushpanjali, Manaktala, Exotica, Catering, Decor, Corporate,
--  Restaurant Palam, Restaurant Janakpuri, GYV).
--
-- Built-in events don't need this: their edits are stored in the
-- builtin_overrides.overrides jsonb column, which already carries the field.
-- Only custom_events has one column per field.
--
-- Run once in the Supabase SQL editor. Safe to re-run.

alter table public.custom_events
  add column if not exists api_campaigns text[] not null default '{}';

create or replace function public.is_v4_user()
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce(auth.jwt() ->> 'email', '') ilike '%@v4company.com';
$$;

create or replace function public.is_app_admin()
returns boolean
language sql
stable
set search_path = public
as $$
  select
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    or lower(coalesce(auth.jwt() ->> 'email', '')) = any (array[
      'bianca.segato@v4company.com'
    ]);
$$;

alter table public.app_state enable row level security;
alter table public.health_inputs enable row level security;
alter table public.health_score_history enable row level security;

alter table public.health_score_history
  add column if not exists operation text,
  add column if not exists old_values jsonb,
  add column if not exists new_values jsonb;

drop policy if exists "Enable public access" on public.app_state;
drop policy if exists "Enable all access for authenticated users" on public.app_state;
drop policy if exists "app_state_select_v4_users" on public.app_state;
drop policy if exists "app_state_insert_admins" on public.app_state;
drop policy if exists "app_state_update_admins" on public.app_state;
drop policy if exists "app_state_delete_admins" on public.app_state;

create policy "app_state_select_v4_users"
  on public.app_state
  for select
  to authenticated
  using (public.is_v4_user());

create policy "app_state_insert_admins"
  on public.app_state
  for insert
  to authenticated
  with check (public.is_app_admin());

create policy "app_state_update_admins"
  on public.app_state
  for update
  to authenticated
  using (public.is_app_admin())
  with check (public.is_app_admin());

create policy "app_state_delete_admins"
  on public.app_state
  for delete
  to authenticated
  using (public.is_app_admin());

drop policy if exists "Enable public access" on public.health_inputs;
drop policy if exists "Enable all access for authenticated users" on public.health_inputs;
drop policy if exists "health_inputs_select_v4_users" on public.health_inputs;
drop policy if exists "health_inputs_insert_admins" on public.health_inputs;
drop policy if exists "health_inputs_update_admins" on public.health_inputs;
drop policy if exists "health_inputs_delete_admins" on public.health_inputs;

create policy "health_inputs_select_v4_users"
  on public.health_inputs
  for select
  to authenticated
  using (public.is_v4_user());

create policy "health_inputs_insert_admins"
  on public.health_inputs
  for insert
  to authenticated
  with check (public.is_app_admin());

create policy "health_inputs_update_admins"
  on public.health_inputs
  for update
  to authenticated
  using (public.is_app_admin())
  with check (public.is_app_admin());

create policy "health_inputs_delete_admins"
  on public.health_inputs
  for delete
  to authenticated
  using (public.is_app_admin());

drop policy if exists "Enable public access" on public.health_score_history;
drop policy if exists "Enable all access for authenticated users" on public.health_score_history;
drop policy if exists "health_score_history_select_v4_users" on public.health_score_history;
drop policy if exists "health_score_history_insert_admins" on public.health_score_history;
drop policy if exists "health_score_history_update_admins" on public.health_score_history;
drop policy if exists "health_score_history_delete_admins" on public.health_score_history;

create policy "health_score_history_select_v4_users"
  on public.health_score_history
  for select
  to authenticated
  using (public.is_v4_user());

create policy "health_score_history_insert_admins"
  on public.health_score_history
  for insert
  to authenticated
  with check (public.is_app_admin());

create policy "health_score_history_update_admins"
  on public.health_score_history
  for update
  to authenticated
  using (public.is_app_admin())
  with check (public.is_app_admin());

create policy "health_score_history_delete_admins"
  on public.health_score_history
  for delete
  to authenticated
  using (public.is_app_admin());

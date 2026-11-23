/*
  Leslie Cosmétique — CRM / tableau de bord admin
  Projet Supabase partagé : tous les objets sont préfixés « lc_ » et n'utilisent pas l'authentification
  Supabase du projet hôte (comptes admin propres, sessions par jeton).

  Tables
  - lc_booking_requests : demandes de réservation (coachings, consultation, audit)
  - lc_events           : mesure d'audience anonyme (pages vues, vues/clics d'offres…)
  - lc_questions        : questions posées depuis le site (support)
  - lc_payments         : paiements (Stripe ou saisie manuelle)
  - lc_admins / lc_admin_sessions / lc_settings : accès admin

  Sécurité
  - RLS activé partout. Le public (anon) peut seulement INSÉRER des réservations, événements et questions,
    sur une liste blanche de colonnes. Aucune lecture publique.
  - Toutes les lectures admin passent par des fonctions SECURITY DEFINER qui vérifient un jeton de session.
*/

-- ───────────────────────── Réservations ─────────────────────────
create table if not exists public.lc_booking_requests (
  id uuid primary key default gen_random_uuid(),
  offer_slug text not null check (offer_slug in ('coaching-formulation','consultation-lancement-marque','audit-orientation')),
  starts_at timestamptz not null,
  full_name text not null check (char_length(full_name) between 2 and 120),
  email text not null check (char_length(email) <= 200 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text not null default '' check (char_length(phone) <= 40),
  message text not null default '' check (char_length(message) <= 2000),
  status text not null default 'pending' check (status in ('pending','confirmed','cancelled','done')),
  admin_note text not null default '' check (char_length(admin_note) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists lc_booking_requests_active_slot on public.lc_booking_requests (starts_at) where status <> 'cancelled';
create index if not exists lc_booking_requests_created on public.lc_booking_requests (created_at);
alter table public.lc_booking_requests enable row level security;
revoke all on table public.lc_booking_requests from anon, authenticated;
grant insert (offer_slug, starts_at, full_name, email, phone, message) on public.lc_booking_requests to anon, authenticated;
drop policy if exists lc_booking_insert on public.lc_booking_requests;
create policy lc_booking_insert on public.lc_booking_requests for insert to anon, authenticated
  with check (status = 'pending' and admin_note = '' and starts_at > now() and starts_at < now() + interval '120 days');

create or replace function public.lc_get_taken_slots(range_from timestamptz, range_to timestamptz)
returns table (starts_at timestamptz)
language sql stable security definer set search_path = public as $$
  select b.starts_at from public.lc_booking_requests b
  where b.status <> 'cancelled' and b.starts_at >= range_from and b.starts_at < range_to
    and range_to - range_from <= interval '62 days';
$$;

-- ───────────────────────── Audience ─────────────────────────
create table if not exists public.lc_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event text not null check (event in ('page_view','view_offer','offer_click','buy_click','signup_click','audit_book_click','booking_link_click','booking_offer_select','booking_submit','question_submit')),
  visitor_id text not null check (char_length(visitor_id) between 8 and 64),
  session_id text not null check (char_length(session_id) between 8 and 64),
  path text not null default '' check (char_length(path) <= 300),
  offer_slug text not null default '' check (char_length(offer_slug) <= 80),
  label text not null default '' check (char_length(label) <= 120),
  referrer text not null default '' check (char_length(referrer) <= 200),
  utm_source text not null default '' check (char_length(utm_source) <= 80),
  device text not null default '' check (device in ('','mobile','tablet','desktop'))
);
create index if not exists lc_events_created on public.lc_events (created_at);
create index if not exists lc_events_event_created on public.lc_events (event, created_at);
alter table public.lc_events enable row level security;
revoke all on table public.lc_events from anon, authenticated;
grant insert (event, visitor_id, session_id, path, offer_slug, label, referrer, utm_source, device) on public.lc_events to anon, authenticated;
drop policy if exists lc_events_insert on public.lc_events;
create policy lc_events_insert on public.lc_events for insert to anon, authenticated with check (true);

-- ───────────────────────── Questions (support) ─────────────────────────
create table if not exists public.lc_questions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  full_name text not null check (char_length(full_name) between 2 and 120),
  email text not null check (char_length(email) <= 200 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  message text not null check (char_length(message) between 5 and 3000),
  page text not null default '' check (char_length(page) <= 300),
  status text not null default 'new' check (status in ('new','in_progress','answered','archived')),
  admin_note text not null default '' check (char_length(admin_note) <= 3000)
);
create index if not exists lc_questions_created on public.lc_questions (created_at);
alter table public.lc_questions enable row level security;
revoke all on table public.lc_questions from anon, authenticated;
grant insert (full_name, email, message, page) on public.lc_questions to anon, authenticated;
drop policy if exists lc_questions_insert on public.lc_questions;
create policy lc_questions_insert on public.lc_questions for insert to anon, authenticated
  with check (status = 'new' and admin_note = '');

-- ───────────────────────── Paiements ─────────────────────────
create table if not exists public.lc_payments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  paid_at timestamptz not null default now(),
  provider text not null default 'stripe' check (provider in ('stripe','manuel')),
  provider_session_id text unique,
  provider_payment_id text,
  offer_slug text not null default '',
  offer_name text not null default '',
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'eur',
  status text not null default 'paid' check (status in ('pending','paid','refunded','failed')),
  customer_name text not null default '',
  customer_email text not null default '',
  booking_id uuid references public.lc_booking_requests(id) on delete set null,
  note text not null default '',
  metadata jsonb not null default '{}'::jsonb
);
create index if not exists lc_payments_paid_at on public.lc_payments (paid_at);
alter table public.lc_payments enable row level security;
revoke all on table public.lc_payments from anon, authenticated;

-- ───────────────────────── Admin ─────────────────────────
create table if not exists public.lc_admins (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  display_name text not null default '',
  failed_attempts integer not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists public.lc_admin_sessions (
  token_hash text primary key,
  admin_id uuid not null references public.lc_admins(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create table if not exists public.lc_settings (
  key text primary key,
  value text not null
);
alter table public.lc_admins enable row level security;
alter table public.lc_admin_sessions enable row level security;
alter table public.lc_settings enable row level security;
revoke all on table public.lc_admins, public.lc_admin_sessions, public.lc_settings from anon, authenticated;
insert into public.lc_settings (key, value) values ('calendar_token', encode(extensions.gen_random_bytes(24), 'hex'))
  on conflict (key) do nothing;

-- Vérifie un jeton de session et renvoie l'identifiant admin (usage interne).
create or replace function public.lc__admin(p_token text)
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare aid uuid;
begin
  select s.admin_id into aid from public.lc_admin_sessions s
  where s.token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex') and s.expires_at > now();
  if aid is null then
    raise exception 'Session expirée, reconnectez-vous.' using errcode = '28000';
  end if;
  return aid;
end $$;

create or replace function public.lc_admin_login(p_email text, p_password text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare a public.lc_admins; tok text;
begin
  select * into a from public.lc_admins where email = lower(trim(p_email));
  if not found then
    perform pg_sleep(0.6);
    return json_build_object('ok', false, 'error', 'Identifiants incorrects.');
  end if;
  if a.locked_until is not null and a.locked_until > now() then
    return json_build_object('ok', false, 'error', 'Trop de tentatives. Réessayez dans quelques minutes.');
  end if;
  if a.password_hash <> crypt(coalesce(p_password, ''), a.password_hash) then
    update public.lc_admins
      set failed_attempts = failed_attempts + 1,
          locked_until = case when failed_attempts + 1 >= 5 then now() + interval '15 minutes' else null end
      where id = a.id;
    perform pg_sleep(0.6);
    return json_build_object('ok', false, 'error', 'Identifiants incorrects.');
  end if;
  update public.lc_admins set failed_attempts = 0, locked_until = null where id = a.id;
  delete from public.lc_admin_sessions where expires_at < now();
  tok := encode(gen_random_bytes(32), 'hex');
  insert into public.lc_admin_sessions (token_hash, admin_id, expires_at)
    values (encode(digest(tok, 'sha256'), 'hex'), a.id, now() + interval '30 days');
  return json_build_object('ok', true, 'token', tok, 'email', a.email, 'name', a.display_name);
end $$;

create or replace function public.lc_admin_logout(p_token text)
returns void language sql security definer set search_path = public, extensions as $$
  delete from public.lc_admin_sessions where token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex');
$$;

create or replace function public.lc_admin_me(p_token text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare aid uuid := public.lc__admin(p_token); r json;
begin
  select json_build_object('email', email, 'name', display_name) into r from public.lc_admins where id = aid;
  return r;
end $$;

create or replace function public.lc_admin_change_password(p_token text, p_old text, p_new text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare aid uuid := public.lc__admin(p_token); h text;
begin
  select password_hash into h from public.lc_admins where id = aid;
  if h <> crypt(coalesce(p_old, ''), h) then
    return json_build_object('ok', false, 'error', 'Mot de passe actuel incorrect.');
  end if;
  if char_length(coalesce(p_new, '')) < 10 then
    return json_build_object('ok', false, 'error', 'Le nouveau mot de passe doit faire au moins 10 caractères.');
  end if;
  update public.lc_admins set password_hash = crypt(p_new, gen_salt('bf', 10)) where id = aid;
  delete from public.lc_admin_sessions
    where admin_id = aid and token_hash <> encode(digest(p_token, 'sha256'), 'hex');
  return json_build_object('ok', true);
end $$;

-- Noms et durées des offres (affichage admin et agenda)
create or replace function public.lc__offer_name(p_slug text)
returns text language sql immutable as $$
  select case p_slug
    when 'coaching-formulation' then 'Coaching Formulation'
    when 'consultation-lancement-marque' then 'Consultation Lancement de Marque'
    when 'audit-orientation' then 'Audit d''orientation'
    when 'guide-recettes-capillaires' then 'Guide de 10 recettes capillaires'
    when 'guide-formulation' then 'Guide de formulation'
    else p_slug end;
$$;
create or replace function public.lc__offer_minutes(p_slug text)
returns integer language sql immutable as $$
  select case p_slug when 'audit-orientation' then 30 else 60 end;
$$;

-- ───────────── Vue d'ensemble (audience, conversions, chiffre d'affaires) ─────────────
create or replace function public.lc_admin_overview(p_token text, p_from timestamptz, p_to timestamptz)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare r json;
begin
  perform public.lc__admin(p_token);
  with ev as (
    select * from public.lc_events where created_at >= p_from and created_at < p_to
  ), days as (
    select generate_series(
      date_trunc('day', p_from at time zone 'Europe/Paris'),
      date_trunc('day', (p_to - interval '1 second') at time zone 'Europe/Paris'),
      interval '1 day')::date as d
  )
  select json_build_object(
    'visitors', (select count(distinct visitor_id) from ev),
    'visits', (select count(distinct session_id) from ev),
    'page_views', (select count(*) from ev where event = 'page_view'),
    'offer_views', (select count(*) from ev where event = 'view_offer'),
    'offer_clicks', (select count(*) from ev where event = 'offer_click'),
    'buy_clicks', (select count(*) from ev where event in ('buy_click','signup_click','audit_book_click','booking_link_click')),
    'bookings', (select count(*) from public.lc_booking_requests where created_at >= p_from and created_at < p_to),
    'questions', (select count(*) from public.lc_questions where created_at >= p_from and created_at < p_to),
    'revenue_cents', (select coalesce(sum(amount_cents), 0) from public.lc_payments where status = 'paid' and paid_at >= p_from and paid_at < p_to),
    'sales', (select count(*) from public.lc_payments where status = 'paid' and paid_at >= p_from and paid_at < p_to),
    'daily', (
      select coalesce(json_agg(json_build_object(
        'day', d,
        'visitors', (select count(distinct visitor_id) from ev where (created_at at time zone 'Europe/Paris')::date = d),
        'page_views', (select count(*) from ev where event = 'page_view' and (created_at at time zone 'Europe/Paris')::date = d),
        'offer_clicks', (select count(*) from ev where event in ('offer_click','view_offer') and (created_at at time zone 'Europe/Paris')::date = d),
        'bookings', (select count(*) from public.lc_booking_requests b where (b.created_at at time zone 'Europe/Paris')::date = d),
        'questions', (select count(*) from public.lc_questions q where (q.created_at at time zone 'Europe/Paris')::date = d),
        'revenue_cents', (select coalesce(sum(amount_cents), 0) from public.lc_payments p where p.status = 'paid' and (p.paid_at at time zone 'Europe/Paris')::date = d)
      ) order by d), '[]'::json) from days
    ),
    'top_offers', (
      select coalesce(json_agg(t order by t.views + t.clicks desc), '[]'::json) from (
        select offer_slug as slug, public.lc__offer_name(offer_slug) as name,
          count(*) filter (where event = 'view_offer') as views,
          count(*) filter (where event in ('offer_click','buy_click','signup_click','audit_book_click','booking_link_click','booking_offer_select')) as clicks
        from ev where offer_slug <> '' group by offer_slug
      ) t
    ),
    'top_pages', (
      select coalesce(json_agg(t), '[]'::json) from (
        select path, count(*) as views from ev where event = 'page_view' group by path order by count(*) desc limit 8
      ) t
    ),
    'sources', (
      select coalesce(json_agg(t), '[]'::json) from (
        select coalesce(nullif(utm_source, ''), nullif(referrer, ''), 'Accès direct') as source, count(distinct visitor_id) as visitors
        from ev group by 1 order by 2 desc limit 8
      ) t
    ),
    'devices', (
      select coalesce(json_agg(t), '[]'::json) from (
        select coalesce(nullif(device, ''), 'inconnu') as device, count(distinct visitor_id) as visitors from ev group by 1 order by 2 desc
      ) t
    )
  ) into r;
  return r;
end $$;

-- ───────────── Agenda ─────────────
create or replace function public.lc_admin_bookings(p_token text, p_from timestamptz, p_to timestamptz)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare r json;
begin
  perform public.lc__admin(p_token);
  select coalesce(json_agg(json_build_object(
    'id', id, 'offer_slug', offer_slug, 'offer_name', public.lc__offer_name(offer_slug),
    'minutes', public.lc__offer_minutes(offer_slug), 'starts_at', starts_at,
    'full_name', full_name, 'email', email, 'phone', phone, 'message', message,
    'status', status, 'admin_note', admin_note, 'created_at', created_at
  ) order by starts_at), '[]'::json) into r
  from public.lc_booking_requests where starts_at >= p_from and starts_at < p_to;
  return r;
end $$;

create or replace function public.lc_admin_update_booking(p_token text, p_id uuid, p_status text, p_note text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public.lc__admin(p_token);
  update public.lc_booking_requests
    set status = coalesce(p_status, status), admin_note = coalesce(p_note, admin_note), updated_at = now()
    where id = p_id;
end $$;

-- ───────────── Support ─────────────
create or replace function public.lc_admin_questions(p_token text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare r json;
begin
  perform public.lc__admin(p_token);
  select coalesce(json_agg(json_build_object(
    'id', id, 'created_at', created_at, 'full_name', full_name, 'email', email, 'message', message,
    'page', page, 'status', status, 'admin_note', admin_note
  ) order by created_at desc), '[]'::json) into r from public.lc_questions;
  return r;
end $$;

create or replace function public.lc_admin_update_question(p_token text, p_id uuid, p_status text, p_note text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public.lc__admin(p_token);
  update public.lc_questions
    set status = coalesce(p_status, status), admin_note = coalesce(p_note, admin_note), updated_at = now()
    where id = p_id;
end $$;

-- ───────────── Paiements & chiffre d'affaires ─────────────
create or replace function public.lc_admin_payments(p_token text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare r json;
  m_start timestamptz := date_trunc('month', now() at time zone 'Europe/Paris') at time zone 'Europe/Paris';
  m_next timestamptz := (date_trunc('month', now() at time zone 'Europe/Paris') + interval '1 month') at time zone 'Europe/Paris';
  m_prev timestamptz := (date_trunc('month', now() at time zone 'Europe/Paris') - interval '1 month') at time zone 'Europe/Paris';
begin
  perform public.lc__admin(p_token);
  select json_build_object(
    'total_cents', (select coalesce(sum(amount_cents), 0) from public.lc_payments where status = 'paid'),
    'sales', (select count(*) from public.lc_payments where status = 'paid'),
    'month_cents', (select coalesce(sum(amount_cents), 0) from public.lc_payments where status = 'paid' and paid_at >= m_start and paid_at < m_next),
    'month_sales', (select count(*) from public.lc_payments where status = 'paid' and paid_at >= m_start and paid_at < m_next),
    'prev_month_cents', (select coalesce(sum(amount_cents), 0) from public.lc_payments where status = 'paid' and paid_at >= m_prev and paid_at < m_start),
    'month_start', m_start, 'month_end', m_next,
    'by_offer', (
      select coalesce(json_agg(t order by t.revenue_cents desc), '[]'::json) from (
        select offer_slug as slug, coalesce(nullif(max(offer_name), ''), public.lc__offer_name(offer_slug)) as name,
          count(*) as sales, sum(amount_cents) as revenue_cents
        from public.lc_payments where status = 'paid' group by offer_slug
      ) t
    ),
    'monthly', (
      select coalesce(json_agg(json_build_object('month', m, 'revenue_cents', (
        select coalesce(sum(amount_cents), 0) from public.lc_payments p
        where p.status = 'paid' and date_trunc('month', p.paid_at at time zone 'Europe/Paris') = m
      )) order by m), '[]'::json)
      from generate_series(date_trunc('month', now() at time zone 'Europe/Paris') - interval '11 months',
                           date_trunc('month', now() at time zone 'Europe/Paris'), interval '1 month') m
    ),
    'rows', (
      select coalesce(json_agg(json_build_object(
        'id', id, 'paid_at', paid_at, 'provider', provider, 'offer_slug', offer_slug,
        'offer_name', coalesce(nullif(offer_name, ''), public.lc__offer_name(offer_slug)),
        'amount_cents', amount_cents, 'currency', currency, 'status', status,
        'customer_name', customer_name, 'customer_email', customer_email, 'note', note
      ) order by paid_at desc), '[]'::json) from public.lc_payments
    )
  ) into r;
  return r;
end $$;

create or replace function public.lc_admin_add_payment(
  p_token text, p_offer_slug text, p_amount_cents integer, p_customer_name text, p_customer_email text,
  p_paid_at timestamptz, p_note text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public.lc__admin(p_token);
  insert into public.lc_payments (provider, offer_slug, offer_name, amount_cents, customer_name, customer_email, paid_at, note)
  values ('manuel', coalesce(p_offer_slug, ''), public.lc__offer_name(coalesce(p_offer_slug, '')), p_amount_cents,
          coalesce(p_customer_name, ''), lower(coalesce(p_customer_email, '')), coalesce(p_paid_at, now()), coalesce(p_note, ''));
end $$;

create or replace function public.lc_admin_update_payment(p_token text, p_id uuid, p_status text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public.lc__admin(p_token);
  update public.lc_payments set status = p_status where id = p_id;
end $$;

-- ───────────── Contacts (CRM) ─────────────
create or replace function public.lc_admin_contacts(p_token text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare r json;
begin
  perform public.lc__admin(p_token);
  with acts as (
    select lower(email) as email, full_name as name, phone, created_at as at, 'booking' as kind, 0 as cents from public.lc_booking_requests
    union all select lower(email), full_name, '', created_at, 'question', 0 from public.lc_questions
    union all select lower(customer_email), customer_name, '', paid_at, 'payment', case when status = 'paid' then amount_cents else 0 end
      from public.lc_payments where customer_email <> ''
  )
  select coalesce(json_agg(t order by t.last_at desc), '[]'::json) into r from (
    select email,
      (array_agg(name order by at desc) filter (where name <> ''))[1] as name,
      (array_agg(phone order by at desc) filter (where phone <> ''))[1] as phone,
      min(at) as first_at, max(at) as last_at,
      count(*) filter (where kind = 'booking') as bookings,
      count(*) filter (where kind = 'question') as questions,
      count(*) filter (where kind = 'payment') as payments,
      sum(cents) as total_cents
    from acts group by email
  ) t;
  return r;
end $$;

-- ───────────── Agenda externe (abonnement iCal) ─────────────
create or replace function public.lc_admin_settings(p_token text)
returns json language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public.lc__admin(p_token);
  return json_build_object('calendar_token', (select value from public.lc_settings where key = 'calendar_token'));
end $$;

create or replace function public.lc_admin_rotate_calendar_token(p_token text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare t text := encode(gen_random_bytes(24), 'hex');
begin
  perform public.lc__admin(p_token);
  insert into public.lc_settings (key, value) values ('calendar_token', t)
    on conflict (key) do update set value = excluded.value;
  return json_build_object('calendar_token', t);
end $$;

create or replace function public.lc__ics_escape(p text)
returns text language sql immutable as $$
  select replace(replace(replace(replace(coalesce(p, ''), '\', '\\'), ';', '\;'), ',', '\,'), E'\n', '\n');
$$;

create or replace function public.lc_calendar_ics(p_cal_token text)
returns text language plpgsql stable security definer set search_path = public, extensions as $$
declare body text;
begin
  if p_cal_token is null or p_cal_token <> (select value from public.lc_settings where key = 'calendar_token') then
    return null;
  end if;
  select string_agg(concat_ws(E'\r\n',
      'BEGIN:VEVENT',
      'UID:' || id || '@leslie-cosmetique',
      'DTSTAMP:' || to_char(updated_at at time zone 'UTC', 'YYYYMMDD"T"HH24MISS"Z"'),
      'DTSTART:' || to_char(starts_at at time zone 'UTC', 'YYYYMMDD"T"HH24MISS"Z"'),
      'DTEND:' || to_char((starts_at + make_interval(mins => public.lc__offer_minutes(offer_slug))) at time zone 'UTC', 'YYYYMMDD"T"HH24MISS"Z"'),
      'SUMMARY:' || public.lc__ics_escape(case when status = 'pending' then '[À confirmer] ' else '' end || public.lc__offer_name(offer_slug) || ' — ' || full_name),
      'DESCRIPTION:' || public.lc__ics_escape('E-mail : ' || email || E'\n' || 'Téléphone : ' || coalesce(nullif(phone, ''), '—') || E'\n' || 'Message : ' || coalesce(nullif(message, ''), '—')),
      'STATUS:' || case when status = 'pending' then 'TENTATIVE' else 'CONFIRMED' end,
      'END:VEVENT'), E'\r\n' order by starts_at)
    into body
  from public.lc_booking_requests
  where status in ('pending','confirmed') and starts_at > now() - interval '60 days' and starts_at < now() + interval '365 days';
  return concat_ws(E'\r\n',
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Leslie Cosmetique//Agenda//FR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'X-WR-CALNAME:Leslie Cosmétique — Rendez-vous', 'X-WR-TIMEZONE:Europe/Paris',
    body, 'END:VCALENDAR') || E'\r\n';
end $$;

-- ───────────── Droits d'exécution ─────────────
revoke execute on function public.lc__admin(text) from public, anon, authenticated;
revoke execute on function public.lc__offer_name(text) from public, anon, authenticated;
revoke execute on function public.lc__offer_minutes(text) from public, anon, authenticated;
revoke execute on function public.lc__ics_escape(text) from public, anon, authenticated;
grant execute on function public.lc_get_taken_slots(timestamptz, timestamptz) to anon, authenticated;
grant execute on function public.lc_calendar_ics(text) to anon, authenticated;
grant execute on function public.lc_admin_login(text, text) to anon, authenticated;
grant execute on function public.lc_admin_logout(text) to anon, authenticated;
grant execute on function public.lc_admin_me(text) to anon, authenticated;
grant execute on function public.lc_admin_change_password(text, text, text) to anon, authenticated;
grant execute on function public.lc_admin_overview(text, timestamptz, timestamptz) to anon, authenticated;
grant execute on function public.lc_admin_bookings(text, timestamptz, timestamptz) to anon, authenticated;
grant execute on function public.lc_admin_update_booking(text, uuid, text, text) to anon, authenticated;
grant execute on function public.lc_admin_questions(text) to anon, authenticated;
grant execute on function public.lc_admin_update_question(text, uuid, text, text) to anon, authenticated;
grant execute on function public.lc_admin_payments(text) to anon, authenticated;
grant execute on function public.lc_admin_add_payment(text, text, integer, text, text, timestamptz, text) to anon, authenticated;
grant execute on function public.lc_admin_update_payment(text, uuid, text) to anon, authenticated;
grant execute on function public.lc_admin_contacts(text) to anon, authenticated;
grant execute on function public.lc_admin_settings(text) to anon, authenticated;
grant execute on function public.lc_admin_rotate_calendar_token(text) to anon, authenticated;

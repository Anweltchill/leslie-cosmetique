/*
  Leslie Cosmétique — Disponibilités des séances (coaching, consultation, audit)

  Leslie gère ses disponibilités depuis l'admin (Agenda → Disponibilités) :
  - lc_availability_rules  : créneaux récurrents chaque semaine (jour + heure de début, heure de Paris),
                             pour une séance précise ou pour toutes les séances (offer_slug vide)
  - lc_availability_dates  : dates ponctuelles — créneau en plus (open) ou jour / créneau bloqué (block)
  - lc_booking_settings    : date d'ouverture des réservations, horizon (jours), délai minimum (heures)

  Le site propose uniquement les créneaux calculés par lc_get_available_slots(), et un déclencheur
  refuse toute réservation hors disponibilités (même en appelant l'API directement).
*/

create table if not exists public.lc_availability_rules (
  id uuid primary key default gen_random_uuid(),
  offer_slug text check (offer_slug is null or offer_slug in ('coaching-formulation','consultation-lancement-marque','audit-orientation')),
  weekday smallint not null check (weekday between 1 and 7), -- 1 = lundi … 7 = dimanche
  start_time time not null,
  created_at timestamptz not null default now(),
  unique nulls not distinct (offer_slug, weekday, start_time)
);
alter table public.lc_availability_rules enable row level security;

create table if not exists public.lc_availability_dates (
  id uuid primary key default gen_random_uuid(),
  offer_slug text check (offer_slug is null or offer_slug in ('coaching-formulation','consultation-lancement-marque','audit-orientation')),
  day date not null,
  start_time time, -- vide = journée entière (pour un blocage)
  kind text not null check (kind in ('open','block')),
  note text not null default '' check (char_length(note) <= 200),
  created_at timestamptz not null default now(),
  check (kind = 'block' or start_time is not null)
);
alter table public.lc_availability_dates enable row level security;

create table if not exists public.lc_booking_settings (
  id boolean primary key default true check (id),
  open_from date,
  max_days_ahead integer not null default 30 check (max_days_ahead between 1 and 365),
  min_hours_notice integer not null default 24 check (min_hours_notice between 0 and 720),
  updated_at timestamptz not null default now()
);
alter table public.lc_booking_settings enable row level security;

-- Réglages de départ : lancement le 28 novembre, réservations ouvertes sur 1 mois, 24 h de délai.
insert into public.lc_booking_settings (id, open_from, max_days_ahead, min_hours_notice)
values (true, '2026-11-28', 30, 24)
on conflict (id) do nothing;

-- Disponibilités de départ (modifiables dans l'admin) :
--   Coaching Formulation          : samedi et dimanche, 9 h 00 et 10 h 15
--   Consultation Lancement marque : samedi et dimanche, 11 h 30 et 12 h 45
--   Audit d'orientation           : du lundi au samedi, mêmes horaires qu'avant sur le site
insert into public.lc_availability_rules (offer_slug, weekday, start_time)
select o, d, t::time
from (values
  ('coaching-formulation', array[6,7], array['09:00','10:15']),
  ('consultation-lancement-marque', array[6,7], array['11:30','12:45']),
  ('audit-orientation', array[1,2,3,4,5,6], array['10:00','11:30','14:00','15:30','17:00','18:30'])
) as v(o, days, times), unnest(v.days) as d, unnest(v.times) as t
on conflict do nothing;

-- ───────────── Calcul des créneaux libres (heure de Paris) ─────────────
create or replace function public.lc__slots(p_offer text, p_from timestamptz, p_to timestamptz)
returns table (starts_at timestamptz)
language sql stable security definer set search_path = public as $$
  with st as (
    select * from public.lc_booking_settings where id
  ),
  bounds as (
    select greatest(
             p_from,
             now() + make_interval(hours => st.min_hours_notice),
             coalesce(st.open_from::timestamp at time zone 'Europe/Paris', '-infinity'::timestamptz)
           ) as lo,
           least(p_to, now() + make_interval(days => st.max_days_ahead)) as hi
    from st
  ),
  days as (
    select g::date as day
    from bounds b, generate_series((b.lo at time zone 'Europe/Paris')::date, (b.hi at time zone 'Europe/Paris')::date, interval '1 day') g
    where b.hi > b.lo
  ),
  cand as (
    select (d.day + r.start_time) at time zone 'Europe/Paris' as starts_at
    from days d
    join public.lc_availability_rules r on r.weekday = extract(isodow from d.day)
    where r.offer_slug is null or r.offer_slug = p_offer
    union
    select (x.day + x.start_time) at time zone 'Europe/Paris'
    from public.lc_availability_dates x
    where x.kind = 'open' and (x.offer_slug is null or x.offer_slug = p_offer)
  )
  select distinct c.starts_at
  from cand c, bounds b
  where c.starts_at >= b.lo and c.starts_at < b.hi
    and not exists (
      select 1 from public.lc_availability_dates x
      where x.kind = 'block'
        and (x.offer_slug is null or x.offer_slug = p_offer)
        and x.day = (c.starts_at at time zone 'Europe/Paris')::date
        and (x.start_time is null or x.start_time = (c.starts_at at time zone 'Europe/Paris')::time)
    )
    and not exists (
      select 1 from public.lc_booking_requests k
      where k.status in ('pending','confirmed')
        and k.starts_at < c.starts_at + make_interval(mins => public.lc__offer_minutes(p_offer))
        and k.starts_at + make_interval(mins => public.lc__offer_minutes(k.offer_slug)) > c.starts_at
    )
  order by 1;
$$;

-- Créneaux proposés sur le site pour une séance (au plus 3 mois par appel).
create or replace function public.lc_get_available_slots(p_offer_slug text, p_from timestamptz, p_to timestamptz)
returns setof timestamptz
language sql stable security definer set search_path = public as $$
  select s.starts_at from public.lc__slots(p_offer_slug, p_from, least(p_to, p_from + interval '93 days')) s;
$$;
grant execute on function public.lc_get_available_slots(text, timestamptz, timestamptz) to anon, authenticated;

-- Refus de toute réservation hors disponibilités (même code que « créneau déjà pris »).
create or replace function public.lc__check_booking_slot()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.lc__slots(new.offer_slug, new.starts_at - interval '1 minute', new.starts_at + interval '1 minute') s
    where s.starts_at = new.starts_at
  ) then
    raise exception 'Ce créneau n''est pas disponible.' using errcode = '23505';
  end if;
  return new;
end $$;

create or replace trigger lc_booking_slot_check
  before insert on public.lc_booking_requests
  for each row execute function public.lc__check_booking_slot();

-- ───────────── Admin : lecture et enregistrement des disponibilités ─────────────
create or replace function public.lc_admin_availability(p_token text)
returns json language plpgsql stable security definer set search_path = public as $$
begin
  perform public.lc__admin(p_token);
  return json_build_object(
    'settings', (
      select json_build_object('open_from', s.open_from, 'max_days_ahead', s.max_days_ahead, 'min_hours_notice', s.min_hours_notice)
      from public.lc_booking_settings s where s.id
    ),
    'rules', coalesce((
      select json_agg(json_build_object('offer_slug', r.offer_slug, 'weekday', r.weekday, 'start_time', to_char(r.start_time, 'HH24:MI'))
                      order by r.offer_slug nulls first, r.weekday, r.start_time)
      from public.lc_availability_rules r
    ), '[]'::json),
    'dates', coalesce((
      select json_agg(json_build_object('offer_slug', x.offer_slug, 'day', x.day, 'start_time', to_char(x.start_time, 'HH24:MI'), 'kind', x.kind, 'note', x.note)
                      order by x.day, x.start_time nulls first)
      from public.lc_availability_dates x
      where x.day >= (now() at time zone 'Europe/Paris')::date
    ), '[]'::json)
  );
end $$;

-- Remplace l'ensemble des disponibilités par celles envoyées depuis l'admin.
create or replace function public.lc_admin_save_availability(p_token text, p_settings json, p_rules json, p_dates json)
returns json language plpgsql security definer set search_path = public as $$
begin
  perform public.lc__admin(p_token);

  update public.lc_booking_settings set
    open_from = nullif(p_settings->>'open_from', '')::date,
    max_days_ahead = coalesce((p_settings->>'max_days_ahead')::int, max_days_ahead),
    min_hours_notice = coalesce((p_settings->>'min_hours_notice')::int, min_hours_notice),
    updated_at = now()
  where id;

  delete from public.lc_availability_rules where true;
  insert into public.lc_availability_rules (offer_slug, weekday, start_time)
  select distinct nullif(r->>'offer_slug', ''), (r->>'weekday')::smallint, (r->>'start_time')::time
  from json_array_elements(coalesce(p_rules, '[]'::json)) r
  on conflict do nothing;

  delete from public.lc_availability_dates where day >= (now() at time zone 'Europe/Paris')::date;
  insert into public.lc_availability_dates (offer_slug, day, start_time, kind, note)
  select nullif(d->>'offer_slug', ''), (d->>'day')::date, nullif(d->>'start_time', '')::time, d->>'kind', left(coalesce(d->>'note', ''), 200)
  from json_array_elements(coalesce(p_dates, '[]'::json)) d;

  return public.lc_admin_availability(p_token);
end $$;

grant execute on function public.lc_admin_availability(text) to anon, authenticated;
grant execute on function public.lc_admin_save_availability(text, json, json, json) to anon, authenticated;

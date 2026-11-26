/*
  Leslie Cosmétique — Acquisition : liens de suivi (Instagram, TikTok…) et tunnel de conversion

  - lc_events : nouvelles étapes du tunnel (lien de suivi, créneau choisi, fenêtre de paiement,
    choix carte / Mobile Money, page Stripe ouverte) + colonne « campaign » (code du lien)
  - lc_links  : liens de suivi créés dans l'admin (leslie.phoenixpro.fr/l/<code>)
  - lc_admin_funnel / lc_admin_links : statistiques de l'onglet « Acquisition » de l'admin
  - lc_admin_overview : sources regroupées (Instagram, TikTok, Google…)
  Script ré-exécutable sans risque.
*/

-- ───────────── Événements ─────────────
alter table public.lc_events drop constraint if exists lc_events_event_check;
alter table public.lc_events add constraint lc_events_event_check check (event in (
  'page_view','view_offer','offer_click','buy_click','signup_click','audit_book_click','booking_link_click',
  'booking_offer_select','booking_submit','question_submit',
  'link_visit','booking_slot_select','pay_choice_open','pay_method_card','pay_method_mobile','checkout_start'));
alter table public.lc_events add column if not exists campaign text not null default '';
alter table public.lc_events drop constraint if exists lc_events_campaign_check;
alter table public.lc_events add constraint lc_events_campaign_check check (char_length(campaign) <= 60);
grant insert (campaign) on public.lc_events to anon, authenticated;
create index if not exists lc_events_visitor on public.lc_events (visitor_id);
create index if not exists lc_events_campaign on public.lc_events (campaign) where campaign <> '';

-- ───────────── Source normalisée ─────────────
create or replace function public.lc__src(p_utm text, p_ref text)
returns text language sql immutable set search_path = public as $$
  select case
    when v = '' or v = 'direct' then 'direct'
    when v ~ 'instagram' or v in ('ig','insta') then 'instagram'
    when v ~ 'tiktok' or v = 'tt' then 'tiktok'
    when v ~ 'facebook|messenger' or v in ('fb','fb.com','fb.me') then 'facebook'
    when v ~ 'whatsapp' or v in ('wa','wa.me') then 'whatsapp'
    when v ~ 'youtube|youtu\.be' then 'youtube'
    when v ~ 'snapchat' then 'snapchat'
    when v ~ 'pinterest|pin\.it' then 'pinterest'
    when v ~ '(^|\.)google\.' or v = 'google' then 'google'
    when v ~ '(^|\.)bing\.' or v = 'bing' then 'bing'
    when v in ('email','e-mail','newsletter') or v ~ '(^|\.)mail\.' then 'email'
    when v in ('t.co','x.com','twitter','twitter.com') then 'x'
    else v end
  from (select lower(regexp_replace(coalesce(nullif(trim(p_utm), ''), nullif(trim(p_ref), ''), ''), '^www\.', '')) as v) s;
$$;

create or replace function public.lc__source_label(p_src text)
returns text language sql immutable set search_path = public as $$
  select case p_src
    when 'direct' then 'Accès direct' when 'instagram' then 'Instagram' when 'tiktok' then 'TikTok'
    when 'facebook' then 'Facebook' when 'whatsapp' then 'WhatsApp' when 'youtube' then 'YouTube'
    when 'snapchat' then 'Snapchat' when 'pinterest' then 'Pinterest' when 'google' then 'Google'
    when 'bing' then 'Bing' when 'email' then 'E-mail' when 'x' then 'X (Twitter)'
    else p_src end;
$$;

-- ───────────── Liens de suivi ─────────────
create table if not exists public.lc_links (
  code text primary key check (code ~ '^[a-z0-9][a-z0-9-]{1,39}$'),
  name text not null default '' check (char_length(name) <= 80),
  source text not null default 'autre' check (char_length(source) between 1 and 40),
  destination text not null default '/' check (char_length(destination) <= 120 and destination ~ '^/[A-Za-z0-9/_-]*$'),
  archived boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.lc_links enable row level security;
revoke all on table public.lc_links from anon, authenticated;

insert into public.lc_links (code, name, source, destination) values
  ('insta', 'Instagram — lien en bio', 'instagram', '/'),
  ('tiktok', 'TikTok — lien en bio', 'tiktok', '/')
on conflict (code) do nothing;

-- Résolution publique d'un lien (utilisée par la page /l/<code> du site)
create or replace function public.lc_resolve_link(p_code text)
returns json language sql stable security definer set search_path = public as $$
  select json_build_object('destination', destination, 'source', source)
  from public.lc_links where code = lower(trim(p_code)) and not archived;
$$;
grant execute on function public.lc_resolve_link(text) to anon, authenticated;

create or replace function public.lc_admin_save_link(p_token text, p_code text, p_name text, p_source text, p_destination text)
returns json language plpgsql security definer set search_path = public as $$
declare c text := lower(trim(p_code));
begin
  perform public.lc__admin(p_token);
  if c !~ '^[a-z0-9][a-z0-9-]{1,39}$' then
    raise exception 'Code invalide : 2 à 40 caractères, lettres minuscules, chiffres et tirets.' using errcode = '22023';
  end if;
  insert into public.lc_links (code, name, source, destination, archived)
  values (c, left(coalesce(p_name, ''), 80), coalesce(nullif(lower(trim(p_source)), ''), 'autre'), coalesce(nullif(trim(p_destination), ''), '/'), false)
  on conflict (code) do update set name = excluded.name, source = excluded.source, destination = excluded.destination, archived = false;
  return json_build_object('ok', true, 'code', c);
end $$;

create or replace function public.lc_admin_archive_link(p_token text, p_code text)
returns json language plpgsql security definer set search_path = public as $$
begin
  perform public.lc__admin(p_token);
  update public.lc_links set archived = true where code = lower(trim(p_code));
  return json_build_object('ok', true);
end $$;

-- Liens avec leurs résultats sur la période
create or replace function public.lc_admin_links(p_token text, p_from timestamptz, p_to timestamptz)
returns json language plpgsql stable security definer set search_path = public as $$
declare r json;
begin
  perform public.lc__admin(p_token);
  with ev as (
    select * from public.lc_events where created_at >= p_from and created_at < p_to and campaign <> ''
  ), pay as (
    select * from public.lc_payments where provider = 'stripe' and status = 'paid' and paid_at >= p_from and paid_at < p_to
  )
  select coalesce(json_agg(t order by t.archived, t.clicks desc, t.created_at), '[]'::json) into r from (
    select l.code, l.name, l.source, l.destination, l.archived, l.created_at,
      (select count(*) from ev where ev.campaign = l.code and ev.event = 'link_visit') as clicks,
      (select count(distinct visitor_id) from ev where ev.campaign = l.code) as visitors,
      (select count(distinct visitor_id) from ev where ev.campaign = l.code and ev.event = 'view_offer') as offer_viewers,
      (select count(distinct visitor_id) from ev where ev.campaign = l.code and ev.event in ('buy_click','signup_click','audit_book_click','booking_offer_select','pay_choice_open')) as intents,
      (select count(distinct visitor_id) from ev where ev.campaign = l.code and ev.event = 'checkout_start') as checkouts,
      (select count(*) from pay where pay.metadata->>'campaign' = l.code) as sales,
      (select coalesce(sum(amount_cents), 0) from pay where pay.metadata->>'campaign' = l.code) as revenue_cents
    from public.lc_links l
  ) t;
  return r;
end $$;

grant execute on function public.lc_admin_save_link(text, text, text, text, text) to anon, authenticated;
grant execute on function public.lc_admin_archive_link(text, text) to anon, authenticated;
grant execute on function public.lc_admin_links(text, timestamptz, timestamptz) to anon, authenticated;

-- ───────────── Tunnel de conversion ─────────────
-- p_source : '' = toutes les sources, sinon instagram, tiktok, direct…
create or replace function public.lc_admin_funnel(p_token text, p_from timestamptz, p_to timestamptz, p_source text default '')
returns json language plpgsql stable security definer set search_path = public as $$
declare
  r json;
  f text := nullif(lower(trim(coalesce(p_source, ''))), '');
  intents text[] := array['buy_click','signup_click','audit_book_click','booking_link_click','booking_offer_select','pay_choice_open'];
  coachings text[] := array['coaching-formulation','consultation-lancement-marque','audit-orientation'];
begin
  perform public.lc__admin(p_token);
  with ev as (
    select e.visitor_id, e.event, e.offer_slug, coalesce(nullif(e.device, ''), 'inconnu') as device, e.created_at,
           public.lc__src(e.utm_source, e.referrer) as src
    from public.lc_events e where e.created_at >= p_from and e.created_at < p_to
  ), evf as (
    select * from ev where f is null or src = f
  ), pay as (
    select p.id, p.offer_slug, p.amount_cents, p.paid_at,
           case when coalesce(p.metadata->>'source', '') = '' then 'inconnu' else public.lc__src(p.metadata->>'source', '') end as src,
           coalesce(nullif(p.metadata->>'visitor_id', ''), p.id::text) as vid
    from public.lc_payments p
    where p.provider = 'stripe' and p.status = 'paid' and p.paid_at >= p_from and p.paid_at < p_to
  ), payf as (
    select * from pay where f is null or src = f
  ), days as (
    select generate_series(date_trunc('day', p_from at time zone 'Europe/Paris'),
                           date_trunc('day', (p_to - interval '1 second') at time zone 'Europe/Paris'), interval '1 day')::date as d
  )
  select json_build_object(
    'steps', json_build_array(
      json_build_object('key', 'visit',    'visitors', (select count(distinct visitor_id) from evf)),
      json_build_object('key', 'offer',    'visitors', (select count(distinct visitor_id) from evf where event = 'view_offer')),
      json_build_object('key', 'intent',   'visitors', (select count(distinct visitor_id) from evf where event = any(intents))),
      json_build_object('key', 'choice',   'visitors', (select count(distinct visitor_id) from evf where event = 'pay_choice_open')),
      json_build_object('key', 'method',   'visitors', (select count(distinct visitor_id) from evf where event in ('pay_method_card','pay_method_mobile'))),
      json_build_object('key', 'checkout', 'visitors', (select count(distinct visitor_id) from evf where event = 'checkout_start')),
      json_build_object('key', 'paid',     'visitors', (select count(distinct vid) from payf))
    ),
    'methods', json_build_object(
      'card',     (select count(distinct visitor_id) from evf where event = 'pay_method_card'),
      'mobile',   (select count(distinct visitor_id) from evf where event = 'pay_method_mobile'),
      'checkout', (select count(distinct visitor_id) from evf where event = 'checkout_start'),
      'paid',     (select count(distinct vid) from payf),
      'sales',    (select count(*) from payf),
      'revenue_cents', (select coalesce(sum(amount_cents), 0) from payf)
    ),
    'booking', json_build_object(
      'select_offer', (select count(distinct visitor_id) from evf where event = 'booking_offer_select'),
      'slot',         (select count(distinct visitor_id) from evf where event = 'booking_slot_select'),
      'submit',       (select count(distinct visitor_id) from evf where event = 'booking_submit'),
      'pay_open',     (select count(distinct visitor_id) from evf where event = 'pay_choice_open' and offer_slug = any(coachings)),
      'paid',         (select count(distinct vid) from payf where offer_slug = any(coachings))
    ),
    'by_offer', (
      select coalesce(json_agg(t order by t.viewers desc), '[]'::json) from (
        select o.slug, public.lc__offer_name(o.slug) as name,
          (select count(distinct visitor_id) from evf where offer_slug = o.slug and event = 'view_offer') as viewers,
          (select count(distinct visitor_id) from evf where offer_slug = o.slug and event = any(intents)) as intents,
          (select count(distinct visitor_id) from evf where offer_slug = o.slug and event = 'pay_choice_open') as choosers,
          (select count(distinct visitor_id) from evf where offer_slug = o.slug and event = 'pay_method_mobile') as mobile,
          (select count(distinct visitor_id) from evf where offer_slug = o.slug and event = 'checkout_start') as checkouts,
          (select count(*) from payf where offer_slug = o.slug) as sales,
          (select coalesce(sum(amount_cents), 0) from payf where offer_slug = o.slug) as revenue_cents
        from (select distinct offer_slug as slug from evf where offer_slug <> '' union select distinct offer_slug from payf where offer_slug <> '') o
      ) t
    ),
    'by_source', (
      select coalesce(json_agg(t order by t.visitors desc, t.sales desc), '[]'::json) from (
        select coalesce(s.src, ps.src) as source, public.lc__source_label(coalesce(s.src, ps.src)) as label,
          coalesce(s.visitors, 0) as visitors, coalesce(s.offer_viewers, 0) as offer_viewers, coalesce(s.intents, 0) as intents,
          coalesce(s.choosers, 0) as choosers, coalesce(s.checkouts, 0) as checkouts,
          coalesce(ps.sales, 0) as sales, coalesce(ps.revenue_cents, 0) as revenue_cents
        from (
          select src, count(distinct visitor_id) as visitors,
            count(distinct visitor_id) filter (where event = 'view_offer') as offer_viewers,
            count(distinct visitor_id) filter (where event = any(intents)) as intents,
            count(distinct visitor_id) filter (where event = 'pay_choice_open') as choosers,
            count(distinct visitor_id) filter (where event = 'checkout_start') as checkouts
          from ev group by src
        ) s
        full join (select src, count(*) as sales, sum(amount_cents) as revenue_cents from pay group by src) ps on ps.src = s.src
      ) t
    ),
    'by_device', (
      select coalesce(json_agg(t order by t.visitors desc), '[]'::json) from (
        select device, count(distinct visitor_id) as visitors,
          count(distinct visitor_id) filter (where event = any(intents)) as intents,
          count(distinct visitor_id) filter (where event = 'checkout_start') as checkouts
        from evf group by device
      ) t
    ),
    'daily', (
      select coalesce(json_agg(t order by t.day), '[]'::json) from (
        select d as day,
          (select count(distinct visitor_id) from ev where src = 'instagram' and (created_at at time zone 'Europe/Paris')::date = d) as instagram,
          (select count(distinct visitor_id) from ev where src = 'tiktok' and (created_at at time zone 'Europe/Paris')::date = d) as tiktok,
          (select count(distinct visitor_id) from ev where src not in ('instagram','tiktok') and (created_at at time zone 'Europe/Paris')::date = d) as other
        from days
      ) t
    )
  ) into r;
  return r;
end $$;
grant execute on function public.lc_admin_funnel(text, timestamptz, timestamptz, text) to anon, authenticated;

-- ───────────── Vue d'ensemble : sources regroupées ─────────────
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
    'buy_clicks', (select count(*) from ev where event in ('buy_click','signup_click','audit_book_click','booking_link_click','pay_choice_open')),
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
        select public.lc__source_label(public.lc__src(utm_source, referrer)) as source, count(distinct visitor_id) as visitors
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

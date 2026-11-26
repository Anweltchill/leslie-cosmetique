/*
  Leslie Cosmétique — e-mails automatiques (réservations, rappels, guides)

  Principe
  - Chaque e-mail à envoyer est d'abord inscrit dans la file lc_emails (en base, donc rien ne se perd).
  - La fonction serveur « lc-mail » (Supabase Edge Function) vide la file et envoie via Resend.
    Elle est réveillée tout de suite après chaque inscription (pg_net) et toutes les 10 minutes (pg_cron),
    ce qui relance aussi les envois en échec et prépare les rappels de la veille.

  E-mails
  - booking_request   cliente : demande de rendez-vous reçue (+ moyens de paiement)
  - booking_new       Leslie  : nouvelle réservation
  - booking_paid      cliente : paiement de la séance reçu
  - booking_confirmed cliente : rendez-vous confirmé (lien visio, ajout à l'agenda)
  - booking_reminder  cliente : rappel avant le rendez-vous
  - booking_moved     cliente : rendez-vous déplacé
  - booking_cancelled cliente : rendez-vous annulé
  - guide_link        cliente : lien de téléchargement du guide acheté
  - sale_new          Leslie  : nouvelle vente en ligne
  - preview           aperçu de tous les modèles (depuis les paramètres de l'admin)
*/

-- ───────────── Réservations : fuseau horaire de la cliente et lien de la visio ─────────────
alter table public.lc_booking_requests add column if not exists timezone text not null default '';
alter table public.lc_booking_requests add column if not exists meet_url text not null default '';
do $$ begin
  alter table public.lc_booking_requests add constraint lc_booking_timezone_len check (char_length(timezone) <= 64);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.lc_booking_requests add constraint lc_booking_meet_url_len check (char_length(meet_url) <= 500);
exception when duplicate_object then null; end $$;
grant insert (timezone) on public.lc_booking_requests to anon, authenticated;

-- ───────────── File d'envoi ─────────────
create table if not exists public.lc_emails (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('booking_request','booking_new','booking_paid','booking_confirmed','booking_reminder',
                                     'booking_moved','booking_cancelled','guide_link','sale_new','preview')),
  booking_id uuid references public.lc_booking_requests(id) on delete cascade,
  payment_id uuid references public.lc_payments(id) on delete cascade,
  to_email text not null check (char_length(to_email) <= 200),
  dedupe_key text unique,
  data jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (status in ('queued','sending','sent','failed','skipped')),
  attempts integer not null default 0,
  send_after timestamptz not null default now(),
  claimed_at timestamptz,
  sent_at timestamptz,
  subject text not null default '',
  provider_id text,
  error text not null default ''
);
create index if not exists lc_emails_queue on public.lc_emails (status, send_after);
create index if not exists lc_emails_booking on public.lc_emails (booking_id);
create index if not exists lc_emails_created on public.lc_emails (created_at);
alter table public.lc_emails enable row level security;
revoke all on table public.lc_emails from anon, authenticated;

-- Réglages (modifiables dans Paramètres → E-mails automatiques)
insert into public.lc_settings (key, value) values
  ('mail_enabled', 'on'),
  ('mail_notify_to', 'lesliedjomanghi@gmail.com'),
  ('mail_notify_bookings', 'on'),
  ('mail_notify_sales', 'on'),
  ('mail_reminders', 'on'),
  ('mail_meet_url', '')
on conflict (key) do nothing;

create or replace function public.lc__setting(p_key text, p_default text default '')
returns text language sql stable security definer set search_path = public as $$
  select coalesce((select value from public.lc_settings where key = p_key), p_default);
$$;

-- Réveille la fonction d'envoi (requête HTTP asynchrone, partie après la validation de la transaction).
create or replace function public.lc__mail_kick()
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  perform net.http_post(
    url := 'https://fzgxowamjhfhkgvgvsry.supabase.co/functions/v1/lc-mail',
    body := '{}'::jsonb,
    headers := '{"Content-Type": "application/json"}'::jsonb,
    timeout_milliseconds := 60000
  );
exception when others then
  raise warning 'lc-mail : réveil impossible (%), envoi au prochain passage', sqlerrm;
end $$;

-- Inscrit un e-mail dans la file. Ne bloque jamais l'action d'origine (réservation, paiement…).
create or replace function public.lc__mail_enqueue(
  p_kind text, p_to text, p_booking uuid, p_payment uuid, p_dedupe text,
  p_data jsonb default '{}'::jsonb, p_kick boolean default true)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if public.lc__setting('mail_enabled', 'on') <> 'on' then return null; end if;
  if coalesce(trim(p_to), '') !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then return null; end if;
  insert into public.lc_emails (kind, to_email, booking_id, payment_id, dedupe_key, data)
  values (p_kind, lower(trim(p_to)), p_booking, p_payment, p_dedupe, coalesce(p_data, '{}'::jsonb))
  on conflict (dedupe_key) do nothing
  returning id into v_id;
  if v_id is not null and p_kick then perform public.lc__mail_kick(); end if;
  return v_id;
end $$;

-- ───────────── Déclencheurs ─────────────
-- Nouvelle réservation depuis le site : accusé de réception à la cliente + alerte à Leslie.
create or replace function public.lc__booking_mail()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    perform public.lc__mail_enqueue('booking_request', new.email, new.id, null, 'request:' || new.id, '{}'::jsonb, false);
    if public.lc__setting('mail_notify_bookings', 'on') = 'on' then
      perform public.lc__mail_enqueue('booking_new', public.lc__setting('mail_notify_to', 'lesliedjomanghi@gmail.com'),
                                      new.id, null, 'new:' || new.id, '{}'::jsonb, false);
    end if;
    perform public.lc__mail_kick();
  exception when others then
    raise warning 'lc-mail (réservation %) : %', new.id, sqlerrm;
  end;
  return null;
end $$;
drop trigger if exists lc_booking_mail on public.lc_booking_requests;
create trigger lc_booking_mail after insert on public.lc_booking_requests
  for each row execute function public.lc__booking_mail();

-- Paiement validé : reçu de séance ou lien du guide à la cliente, alerte « nouvelle vente » à Leslie.
create or replace function public.lc__payment_mail()
returns trigger language plpgsql security definer set search_path = public as $$
declare b public.lc_booking_requests;
begin
  if new.status <> 'paid' or (tg_op = 'UPDATE' and old.status = 'paid') then return null; end if;
  begin
    if coalesce(new.metadata->>'no_mail', '') <> 'true' then
      if new.booking_id is not null then
        select * into b from public.lc_booking_requests where id = new.booking_id;
        if found then
          perform public.lc__mail_enqueue('booking_paid', b.email, b.id, new.id, 'paid:' || new.id, '{}'::jsonb, false);
        end if;
      elsif new.offer_slug in ('guide-recettes-capillaires', 'guide-formulation') then
        perform public.lc__mail_enqueue('guide_link', new.customer_email, null, new.id, 'guide:' || new.id, '{}'::jsonb, false);
      end if;
    end if;
    if new.provider = 'stripe' and public.lc__setting('mail_notify_sales', 'on') = 'on' then
      perform public.lc__mail_enqueue('sale_new', public.lc__setting('mail_notify_to', 'lesliedjomanghi@gmail.com'),
                                      new.booking_id, new.id, 'sale:' || new.id, '{}'::jsonb, false);
    end if;
    perform public.lc__mail_kick();
  exception when others then
    raise warning 'lc-mail (paiement %) : %', new.id, sqlerrm;
  end;
  return null;
end $$;
drop trigger if exists lc_payment_mail on public.lc_payments;
create trigger lc_payment_mail after insert or update of status on public.lc_payments
  for each row execute function public.lc__payment_mail();

-- ───────────── Passage régulier (toutes les 10 minutes) ─────────────
create or replace function public.lc__mail_tick()
returns void language plpgsql security definer set search_path = public as $$
begin
  -- envoi interrompu (fonction arrêtée en cours de route) : on le remet dans la file
  update public.lc_emails set status = 'queued'
    where status = 'sending' and claimed_at < now() - interval '10 minutes';

  -- rappel avant le rendez-vous : dans les 24 h, au moins 2 h avant, jamais juste après la confirmation
  if public.lc__setting('mail_reminders', 'on') = 'on' and public.lc__setting('mail_enabled', 'on') = 'on' then
    insert into public.lc_emails (kind, to_email, booking_id, dedupe_key)
    select 'booking_reminder', lower(b.email), b.id, 'reminder:' || b.id || ':' || extract(epoch from b.starts_at)::bigint
    from public.lc_booking_requests b
    where b.status = 'confirmed'
      and b.starts_at > now() + interval '2 hours'
      and b.starts_at <= now() + interval '24 hours'
      and not exists (
        select 1 from public.lc_emails e
        where e.booking_id = b.id and e.kind in ('booking_confirmed', 'booking_moved')
          and e.created_at > now() - interval '6 hours')
    on conflict (dedupe_key) do nothing;
  end if;

  if exists (select 1 from public.lc_emails where status = 'queued' and send_after <= now()) then
    perform public.lc__mail_kick();
  end if;
end $$;

-- Réservation des e-mails à envoyer par la fonction lc-mail (deux passages simultanés ne prennent jamais le même).
create or replace function public.lc__mail_claim(p_limit integer default 20)
returns setof public.lc_emails language sql security definer set search_path = public as $$
  update public.lc_emails e
     set status = 'sending', attempts = e.attempts + 1, claimed_at = now()
   where e.id in (
     select q.id from public.lc_emails q
      where q.status = 'queued' and q.send_after <= now()
      order by q.created_at
      limit greatest(1, least(p_limit, 50))
      for update skip locked)
  returning e.*;
$$;

do $$ begin
  perform cron.unschedule('lc-mail-tick');
exception when others then null; end $$;
select cron.schedule('lc-mail-tick', '*/10 * * * *', 'select public.lc__mail_tick()');

-- Durées de conservation annoncées dans la politique de confidentialité :
-- statistiques de fréquentation 25 mois, historique des e-mails 3 ans.
do $$ begin
  perform cron.unschedule('lc-purge-daily');
exception when others then null; end $$;
select cron.schedule('lc-purge-daily', '17 3 * * *', $job$
  delete from public.lc_events where created_at < now() - interval '25 months';
  delete from public.lc_emails where created_at < now() - interval '3 years';
$job$);

-- ───────────── Admin : rendez-vous ─────────────
-- (même signature qu'avant : ajoute le lien visio, le fuseau de la cliente, le paiement et l'historique des e-mails)
create or replace function public.lc_admin_bookings(p_token text, p_from timestamptz, p_to timestamptz)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare r json;
begin
  perform public.lc__admin(p_token);
  select coalesce(json_agg(json_build_object(
    'id', b.id, 'offer_slug', b.offer_slug, 'offer_name', public.lc__offer_name(b.offer_slug),
    'minutes', public.lc__offer_minutes(b.offer_slug), 'starts_at', b.starts_at,
    'full_name', b.full_name, 'email', b.email, 'phone', b.phone, 'message', b.message,
    'status', b.status, 'admin_note', b.admin_note, 'created_at', b.created_at,
    'meet_url', b.meet_url, 'timezone', b.timezone,
    'paid_cents', (select coalesce(sum(p.amount_cents), 0) from public.lc_payments p where p.booking_id = b.id and p.status = 'paid'),
    'emails', (select coalesce(json_agg(json_build_object(
                  'kind', e.kind, 'status', e.status, 'created_at', e.created_at, 'sent_at', e.sent_at, 'error', e.error)
                  order by e.created_at desc), '[]'::json)
               from public.lc_emails e where e.booking_id = b.id and e.kind not in ('booking_new', 'sale_new'))
  ) order by b.starts_at), '[]'::json) into r
  from public.lc_booking_requests b where b.starts_at >= p_from and b.starts_at < p_to;
  return r;
end $$;

create or replace function public.lc__clean_url(p text)
returns text language sql immutable as $$
  select case
    when trim(coalesce(p, '')) = '' then ''
    when trim(p) ~* '^https?://' then left(trim(p), 500)
    else left('https://' || trim(p), 500) end;
$$;

create or replace function public.lc_admin_confirm_booking(p_token text, p_id uuid, p_meet_url text, p_notify boolean default true)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare b public.lc_booking_requests;
begin
  perform public.lc__admin(p_token);
  update public.lc_booking_requests
     set status = 'confirmed', meet_url = public.lc__clean_url(p_meet_url), updated_at = now()
   where id = p_id and status <> 'cancelled'
  returning * into b;
  if not found then raise exception 'Rendez-vous introuvable ou annulé.'; end if;
  if coalesce(p_notify, true) then
    perform public.lc__mail_enqueue('booking_confirmed', b.email, b.id, null, null);
  end if;
  return json_build_object('ok', true, 'meet_url', b.meet_url);
end $$;

create or replace function public.lc_admin_cancel_booking(p_token text, p_id uuid, p_message text, p_notify boolean default true)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare b public.lc_booking_requests;
begin
  perform public.lc__admin(p_token);
  update public.lc_booking_requests set status = 'cancelled', updated_at = now()
   where id = p_id and status <> 'cancelled'
  returning * into b;
  if not found then raise exception 'Rendez-vous introuvable ou déjà annulé.'; end if;
  if coalesce(p_notify, true) then
    perform public.lc__mail_enqueue('booking_cancelled', b.email, b.id, null, null,
      jsonb_build_object('message', left(coalesce(p_message, ''), 1500)));
  end if;
  return json_build_object('ok', true);
end $$;

create or replace function public.lc_admin_move_booking(p_token text, p_id uuid, p_starts_at timestamptz, p_message text, p_notify boolean default true)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare b public.lc_booking_requests; v_old timestamptz;
begin
  perform public.lc__admin(p_token);
  select * into b from public.lc_booking_requests where id = p_id;
  if not found or b.status in ('cancelled', 'done') then raise exception 'Rendez-vous introuvable, annulé ou terminé.'; end if;
  if p_starts_at is null or p_starts_at < now() then raise exception 'Choisissez une date à venir.'; end if;
  if p_starts_at = b.starts_at then raise exception 'C''est déjà l''horaire de ce rendez-vous.'; end if;
  if exists (
    select 1 from public.lc_booking_requests k
    where k.id <> b.id and k.status in ('pending', 'confirmed')
      and k.starts_at < p_starts_at + make_interval(mins => public.lc__offer_minutes(b.offer_slug))
      and k.starts_at + make_interval(mins => public.lc__offer_minutes(k.offer_slug)) > p_starts_at
  ) then
    raise exception 'Ce créneau chevauche un autre rendez-vous.';
  end if;
  v_old := b.starts_at;
  update public.lc_booking_requests set starts_at = p_starts_at, updated_at = now() where id = b.id returning * into b;
  if coalesce(p_notify, true) then
    perform public.lc__mail_enqueue('booking_moved', b.email, b.id, null, null,
      jsonb_build_object('old_starts_at', v_old, 'message', left(coalesce(p_message, ''), 1500)));
  end if;
  return json_build_object('ok', true);
end $$;

create or replace function public.lc_admin_save_meet_url(p_token text, p_id uuid, p_meet_url text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare v text := public.lc__clean_url(p_meet_url);
begin
  perform public.lc__admin(p_token);
  update public.lc_booking_requests set meet_url = v, updated_at = now() where id = p_id;
  return json_build_object('ok', true, 'meet_url', v);
end $$;

-- Renvoyer un e-mail à la cliente (accusé de réception ou confirmation)
create or replace function public.lc_admin_resend_booking_email(p_token text, p_id uuid, p_kind text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare b public.lc_booking_requests;
begin
  perform public.lc__admin(p_token);
  if p_kind not in ('booking_request', 'booking_confirmed') then raise exception 'E-mail inconnu.'; end if;
  select * into b from public.lc_booking_requests where id = p_id;
  if not found then raise exception 'Rendez-vous introuvable.'; end if;
  if p_kind = 'booking_confirmed' and b.status <> 'confirmed' then raise exception 'Confirmez d''abord le rendez-vous.'; end if;
  if public.lc__mail_enqueue(p_kind, b.email, b.id, null, null) is null then
    raise exception 'Envoi impossible : les e-mails automatiques sont désactivés dans les paramètres.';
  end if;
  return json_build_object('ok', true);
end $$;

-- ───────────── Admin : réglages et suivi des e-mails ─────────────
create or replace function public.lc_admin_mail_settings(p_token text)
returns json language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public.lc__admin(p_token);
  return json_build_object(
    'enabled', public.lc__setting('mail_enabled', 'on') = 'on',
    'notify_to', public.lc__setting('mail_notify_to', 'lesliedjomanghi@gmail.com'),
    'notify_bookings', public.lc__setting('mail_notify_bookings', 'on') = 'on',
    'notify_sales', public.lc__setting('mail_notify_sales', 'on') = 'on',
    'reminders', public.lc__setting('mail_reminders', 'on') = 'on',
    'meet_url', public.lc__setting('mail_meet_url', ''),
    'recent', (select coalesce(json_agg(x order by x.created_at desc), '[]'::json) from (
      select e.kind, e.to_email, e.status, e.subject, e.created_at, e.sent_at, e.error
      from public.lc_emails e order by e.created_at desc limit 40) x)
  );
end $$;

create or replace function public.lc_admin_save_mail_settings(
  p_token text, p_enabled boolean, p_notify_to text, p_notify_bookings boolean, p_notify_sales boolean,
  p_reminders boolean, p_meet_url text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare v_to text := lower(trim(coalesce(p_notify_to, '')));
begin
  perform public.lc__admin(p_token);
  if v_to !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Adresse e-mail de notification invalide.'; end if;
  insert into public.lc_settings (key, value) values
    ('mail_enabled', case when p_enabled then 'on' else 'off' end),
    ('mail_notify_to', left(v_to, 200)),
    ('mail_notify_bookings', case when p_notify_bookings then 'on' else 'off' end),
    ('mail_notify_sales', case when p_notify_sales then 'on' else 'off' end),
    ('mail_reminders', case when p_reminders then 'on' else 'off' end),
    ('mail_meet_url', public.lc__clean_url(p_meet_url))
  on conflict (key) do update set value = excluded.value;
  return json_build_object('ok', true);
end $$;

-- Aperçu : un exemplaire de chaque modèle d'e-mail, envoyé à l'adresse indiquée.
create or replace function public.lc_admin_mail_preview(p_token text, p_to text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare k text; n integer := 0;
begin
  perform public.lc__admin(p_token);
  if coalesce(trim(p_to), '') !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Adresse e-mail invalide.'; end if;
  if (select count(*) from public.lc_emails where kind = 'preview' and created_at > now() - interval '1 hour') >= 40 then
    raise exception 'Trop d''aperçus envoyés : réessayez dans une heure.';
  end if;
  foreach k in array array['booking_request','booking_new','booking_paid','booking_confirmed','booking_reminder',
                           'booking_moved','booking_cancelled','guide_link','sale_new'] loop
    insert into public.lc_emails (kind, to_email, data) values ('preview', lower(trim(p_to)), jsonb_build_object('as', k));
    n := n + 1;
  end loop;
  perform public.lc__mail_kick();
  return json_build_object('ok', true, 'count', n);
end $$;

-- Paiement saisi à la main : nouveau paramètre p_send_mail (envoi automatique du guide acheté).
drop function if exists public.lc_admin_add_payment(text, text, integer, text, text, timestamptz, text);
create or replace function public.lc_admin_add_payment(
  p_token text, p_offer_slug text, p_amount_cents integer, p_customer_name text, p_customer_email text,
  p_paid_at timestamptz, p_note text, p_send_mail boolean default false)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public.lc__admin(p_token);
  insert into public.lc_payments (provider, offer_slug, offer_name, amount_cents, customer_name, customer_email, paid_at, note, metadata)
  values ('manuel', coalesce(p_offer_slug, ''), public.lc__offer_name(coalesce(p_offer_slug, '')), p_amount_cents,
          coalesce(p_customer_name, ''), lower(coalesce(p_customer_email, '')), coalesce(p_paid_at, now()), coalesce(p_note, ''),
          case when coalesce(p_send_mail, false) then '{}'::jsonb else '{"no_mail": "true"}'::jsonb end);
end $$;

-- ───────────── Droits d'exécution ─────────────
revoke execute on function public.lc__setting(text, text) from public, anon, authenticated;
revoke execute on function public.lc__mail_kick() from public, anon, authenticated;
revoke execute on function public.lc__mail_enqueue(text, text, uuid, uuid, text, jsonb, boolean) from public, anon, authenticated;
revoke execute on function public.lc__booking_mail() from public, anon, authenticated;
revoke execute on function public.lc__payment_mail() from public, anon, authenticated;
revoke execute on function public.lc__mail_tick() from public, anon, authenticated;
revoke execute on function public.lc__mail_claim(integer) from public, anon, authenticated;
revoke execute on function public.lc__clean_url(text) from public, anon, authenticated;
grant execute on function public.lc__mail_claim(integer) to service_role;
grant execute on function public.lc__mail_tick() to service_role;

revoke execute on function public.lc_admin_confirm_booking(text, uuid, text, boolean) from public;
revoke execute on function public.lc_admin_cancel_booking(text, uuid, text, boolean) from public;
revoke execute on function public.lc_admin_move_booking(text, uuid, timestamptz, text, boolean) from public;
revoke execute on function public.lc_admin_save_meet_url(text, uuid, text) from public;
revoke execute on function public.lc_admin_resend_booking_email(text, uuid, text) from public;
revoke execute on function public.lc_admin_mail_settings(text) from public;
revoke execute on function public.lc_admin_save_mail_settings(text, boolean, text, boolean, boolean, boolean, text) from public;
revoke execute on function public.lc_admin_mail_preview(text, text) from public;
revoke execute on function public.lc_admin_add_payment(text, text, integer, text, text, timestamptz, text, boolean) from public;
grant execute on function public.lc_admin_bookings(text, timestamptz, timestamptz) to anon, authenticated;
grant execute on function public.lc_admin_confirm_booking(text, uuid, text, boolean) to anon, authenticated;
grant execute on function public.lc_admin_cancel_booking(text, uuid, text, boolean) to anon, authenticated;
grant execute on function public.lc_admin_move_booking(text, uuid, timestamptz, text, boolean) to anon, authenticated;
grant execute on function public.lc_admin_save_meet_url(text, uuid, text) to anon, authenticated;
grant execute on function public.lc_admin_resend_booking_email(text, uuid, text) to anon, authenticated;
grant execute on function public.lc_admin_mail_settings(text) to anon, authenticated;
grant execute on function public.lc_admin_save_mail_settings(text, boolean, text, boolean, boolean, boolean, text) to anon, authenticated;
grant execute on function public.lc_admin_mail_preview(text, text) to anon, authenticated;
grant execute on function public.lc_admin_add_payment(text, text, integer, text, text, timestamptz, text, boolean) to anon, authenticated;

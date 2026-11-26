/*
  Leslie Cosmétique — onglet « E-mails » de l'admin
  - lc_admin_emails : historique complet (filtre par statut, recherche), avec la cliente et l'offre concernées
  - lc_admin_resend_email : renvoyer n'importe quel e-mail (à la même adresse ou à une autre)
  - lc_admin_email_alerts : nombre d'e-mails en échec non renvoyés (pastille du menu)
*/

create or replace function public.lc_admin_emails(p_token text, p_status text default null, p_search text default null, p_limit integer default 200)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare
  r json;
  q text := nullif(lower(trim(coalesce(p_search, ''))), '');
  st text := coalesce(nullif(p_status, ''), 'all');
begin
  perform public.lc__admin(p_token);
  select json_build_object(
    'counts', (select json_build_object(
        'all', count(*),
        'sent', count(*) filter (where status = 'sent'),
        'failed', count(*) filter (where status = 'failed'),
        'pending', count(*) filter (where status in ('queued', 'sending')),
        'skipped', count(*) filter (where status = 'skipped'))
      from public.lc_emails),
    'items', coalesce((select json_agg(x order by x.created_at desc) from (
        select e.id, e.kind, e.to_email, e.status, e.subject, e.created_at, e.sent_at, e.attempts, e.error,
               e.data->>'as' as preview_of,
               (e.data->>'resent_from') is not null as is_resend,
               exists (select 1 from public.lc_emails c where c.data->>'resent_from' = e.id::text) as resent,
               coalesce(b.full_name, p.customer_name, '') as client_name,
               coalesce(b.offer_slug, p.offer_slug, '') as offer_slug,
               b.starts_at as booking_starts_at, b.status as booking_status,
               p.amount_cents as payment_cents
        from public.lc_emails e
        left join public.lc_booking_requests b on b.id = e.booking_id
        left join public.lc_payments p on p.id = e.payment_id
        where (st = 'all'
               or (st = 'pending' and e.status in ('queued', 'sending'))
               or e.status = st)
          and (q is null
               or lower(e.to_email) like '%' || q || '%'
               or lower(e.subject) like '%' || q || '%'
               or lower(coalesce(b.full_name, p.customer_name, '')) like '%' || q || '%')
        order by e.created_at desc
        limit greatest(1, least(coalesce(p_limit, 200), 500))) x), '[]'::json)
  ) into r;
  return r;
end $$;

create or replace function public.lc_admin_resend_email(p_token text, p_id uuid, p_to text default null)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare e public.lc_emails; v_to text; v_id uuid;
begin
  perform public.lc__admin(p_token);
  select * into e from public.lc_emails where id = p_id;
  if not found then raise exception 'E-mail introuvable.'; end if;
  if e.status in ('queued', 'sending') then raise exception 'Cet e-mail est déjà en cours d''envoi.'; end if;
  if public.lc__setting('mail_enabled', 'on') <> 'on' then
    raise exception 'Envoi impossible : les e-mails automatiques sont désactivés dans les paramètres.';
  end if;
  v_to := lower(trim(coalesce(nullif(trim(p_to), ''), e.to_email)));
  if v_to !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' or char_length(v_to) > 200 then raise exception 'Adresse e-mail invalide.'; end if;
  insert into public.lc_emails (kind, to_email, booking_id, payment_id, data)
  values (e.kind, v_to, e.booking_id, e.payment_id, e.data || jsonb_build_object('resent_from', e.id))
  returning id into v_id;
  perform public.lc__mail_kick();
  return json_build_object('ok', true, 'id', v_id, 'to', v_to);
end $$;

create or replace function public.lc_admin_email_alerts(p_token text)
returns integer language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public.lc__admin(p_token);
  return (select count(*) from public.lc_emails e
          where e.status = 'failed' and e.created_at > now() - interval '30 days'
            and not exists (select 1 from public.lc_emails c where c.data->>'resent_from' = e.id::text));
end $$;

revoke execute on function public.lc_admin_emails(text, text, text, integer) from public;
revoke execute on function public.lc_admin_resend_email(text, uuid, text) from public;
revoke execute on function public.lc_admin_email_alerts(text) from public;
grant execute on function public.lc_admin_emails(text, text, text, integer) to anon, authenticated;
grant execute on function public.lc_admin_resend_email(text, uuid, text) to anon, authenticated;
grant execute on function public.lc_admin_email_alerts(text) to anon, authenticated;

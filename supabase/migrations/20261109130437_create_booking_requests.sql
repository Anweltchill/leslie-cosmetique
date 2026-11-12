/*
# Booking requests for coaching calls

1. New Tables
- `booking_requests` : a visitor's request to book a 1h video coaching call
  - `id` (uuid, primary key)
  - `offer_slug` (text) : which coaching (formulation, hair care, brand launch)
  - `starts_at` (timestamptz) : chosen slot start (UTC)
  - `full_name`, `email`, `phone` (text) : contact details
  - `message` (text) : optional project description
  - `status` (text) : pending / confirmed / cancelled, defaults to pending
  - `created_at` (timestamptz)

2. Security
- RLS enabled. Visitors (anon/authenticated) may only INSERT new pending requests, on a whitelist of columns.
- No SELECT/UPDATE/DELETE for visitors: personal details stay private (only the owner, via the dashboard, sees them).
- `get_taken_slots(from, to)` SECURITY DEFINER returns ONLY start times of already-booked slots so the calendar can grey them out without exposing anyone's data.

3. Important notes
1. A partial unique index prevents two active requests on the same slot.
2. Check constraints validate the offer, email format, text lengths and future slot.
*/

CREATE TABLE IF NOT EXISTS booking_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_slug text NOT NULL CHECK (offer_slug IN ('coaching-formulation','coaching-conseils-capillaires','consultation-lancement-marque')),
  starts_at timestamptz NOT NULL,
  full_name text NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 120),
  email text NOT NULL CHECK (char_length(email) <= 200 AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text NOT NULL DEFAULT '' CHECK (char_length(phone) <= 40),
  message text NOT NULL DEFAULT '' CHECK (char_length(message) <= 2000),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS booking_requests_active_slot
  ON booking_requests (starts_at) WHERE status <> 'cancelled';

ALTER TABLE booking_requests ENABLE ROW LEVEL SECURITY;

GRANT INSERT (offer_slug, starts_at, full_name, email, phone, message) ON booking_requests TO anon, authenticated;

DROP POLICY IF EXISTS "visitors_insert_pending_booking" ON booking_requests;
CREATE POLICY "visitors_insert_pending_booking" ON booking_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (status = 'pending' AND starts_at > now() AND starts_at < now() + interval '120 days');

CREATE OR REPLACE FUNCTION public.get_taken_slots(range_from timestamptz, range_to timestamptz)
RETURNS TABLE (starts_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.starts_at FROM public.booking_requests b
  WHERE b.status <> 'cancelled'
    AND b.starts_at >= range_from
    AND b.starts_at < range_to
    AND range_to - range_from <= interval '62 days';
$$;

REVOKE EXECUTE ON FUNCTION public.get_taken_slots(timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_taken_slots(timestamptz, timestamptz) TO anon, authenticated;

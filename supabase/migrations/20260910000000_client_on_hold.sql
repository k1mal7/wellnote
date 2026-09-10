-- Additive change: existing client ownership/RLS policies remain in effect.
BEGIN;
ALTER TABLE public.clients
  ADD COLUMN on_hold boolean NOT NULL DEFAULT false,
  ADD COLUMN hold_return_date date;
ALTER TABLE public.clients
  ADD CONSTRAINT clients_hold_return_date_requires_hold
  CHECK (on_hold OR hold_return_date IS NULL);
COMMIT;

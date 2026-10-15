-- Supabase grants ALL on new public tables to anon/authenticated by default.
-- RLS already blocks anon reads (policies are "to authenticated" only), but
-- revoke the underlying grant too so there is no reliance on RLS alone —
-- anon's only path to data stays the 4 SECURITY DEFINER RPC functions.
revoke all on all tables in schema public from anon;

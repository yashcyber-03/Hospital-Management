-- Run in SQL Editor after 0001-0003. Lets a signed-in ADMIN promote a registered user to doctor from the website.
create or replace function admin_make_doctor(p_email text, p_dept text, p_spec text, p_fee numeric)
returns void language plpgsql security definer set search_path = public as $$
begin
  if app_role() is distinct from 'admin' then raise exception 'Admins only'; end if;
  if p_fee is null or p_fee < 0 then raise exception 'Invalid fee'; end if;
  perform make_demo_doctor(lower(trim(p_email)), p_dept, p_spec, p_fee);
  insert into audit_logs (actor, action, table_name, row_id) values (auth.uid(), 'make_doctor', 'doctors', lower(trim(p_email)));
end $$;
revoke all on function admin_make_doctor from public, anon;
grant execute on function admin_make_doctor to authenticated;

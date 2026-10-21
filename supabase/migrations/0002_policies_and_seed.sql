-- Run AFTER 0001. Lets signed-in users see approved doctors' names; seeds departments.
create policy "approved doctor names public" on profiles for select
  using (exists (select 1 from doctors d where d.profile_id = profiles.id and d.approved));

insert into departments (name, description) values
 ('Cardiology','Heart and blood vessels'),('Orthopedics','Bones and joints'),
 ('Pediatrics','Child health'),('Neurology','Brain and nerves'),
 ('Dermatology','Skin care'),('General Medicine','Primary care')
on conflict (name) do nothing;

-- Turn an existing signed-up user into an approved demo doctor with Mon-Sat 9-13 and 14-17 slots.
-- Usage (SQL Editor): select make_demo_doctor('doctor1@example.com','Cardiology','Cardiologist',500);
create or replace function make_demo_doctor(p_email text, p_dept text, p_spec text, p_fee numeric)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid; did uuid;
begin
  select id into uid from auth.users where email = p_email;
  if uid is null then raise exception 'Sign up this email in the app first'; end if;
  update profiles set role = 'doctor' where id = uid;
  delete from patients where profile_id = uid;
  insert into doctors (profile_id, department_id, specialization, consultation_fee, approved)
  values (uid, (select id from departments where name = p_dept), p_spec, p_fee, true)
  on conflict (profile_id) do update set approved = true returning id into did;
  insert into doctor_schedules (doctor_id, weekday, start_time, end_time)
  select did, d, t.s, t.e from generate_series(1,6) d,
   (values ('09:00'::time,'13:00'::time),('14:00'::time,'17:00'::time)) t(s,e)
  on conflict do nothing;
end $$;
revoke all on function make_demo_doctor from public, anon, authenticated;

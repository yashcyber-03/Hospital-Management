-- Run in SQL Editor after 0001-0004. Tightens receptionist/staff permissions.

-- 1) Staff can read/add/edit patients but only admins can delete them.
drop policy if exists "staff all patients" on patients;
create policy "staff read patients"   on patients for select using (is_staff());
create policy "staff insert patients" on patients for insert with check (is_staff());
create policy "staff update patients" on patients for update using (is_staff());
create policy "admin delete patients" on patients for delete using (app_role() = 'admin');

-- 2) Appointment rows: only the status (and reason) may be edited directly.
--    Patient, doctor and time are fixed; changing a time must go through reschedule_appointment().
create or replace function guard_appointment_update() returns trigger
language plpgsql as $$
begin
  if (new.patient_id, new.doctor_id, new.starts_at, new.ends_at)
     is distinct from (old.patient_id, old.doctor_id, old.starts_at, old.ends_at) then
    raise exception 'Only the appointment status can be changed';
  end if;
  return new;
end $$;
drop trigger if exists appointments_update_guard on appointments;
create trigger appointments_update_guard before update on appointments
  for each row execute function guard_appointment_update();

-- Run in SQL Editor after 0001-0005. Creates in-app notifications for bookings, cancellations and completed visits.
create or replace function notify_appointment() returns trigger
language plpgsql security definer set search_path = public as $$
declare pu uuid; du uuid; pname text; dname text; ts text;
begin
  select profile_id, full_name into pu, pname from patients where id = new.patient_id;
  select d.profile_id, p.full_name into du, dname from doctors d join profiles p on p.id = d.profile_id where d.id = new.doctor_id;
  ts := to_char(new.starts_at at time zone 'Asia/Kolkata', 'DD Mon YYYY, HH12:MI AM');
  pname := coalesce(pname, 'a patient'); dname := coalesce(dname, 'your doctor');

  if tg_op = 'INSERT' then
    if pu is not null then insert into notifications (user_id, message) values (pu, 'Appointment booked with ' || dname || ' on ' || ts); end if;
    if du is not null then insert into notifications (user_id, message) values (du, 'New appointment: ' || pname || ' on ' || ts); end if;
  elsif new.status is distinct from old.status then
    if new.status = 'cancelled' then
      if pu is not null then insert into notifications (user_id, message) values (pu, 'Appointment with ' || dname || ' on ' || ts || ' was cancelled'); end if;
      if du is not null then insert into notifications (user_id, message) values (du, 'Cancelled: ' || pname || ' on ' || ts); end if;
    elsif new.status = 'completed' and pu is not null then
      insert into notifications (user_id, message) values (pu, 'Your visit with ' || dname || ' is marked completed');
    end if;
  end if;
  return new;
end $$;
drop trigger if exists appointments_notify on appointments;
create trigger appointments_notify after insert or update on appointments
  for each row execute function notify_appointment();

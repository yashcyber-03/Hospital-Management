-- Hospital Management System: core schema, RLS, booking functions
-- Run in Supabase Dashboard > SQL Editor (or `supabase db push`).

create extension if not exists btree_gist;

create type user_role as enum ('patient','doctor','receptionist','admin');
create type appt_status as enum ('booked','checked_in','completed','cancelled','no_show');
create type pay_status as enum ('unpaid','partial','paid','refunded');

-- ---------- Tables ----------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  role user_role not null default 'patient',
  created_at timestamptz not null default now()
);

create table departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text
);

create table patients (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references profiles(id) on delete set null,
  full_name text not null,
  phone text,
  dob date,
  gender text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table doctors (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique not null references profiles(id) on delete cascade,
  department_id uuid references departments(id),
  specialization text not null,
  consultation_fee numeric(10,2) not null check (consultation_fee >= 0),
  approved boolean not null default false
);

create table doctor_schedules (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references doctors(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6), -- 0 = Sunday
  start_time time not null,
  end_time time not null,
  slot_minutes smallint not null default 30 check (slot_minutes between 10 and 120),
  check (end_time > start_time),
  unique (doctor_id, weekday, start_time)
);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references doctors(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status appt_status not null default 'booked',
  reason text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  -- DB-level guarantee: no two active appointments overlap for one doctor
  constraint no_doctor_overlap exclude using gist (
    doctor_id with =, tstzrange(starts_at, ends_at) with &&
  ) where (status in ('booked','checked_in','completed'))
);
create index on appointments (doctor_id, starts_at);
create index on appointments (patient_id, starts_at);

create table medical_records (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references doctors(id),
  appointment_id uuid references appointments(id),
  notes text not null,
  created_at timestamptz not null default now()
);
create index on medical_records (patient_id);

create table prescriptions (
  id uuid primary key default gen_random_uuid(),
  record_id uuid references medical_records(id) on delete cascade,
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references doctors(id),
  created_at timestamptz not null default now()
);
create table prescription_items (
  id uuid primary key default gen_random_uuid(),
  prescription_id uuid not null references prescriptions(id) on delete cascade,
  medicine text not null,
  dosage text not null,
  duration text
);

create table invoices (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  appointment_id uuid references appointments(id),
  amount numeric(10,2) not null check (amount >= 0),
  status pay_status not null default 'unpaid',
  created_at timestamptz not null default now()
);
create table payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  amount numeric(10,2) not null check (amount > 0),
  method text not null,
  paid_at timestamptz not null default now()
);
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create table audit_logs (
  id bigint generated always as identity primary key,
  actor uuid,
  action text not null,
  table_name text,
  row_id text,
  created_at timestamptz not null default now()
);

-- ---------- Helper functions (security definer, avoid RLS recursion) ----------
create function app_role() returns user_role
language sql stable security definer set search_path = public as
$$ select role from profiles where id = auth.uid() $$;

create function my_patient_id() returns uuid
language sql stable security definer set search_path = public as
$$ select id from patients where profile_id = auth.uid() $$;

create function my_doctor_id() returns uuid
language sql stable security definer set search_path = public as
$$ select id from doctors where profile_id = auth.uid() $$;

create function is_staff() returns boolean
language sql stable security definer set search_path = public as
$$ select coalesce(app_role() in ('admin','receptionist'), false) $$;

-- Doctor may see a patient only if they have an appointment together
create function doctor_treats(p uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from appointments
   where patient_id = p and doctor_id = my_doctor_id()) $$;

-- ---------- New-user trigger: ALWAYS creates a patient; role never read from client metadata ----------
create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare pid uuid;
begin
  insert into profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''));
  insert into patients (profile_id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- Block role changes by anyone except an admin (stops self-promotion)
create function guard_role_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and coalesce(app_role(),'patient') <> 'admin'
     and auth.uid() is not null then
    raise exception 'Only administrators can change roles';
  end if;
  return new;
end $$;
create trigger profiles_role_guard before update on profiles
  for each row execute function guard_role_change();

-- ---------- Booking functions ----------
create function get_available_slots(p_doctor uuid, p_date date)
returns table (slot_start timestamptz, slot_end timestamptz)
language sql stable security definer set search_path = public as $$
  select s, s + make_interval(mins => ds.slot_minutes)
  from doctor_schedules ds
  join doctors d on d.id = ds.doctor_id and d.approved
  cross join lateral generate_series(
      (p_date + ds.start_time) at time zone 'Asia/Kolkata',
      (p_date + ds.end_time - make_interval(mins => ds.slot_minutes)) at time zone 'Asia/Kolkata',
      make_interval(mins => ds.slot_minutes)) as s
  where ds.doctor_id = p_doctor
    and ds.weekday = extract(dow from p_date)::int
    and s > now()
    and not exists (select 1 from appointments a
        where a.doctor_id = p_doctor and a.status in ('booked','checked_in','completed')
          and tstzrange(a.starts_at, a.ends_at) && tstzrange(s, s + make_interval(mins => ds.slot_minutes)))
  order by s;
$$;

create function book_appointment(p_doctor uuid, p_patient uuid, p_start timestamptz, p_reason text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_role user_role := app_role(); v_slot smallint; v_id uuid;
begin
  if v_role is null then raise exception 'Not authenticated'; end if;
  if v_role = 'patient' and p_patient <> my_patient_id() then
    raise exception 'You can only book for yourself'; end if;
  if v_role = 'doctor' then raise exception 'Doctors cannot book appointments'; end if;
  if p_start <= now() then raise exception 'Cannot book in the past'; end if;

  select ds.slot_minutes into v_slot
  from doctor_schedules ds join doctors d on d.id = ds.doctor_id and d.approved
  where ds.doctor_id = p_doctor
    and ds.weekday = extract(dow from p_start at time zone 'Asia/Kolkata')::int
    and (p_start at time zone 'Asia/Kolkata')::time >= ds.start_time
    and (p_start at time zone 'Asia/Kolkata')::time + make_interval(mins => ds.slot_minutes) <= ds.end_time
  limit 1;
  if v_slot is null then raise exception 'Outside doctor working hours'; end if;

  begin
    insert into appointments (patient_id, doctor_id, starts_at, ends_at, reason, created_by)
    values (p_patient, p_doctor, p_start, p_start + make_interval(mins => v_slot), p_reason, auth.uid())
    returning id into v_id;
  exception when exclusion_violation then
    raise exception 'That slot was just taken. Please pick another time.';
  end;

  insert into audit_logs (actor, action, table_name, row_id) values (auth.uid(),'book','appointments',v_id::text);
  return v_id;
end $$;

create function cancel_appointment(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare a appointments;
begin
  select * into a from appointments where id = p_id for update;
  if not found then raise exception 'Appointment not found'; end if;
  if not (is_staff() or a.patient_id = my_patient_id() or a.doctor_id = my_doctor_id()) then
    raise exception 'Not allowed'; end if;
  if a.status <> 'booked' then raise exception 'Only booked appointments can be cancelled'; end if;
  update appointments set status = 'cancelled' where id = p_id;
  insert into audit_logs (actor, action, table_name, row_id) values (auth.uid(),'cancel','appointments',p_id::text);
end $$;

create function reschedule_appointment(p_id uuid, p_new_start timestamptz)
returns uuid language plpgsql security definer set search_path = public as $$
declare a appointments; v_new uuid;
begin
  select * into a from appointments where id = p_id for update;
  if not found then raise exception 'Appointment not found'; end if;
  if not (is_staff() or a.patient_id = my_patient_id()) then raise exception 'Not allowed'; end if;
  if a.status <> 'booked' then raise exception 'Only booked appointments can be rescheduled'; end if;
  update appointments set status = 'cancelled' where id = p_id;   -- frees the old slot
  v_new := book_appointment(a.doctor_id, a.patient_id, p_new_start, a.reason); -- whole call rolls back on failure
  return v_new;
end $$;

revoke all on function book_appointment, cancel_appointment, reschedule_appointment, get_available_slots from public;
grant execute on function book_appointment, cancel_appointment, reschedule_appointment, get_available_slots to authenticated;

-- ---------- Row Level Security ----------
alter table profiles enable row level security;
alter table departments enable row level security;
alter table patients enable row level security;
alter table doctors enable row level security;
alter table doctor_schedules enable row level security;
alter table appointments enable row level security;
alter table medical_records enable row level security;
alter table prescriptions enable row level security;
alter table prescription_items enable row level security;
alter table invoices enable row level security;
alter table payments enable row level security;
alter table notifications enable row level security;
alter table audit_logs enable row level security;

-- profiles
create policy "own profile read" on profiles for select using (id = auth.uid() or is_staff());
create policy "own profile update" on profiles for update using (id = auth.uid() or app_role() = 'admin');
create policy "admin manage profiles" on profiles for all using (app_role() = 'admin');

-- public directory data
create policy "departments public" on departments for select using (true);
create policy "departments admin" on departments for all using (app_role() = 'admin');
create policy "approved doctors public" on doctors for select using (approved or id = my_doctor_id() or app_role() = 'admin');
create policy "doctor update own non-approval" on doctors for update using (id = my_doctor_id()) with check (id = my_doctor_id());
create policy "admin manage doctors" on doctors for all using (app_role() = 'admin');
create policy "schedules public" on doctor_schedules for select using (true);
create policy "doctor manage own schedule" on doctor_schedules for all
  using (doctor_id = my_doctor_id()) with check (doctor_id = my_doctor_id());
create policy "admin manage schedules" on doctor_schedules for all using (app_role() = 'admin');

-- patients
create policy "patient own row" on patients for select using (profile_id = auth.uid());
create policy "patient update own" on patients for update using (profile_id = auth.uid());
create policy "staff all patients" on patients for all using (is_staff());
create policy "doctor sees own patients" on patients for select using (doctor_treats(id));

-- appointments: writes happen ONLY through the security-definer functions above,
-- except doctors/staff updating status.
create policy "appt read" on appointments for select using (
  patient_id = my_patient_id() or doctor_id = my_doctor_id() or is_staff());
create policy "appt doctor/staff status update" on appointments for update using (
  doctor_id = my_doctor_id() or is_staff());

-- clinical data
create policy "records read" on medical_records for select using (
  patient_id = my_patient_id() or doctor_id = my_doctor_id() or app_role() = 'admin');
create policy "records doctor insert" on medical_records for insert with check (
  doctor_id = my_doctor_id() and doctor_treats(patient_id));
create policy "records doctor update" on medical_records for update using (doctor_id = my_doctor_id());

create policy "rx read" on prescriptions for select using (
  patient_id = my_patient_id() or doctor_id = my_doctor_id() or app_role() = 'admin');
create policy "rx doctor insert" on prescriptions for insert with check (
  doctor_id = my_doctor_id() and doctor_treats(patient_id));
create policy "rx items read" on prescription_items for select using (
  exists (select 1 from prescriptions p where p.id = prescription_id
    and (p.patient_id = my_patient_id() or p.doctor_id = my_doctor_id() or app_role() = 'admin')));
create policy "rx items doctor insert" on prescription_items for insert with check (
  exists (select 1 from prescriptions p where p.id = prescription_id and p.doctor_id = my_doctor_id()));

-- billing
create policy "invoice read" on invoices for select using (patient_id = my_patient_id() or is_staff());
create policy "invoice staff write" on invoices for all using (is_staff());
create policy "payment read" on payments for select using (
  is_staff() or exists (select 1 from invoices i where i.id = invoice_id and i.patient_id = my_patient_id()));
create policy "payment staff write" on payments for all using (is_staff());

-- notifications & audit
create policy "own notifications" on notifications for select using (user_id = auth.uid());
create policy "mark own read" on notifications for update using (user_id = auth.uid());
create policy "audit admin read" on audit_logs for select using (app_role() = 'admin');
-- (no insert policy on audit_logs: only security-definer functions write to it)

-- ---------- Safe bootstrap of the FIRST admin ----------
-- Sign up normally in the app, then run this ONCE in the SQL Editor (runs as postgres, so the guard allows it):
-- update profiles set role = 'admin' where id = (select id from auth.users where email = 'YOUR_EMAIL');

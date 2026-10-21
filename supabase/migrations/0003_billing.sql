-- Run in SQL Editor after 0001 and 0002.
create or replace function record_payment(p_invoice uuid, p_amount numeric, p_method text)
returns void language plpgsql security definer set search_path = public as $$
declare inv invoices; paid numeric;
begin
  if not is_staff() then raise exception 'Only staff can record payments'; end if;
  select * into inv from invoices where id = p_invoice for update;
  if not found then raise exception 'Invoice not found'; end if;
  select coalesce(sum(amount),0) into paid from payments where invoice_id = p_invoice;
  if p_amount <= 0 then raise exception 'Amount must be positive'; end if;
  if paid + p_amount > inv.amount then raise exception 'Payment exceeds the amount due'; end if;
  insert into payments (invoice_id, amount, method) values (p_invoice, p_amount, p_method);
  update invoices set status = case when paid + p_amount >= inv.amount then 'paid'::pay_status else 'partial'::pay_status end
   where id = p_invoice;
  insert into audit_logs (actor, action, table_name, row_id) values (auth.uid(), 'payment', 'invoices', p_invoice::text);
end $$;
revoke all on function record_payment from public, anon;
grant execute on function record_payment to authenticated;

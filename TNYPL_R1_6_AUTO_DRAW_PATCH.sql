-- TNYPL R1.6 AUTO-DRAW SLOT PATCH
-- Automatically assigns A1,A2,A3,A4,B1,B2,B3,B4.

begin;

create or replace function public.admin_accept_draw_slot(
  p_draw_id bigint,
  p_franchise_id uuid,
  p_position_code text,
  p_random_value numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expected_position text;
  v_group_code text;
  v_spin_number integer;
begin
  if not public.is_tnypl_admin() then
    raise exception 'Admin access required';
  end if;

  select case count(*)
    when 0 then 'A1'
    when 1 then 'A2'
    when 2 then 'A3'
    when 3 then 'A4'
    when 4 then 'B1'
    when 5 then 'B2'
    when 6 then 'B3'
    when 7 then 'B4'
    else null
  end
  into v_expected_position
  from public.tournament_draw_entries
  where draw_id = p_draw_id
    and position_code is not null;

  if v_expected_position is null then
    raise exception 'All eight positions have already been assigned';
  end if;

  if p_position_code <> v_expected_position then
    raise exception
      'Expected position %, received %',
      v_expected_position,
      p_position_code;
  end if;

  if not exists (
    select 1
    from public.tournament_draw_entries
    where draw_id = p_draw_id
      and franchise_id = p_franchise_id
      and position_code is null
  ) then
    raise exception 'Franchise is not eligible for this draw position';
  end if;

  v_group_code := left(v_expected_position,1);

  update public.tournament_draw_entries
  set
    group_code = v_group_code,
    position_code = v_expected_position
  where draw_id = p_draw_id
    and franchise_id = p_franchise_id;

  select coalesce(max(spin_number),0)+1
  into v_spin_number
  from public.tournament_draw_history
  where draw_id = p_draw_id;

  insert into public.tournament_draw_history(
    draw_id,
    franchise_id,
    spin_number,
    stage,
    group_code,
    position_code,
    random_value,
    accepted,
    undone,
    created_by
  )
  values(
    p_draw_id,
    p_franchise_id,
    v_spin_number,
    'position',
    v_group_code,
    v_expected_position,
    p_random_value,
    true,
    false,
    auth.uid()
  );

  if v_expected_position = 'B4' then
    update public.tournament_draws
    set status='completed',updated_at=now()
    where id=p_draw_id;
  end if;
end;
$$;

grant execute on function public.admin_accept_draw_slot(
  bigint,uuid,text,numeric
) to authenticated;

notify pgrst, 'reload schema';

commit;

select to_regprocedure(
  'public.admin_accept_draw_slot(bigint,uuid,text,numeric)'
) as auto_slot_rpc;

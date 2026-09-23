create table if not exists products (
  id text primary key,
  code text not null unique,
  name text not null,
  category text not null default 'General',
  stock integer not null default 0,
  min_stock integer not null default 0,
  cost numeric(12,2) not null default 0,
  created_at timestamptz default now()
);

create table if not exists customers (
  id text primary key,
  name text not null,
  phone text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists sales (
  id text primary key,
  date timestamptz default now(),
  product_id text references products(id),
  product_name text not null,
  quantity integer not null default 1,
  sale_price numeric(12,2) not null default 0,
  cost_total numeric(12,2) not null default 0,
  customer_id text references customers(id),
  customer_name text,
  total numeric(12,2) not null default 0,
  created_at timestamptz default now()
);

alter table products enable row level security;
alter table customers enable row level security;
alter table sales enable row level security;

drop policy if exists "products_public_access" on products;
drop policy if exists "customers_public_access" on customers;
drop policy if exists "sales_public_access" on sales;

create policy "products_public_access" on products
for all using (true) with check (true);

create policy "customers_public_access" on customers
for all using (true) with check (true);

create policy "sales_public_access" on sales
for all using (true) with check (true);

create index if not exists idx_products_stock on products(stock);
create index if not exists idx_sales_date on sales(date desc);

alter table products
  add column if not exists cost numeric(12,2) default 0;

alter table sales
  add column if not exists cost_total numeric(12,2) default 0;

create extension if not exists pgcrypto;

create table if not exists users (
  id text primary key,
  name text not null,
  email text not null unique,
  password_hash text not null,
  created_at timestamptz default now()
);

alter table users enable row level security;

create or replace function register_user(
  p_id text,
  p_name text,
  p_email text,
  p_password text
)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user users%rowtype;
begin
  if length(trim(p_name)) = 0 then
    raise exception 'El nombre es obligatorio para crear un usuario.';
  end if;

  if length(p_password) < 6 then
    raise exception 'La contraseña debe tener al menos 6 caracteres.';
  end if;

  if exists (select 1 from users where lower(email) = lower(trim(p_email))) then
    raise exception 'Ese email ya está registrado.';
  end if;

  insert into users (id, name, email, password_hash)
  values (
    p_id,
    trim(p_name),
    lower(trim(p_email)),
    crypt(p_password, gen_salt('bf'))
  )
  returning * into v_user;

  return json_build_object(
    'id', v_user.id,
    'name', v_user.name,
    'email', v_user.email
  );
end;
$$;

create or replace function login_user(
  p_email text,
  p_password text
)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user users%rowtype;
begin
  select *
  into v_user
  from users
  where lower(email) = lower(trim(p_email));

  if v_user.id is null then
    return null;
  end if;

  if v_user.password_hash = crypt(p_password, v_user.password_hash) then
    return json_build_object(
      'id', v_user.id,
      'name', v_user.name,
      'email', v_user.email
    );
  end if;

  return null;
end;
$$;

grant execute on function register_user(text, text, text, text) to anon, authenticated;
grant execute on function login_user(text, text) to anon, authenticated;

insert into users (id, name, email, password_hash)
values (
  'demo-admin',
  'Administrador',
  'admin@darma.com',
  crypt('darma123', gen_salt('bf'))
)
on conflict (email) do nothing;

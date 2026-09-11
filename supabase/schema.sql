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

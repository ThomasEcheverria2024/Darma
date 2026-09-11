# Darma

Sistema de gestión de ventas para productos de limpieza automotriz.

## Stack

- Next.js 16
- React 19
- Supabase
- XLSX para importar listas
- Persistencia local + Supabase

## Requisitos

1. Node.js 20+
2. Cuenta en Supabase
3. Proyecto en Vercel

## Configuración local

Copia el archivo de ejemplo:

```bash
copy .env.example .env.local
```

Luego completa los valores reales:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

Y ejecuta:

```bash
npm install
npm run dev
```

## Base de datos en Supabase

En tu proyecto de Supabase, abre SQL Editor y ejecuta el contenido de:

```bash
supabase/schema.sql
```

Esto crea las tablas:

- products
- customers
- sales
- users

También crea funciones seguras para registrar e iniciar sesión (`register_user`, `login_user`) y un usuario demo:

- Email: `admin@darma.com`
- Contraseña: `darma123`

Si ya ejecutaste el schema antes, volvé a correr solo la sección de `users` al final de `supabase/schema.sql`.

## Deploy en Vercel

1. Subí este repo a GitHub.
2. En Vercel, importa el proyecto.
3. En Project Settings > Environment Variables, agrega:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
4. Haz deploy.

## Comportamiento

- Si hay variables de Supabase configuradas, la app intenta guardar y leer desde la base de datos.
- Si no hay conexión o no están configuradas, usa localStorage como fallback persistente.
- Los productos pueden importarse desde Excel/CSV.
- El precio de venta se ingresa al momento de registrar la venta.
- El stock se descuenta automáticamente.

## Importación de lista

La app acepta archivos `.xlsx`, `.xls` o `.csv` con columnas como:

- codigo / code / sku
- nombre / name / producto
- categoria / category / tipo
- stock
- stock_minimo / min_stock

## Notas

La app está lista para funcionar en Vercel con Supabase, siempre que se agreguen las variables de entorno en el proyecto desplegado.

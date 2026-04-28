-- Setup para bucket de avatares en Supabase Storage
-- Ejecutar esto en el SQL Editor de Supabase

-- 1. Crear bucket de avatares si no existe
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

-- 2. Habilitar RLS en el bucket de avatares
alter table storage.objects enable row level security;

-- 3. Policy: Usuarios autenticados pueden subir sus propios avatares
create policy "Users can upload their own avatar"
on storage.objects
for insert
with check (
  bucket_id = 'avatars' and 
  auth.role() = 'authenticated' and
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Policy: Usuarios autenticados pueden ver sus propios avatares
create policy "Users can view their own avatar"
on storage.objects
for select
using (
  bucket_id = 'avatars' and 
  auth.role() = 'authenticated' and
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Policy: Usuarios autenticados pueden actualizar sus propios avatares
create policy "Users can update their own avatar"
on storage.objects
for update
using (
  bucket_id = 'avatars' and 
  auth.role() = 'authenticated' and
  (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars' and 
  auth.role() = 'authenticated' and
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. Policy: Usuarios autenticados pueden eliminar sus propios avatares
create policy "Users can delete their own avatar"
on storage.objects
for delete
using (
  bucket_id = 'avatars' and 
  auth.role() = 'authenticated' and
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 7. Policy: Todos pueden ver avatares públicos (para mostrar en mapa y lista de participantes)
create policy "Public can view avatars"
on storage.objects
for select
using (bucket_id = 'avatars');

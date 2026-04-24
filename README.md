# Los+58

Base inicial de una PWA para comunidad motera construida con Next.js, Tailwind CSS, Supabase y Leaflet.

## Incluye

- Layout movil primero
- Navegacion inferior
- Home con boton SOS protagonista
- Vista de mapa con Leaflet + OpenStreetMap
- Vista de alertas SOS activas
- Perfil del motero
- Manifest PWA inicial

## Primeros pasos

```bash
npm install
npm run dev
```

## Variables de entorno

Copiar `.env.example` a `.env.local` y completar:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Autenticacion con Supabase

- `login` en `/login`
- `registro` en `/registro`
- middleware para proteger rutas privadas
- sesion persistente usando Supabase Auth

## Mapa en tiempo real

- usa Geolocation API del navegador
- guarda `latitude` y `longitude` en `public.profiles`
- actualiza la posicion cada 10 segundos mientras `is_on_route = true`
- muestra moteros activos usando Leaflet, OpenStreetMap y Supabase Realtime

## SOS

- pide confirmacion antes de enviar
- captura ubicacion actual al confirmar
- crea registros en `public.sos_alerts`
- cambia `profiles.emergency_state` a `emergency`
- deja lista la tabla `push_subscriptions` para futuras notificaciones push

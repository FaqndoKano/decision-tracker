# Decision Tracker Setup Guide

Los agentes de Rufflo están construyendo el código. Mientras terminan, sigue estos pasos para la infraestructura.

---

## Paso 1: Crear Supabase Project (ahora, en paralelo)

1. Abre [supabase.com](https://supabase.com)
2. Click "New project"
3. Nombre: `decision-tracker`
4. Region: (elige la más cercana a ti)
5. Database password: (guarda esta en un lugar seguro)
6. Espera 1-2 min a que se cree

### Paso 1b: Correr SQL Schema

Una vez que Supabase esté listo:

1. Abre el SQL Editor en el dashboard
2. Copia TODO el bloque SQL de `decision-schema.md` (busca `-- Enable UUID extension`)
3. Pega en el SQL Editor
4. Click "Run"
5. Espera a que complete

---

## Paso 2: Obtener Credenciales

En el dashboard de Supabase:

1. Abre "Settings" → "API"
2. Copia estos dos valores:
   - `Project URL` → pegá en `.env.local` como `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → pegá como `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Luego copia `service_role` key → guardá como `SUPABASE_SERVICE_ROLE_KEY` (para scripts)

---

## Paso 3: Configurar .env.local

Los agentes van a crear `.env.local`. Completá con los valores de Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://XXXXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

---

## Paso 4: Seedear datos de ejemplo

Una vez que `.env.local` esté configurado:

```bash
npx ts-node scripts/seed.ts
```

Esto carga las 5 decisiones ejemplo en tu DB.

---

## Paso 5: Verificar localmente

```bash
npm run dev
```

Abre http://localhost:3000 — deberías ver:
- Página de Feed con 5 decisiones
- Botón "+ New Decision" funcional
- Poder crear, ver y filtrar decisiones

---

## Paso 6: Deploy a Vercel (opcional, pero recomendado)

```bash
npm install -g vercel
vercel
```

Sigue los prompts. Cuando te pida env vars, agregá los mismos 3 valores de Supabase.

URL final: `https://decision-tracker-XXXX.vercel.app`

---

## Checklist de MVP Completo

- [ ] Next.js 14 initialized con TypeScript + Tailwind
- [ ] Supabase project creado y schema ejecutado
- [ ] `.env.local` configurado con credenciales
- [ ] app/page.tsx (Feed) funciona
- [ ] app/new/page.tsx (Form) funciona
- [ ] app/decisions/[id]/page.tsx (Detail) funciona
- [ ] api/export/route.ts (Export CSV) funciona
- [ ] Database seeded con 5 ejemplos
- [ ] `npm run dev` muestra todo sin errores
- [ ] (Opcional) Deployed a Vercel

---

## Troubleshooting

**Error: "NEXT_PUBLIC_SUPABASE_URL not defined"**
→ Verificá que `.env.local` tiene los 3 valores y está en la raíz del proyecto.

**Error: "Cannot find Supabase"**
→ Ejecutá `npm install @supabase/supabase-js` nuevamente.

**Datos no cargan en Feed**
→ Verificá que `npx ts-node scripts/seed.ts` ran sin errores.

**Build falla con "page.tsx not found"**
→ Los agentes deberían haberlo creado. Si no, reviá la salida de los logs.

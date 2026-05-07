# Decision Tracker — Project Memory

## Objetivo
Herramienta interna de Edusogno para registrar, revisar y analizar decisiones de paid media (Meta / Google) en los mercados IT, ES, DE, FR. Permite documentar decisiones, ver métricas reales de CPL antes/después desde la DB de producción, y construir un playbook de aprendizajes.

## Stack
- **Frontend/Backend:** Next.js 16 App Router, TypeScript, Tailwind CSS
- **DB decisiones:** PostgreSQL (Neon) via `pg`
- **DB métricas:** MySQL (edus_academy, 65.109.120.219:3308) via `mysql2` — READ ONLY
- **Deploy:** Vercel

---

## Agentes y sus aportes

### 🔵 Viktor — DB Integration
- Pool MySQL singleton en `lib/edusogno-db.ts`
- Tres funciones: `getPeriodMetrics`, `getCPLAroundDecision`, `getCampaignSnapshot`
- Fuentes: `advertising_cost` (spend), `crm` (leads + meetings)
- Filtros clave: `utm_campaign IS NOT NULL`, `utm_source IN (...)`, CASE detected_language (replica exacta de Power BI)
- Campaign name: `TRIM(SUBSTRING_INDEX(campaign, ' || Paid', 1))`
- Meetings: `IS NOT NULL` = agendada, `LIKE '%"interviewer"%'` = hecha
- APIs: `GET /api/metrics`, `GET /api/metrics/snapshot` (acepta `date_from`+`date_to` o `date`+`window`)
- Todo SELECT, cero escritura

### 🟣 Sofia — UI & Features
- Editor inline de decisiones (autenticado)
- Tabla Before/After: snapshots paralelos ±7 días, merged por campaña, Δ CPL con color
- `CplDelta`: muestra ±€ y % — verde si CPL baja
- Funnel toggle: Booking Rate% + Meeting Done% para ambos períodos
- `DecisionTimeline` SVG en Stats: dots Meta (verde) arriba / Google (azul) abajo del eje, hover tooltip, click navega
- Range selector: 14d / 30d / 60d / 90d
- Mobile hamburger nav (`MobileNav.tsx`)

### 🩷 Luna — Design & PWA
- Paleta 100% pastel: `#E0E0E0` bg, `#E080C0` pink, `#E0C0E0` lavanda, `#C0E0E0` cyan
- Cero colores oscuros — eliminados todos los `#000`, `#202020`, `#404040`
- Tailwind: solo blue-500/600/700 remapeados a pink; resto sin tocar
- Header lavanda con CSS puro (sin JS handlers — Server Component constraint)
- Logo PNG real con `mix-blend-mode: multiply`
- PWA: `manifest.json` + `icon.svg` + apple meta tags → instalable en iOS/Android

---

## Learnings implementados
- `detected_language` CASE completo (replica Power BI) para filtrar CRM por país
- `utm_campaign IS NOT NULL` requerido en ambas queries (antes/después) para consistencia
- `serverExternalPackages: ['mysql2']` en next.config.ts para Vercel
- Event handlers no van en Server Components → usar CSS classes
- Next.js `Image` con proporciones incorrectas → usar `<img>` plain

---

## Sugerencias futuras

### Corto plazo
- **Notificaciones push** cuando vence una review date (usar Vercel Cron + Web Push)
- **Filtros en el Feed** por país + plataforma + categoría
- **Exportar a CSV** la tabla Before/After de una decisión

### Medio plazo
- **Audio memos**: grabar nota de voz al crear decisión (Web Audio API → Vercel Blob)
- **Transcripción automática**: Whisper API para convertir audio a texto y pre-llenar el formulario
- **Alertas de CPL**: si CPL sube >20% post-decisión, notificar automáticamente

### Largo plazo
- **Dashboard ejecutivo**: vista semanal con todas las decisiones activas y su impacto en CPL
- **AI summary**: GPT-4 lee todas las decisiones y genera un resumen del período
- **Multi-usuario**: roles (viewer / editor / admin) con auth más completa

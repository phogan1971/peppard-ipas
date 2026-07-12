# CLAUDE.md — Peppard IPAS Operator Dashboard

Developer reference for AI-assisted sessions. Read this before making any
changes. This file is the **single source of truth** for the project's
analysis — earlier scattered chat analysis is superseded by what's here.

---

## Project overview

A compliance and operations dashboard for **Peppard Investments**, which
operates 8 IPAS (International Protection Accommodation Services)
accommodation centres across Ireland. Commissioned by Des (Peppard) via the
design-requirements descriptor; delivered by Origin under the existing
Framework Services Agreement. The near-term deliverable is a **working demo
for a Department of Justice meeting** (a PPT fallback is acceptable but the
live demo is the goal).

**Stack:** React 18 + TypeScript, Vite 6, MUI 5, react-router-dom 6,
recharts — deliberately matching `Genisis3` (connects-health-portal) so
components and patterns transfer in both directions.

**No backend.** The demo runs entirely on seed JSON + localStorage,
following Genisis3's offline demo-mode pattern. Backend choice for the real
build (AWS/Cognito like Genesis vs Supabase like Earlsfort) is an open
commercial question — do not pre-empt it in code.

---

## The core design constraint: dual regulatory axis

One dataset must feed two different inspection regimes **without double
entry**:

1. **Department of Justice IPPS contractual regime** — granular and
   physical: rooms, ratios, registers. Inspections produce findings graded
   **RED / AMBER / GREEN**, with a **14-day evidence loop** for corrective
   proof. This is contractual exposure — the operator's payment depends
   on it.
2. **HIQA National Standards monitoring** — thematic: **40 standards across
   10 themes**, judged on a 4-point scale (Compliant / Substantially /
   Partially / Not compliant). IPAS centres are **not designated centres**:
   there is no statutory HIQA notification schedule; obligations run to the
   Department and to Tusla. Peppard has **not yet been HIQA-audited** but
   tracks all published sector audits (see benchmark data).

Every register/record in the data model carries tags for **both axes** so
one entry serves both regimes.

## The three modules (descriptor)

1. **Department returns** — the IPPS inspection-report structure digitised
   as live registers: centre master record, seven administration registers,
   **room-level register with automatic suitable-occupancy calculation at
   4.65 m² per person**, fire registers, findings + 14-day evidence loop.
2. **HIQA standards register** — self-assessment per standard per centre,
   with **sector benchmarking** against published HIQA audits (81 centres).
3. **KPI framework** — **13 domains, 74 KPIs**, hard rule: *every KPI
   computes from a register; nothing is manually keyed*.

## Six output views (descriptor)

Daily centre operations · compliance RAG · audit & assurance · quarterly
board pack · Department return generator · one-click inspection readiness
pack.

## Phasing

- **Phase 0 (now, for the Department meeting):** four demo screens —
  Group Overview (8 centres, RAG), Centre Operations (Riverside live room
  register + occupancy flags), Findings & 14-day tracker, HIQA Standards
  register with sector benchmark overlay.
- **Phase 1:** centre master + room register + fire registers + findings
  loop (live contractual exposure).
- **Phase 2:** full KPI framework + standards register + benchmarking.
- **Phase 3:** generated outputs (board pack, readiness pack, return
  generator) — descriptor says estimate the room register and return
  generator as discrete work packages.

---

## The 8 centres

| id | Name | Location |
|----|------|----------|
| `riverside` | Riverside Accommodation Centre | Macroom, Cork |
| `blackrock` | Blackrock Accommodation Centre | Blackrock, Co. Dublin |
| `st-johns` | Saint Johns House Accommodation Centre | Tallaght, Co. Dublin |
| `ballaghaderreen` | Ballaghaderreen Accommodation Centre | Co. Roscommon |
| `carraroe` | Carraroe Accommodation Centre | Co. Galway |
| `riverhouse` | Riverhouse Accommodation Centre | Co. Limerick |
| `old-hse` | OLD HSE Accommodation Centre | Buncrana, Co. Donegal |
| `mulroy` | Mulroy Accommodation Centre | Milford, Co. Donegal |

Group context (from client email, 11 Jul 2026): 15+ years operating;
each centre run by a General Manager; head offices Cork + Dublin; uniform
policy suite; internal audits by senior management. **Mackin EHS** is
contracted for fire risk assessments, safety audits, safety statements,
emergency response plans — being compiled into centre-manager trackers
(rollout ~Sep 2026, overseen by Maeve). The dashboard should eventually
ingest/represent the Mackin trackers, but that is post-Phase-0.

Only **Riverside** has a real inspection dataset (24.03.2026 report). The
other 7 centres get plausible-but-clearly-labelled demo data derived from
the Riverside shape.

## Entity model

```
Centre ──< Room            (bedConfig, dimensions m², derived suitableOccupancy @4.65 m²/person, issues)
Centre ──< Register        (staff, fire, cleaning, complaints, incidents, maintenance, visitors…)
Centre ──< Finding         (RAG priority, section, actionRequired, 14-day evidence clock, status)
Centre ──< StandardAssessment (HIQA standard id → 4-point judgement + evidence links)
KPI     ──  computed from Registers (never manually keyed); 13 domains
Every register row carries dual-axis tags: ipps section + hiqa theme/standard.
```

## Source data (extracted, canonical — do not re-analyse the originals)

| File | Contents |
|------|----------|
| `docs/descriptor-extract.md` | Full text of the client descriptor v1.0 |
| `docs/source-data/riverside-inspection.json` | Riverside 24.03.2026 IPPS inspection: centre master, registers, room-by-room table, RAG findings |
| `docs/source-data/hiqa-benchmark.json` | HIQA sector tracker: ~81 centres, per-standard judgements, sector distribution per standard |
| `docs/source-data/hiqa-standards.json` | The 40 National Standards across 10 themes (id + statement) |
| `docs/source-data/kpi-framework.json` | KPI framework as specified in the descriptor (13 domains) |

Originals live in `C:\Users\phoga\Downloads\IPAS Operator Dashboard &
Origin\` and `C:\Users\phoga\Downloads\Peppard_IPAS_Dashboard_Design_
Requirements_Descriptor_v1.0.docx` — only go back to them if an extraction
gap is discovered, and fix the JSON here when you do.

---

## Branding — Origin/Genesis chrome, Peppard identity (Philip, 11 Jul 2026)

All colours come from `src/theme/tokens.ts` — **never hardcode a hex in a
component**. This one-file discipline exists because Genisis3's navy is
unswappable (scattered across hundreds of files); we do not repeat that.
(Proven: the original Peppard-red chrome was swapped to Origin navy by
editing tokens.ts + one sed rename, zero component redesign.)

- App chrome uses the **Genesis platform palette**: primary navy `#00465C`
  (`brand.primary`), hover `#003D4D`, plus Origin mark tones — teal
  `#0E7F8B`, green `#23A566`, mint `#9FCFA8`. Page bg `#F5F5F5`.
- **Peppard red `#E01E1F` lives in `tokens.peppard`** — client identity
  only (banner centre logo, documents), never app chrome. Philip asked
  for the red theme to be toned down in favour of Origin colours.
- Banner: **navy top bar** (`brand.topBar` = hsl(199,57%,23%), Genisis3
  AppHeader exact) — Origin lockup top-left in white (`OriginLogo dark`),
  Peppard logo centred in a white chip, Reset demo right.
- Typography: **Roboto throughout** (Genisis3 main.tsx scale mirrored in
  `theme/index.ts`: h4 34/700 navy, h6 20/600 navy, body1 15px,
  overline caps labels). Cambria/Calibri were dropped 11 Jul 2026 when
  Philip asked to mimic Genisis3 exactly.
- **Alert red is exclusively status.** RAG crimson (`tokens.rag`), always
  colour + text label, never colour alone.
- Logos: `public/peppard-logo.jpg`, `public/origin-mark.png`,
  `public/connects-logo.png` (connects.health, used on the splash).
- Splash screen at `/` (Genesis-navy hero): launcher cards for the
  Genesis portal (https://genesishealthcarenew.netlify.app/, external)
  and this dashboard (`/overview`).

## Design system — Genesis patterns

Follow `Genisis3/DESIGN_SYSTEM_HELPER.md` conventions, Peppard-toned:

- **Standard page shell** — implemented once in `src/components/PageShell.tsx`
  (sticky sub-nav at `top: 64`, icon + h5 title at 1.75rem, subtitle 14px,
  divider, content). Every page uses it.
- **Pill-button sub-nav** — `src/components/PortalSubNav.tsx`: Genisis3
  PortalSubNav verbatim — pills with startIcons inside a #f0f2f5 rounded
  container, borderless, navy-on-select with soft shadow.
- **Stat cards** — `src/components/StatCard.tsx`: Genesis "Alert Summary"
  pattern (large coloured value, tinted 48px icon chip top-right, hover
  lift). Accents from `tokens.accent` (navy/green/blue/orange/purple/red).
- **Accordions** — `src/components/AccordionBlock.tsx`: Genesis §6 block
  (#ebf5ef wrapper, #dde3e6 clickable header hover #cdd5d9, navy bold
  title + caption, navy chevron). Used for HIQA themes + KPI domains.
- **RAG / compliance chips** — `src/components/RagChip.tsx` (theme gives
  all chips Genesis 20px radius).
- Cards/Paper: white, radius 10, 1px #e0e0e0 border, shadow
  `0 2px 4px rgba(0,0,0,0.08)`; table heads navy on #fafafa (theme-level).
- Reuse map from Genisis3 (adapt, don't import): `components/kpi/` (KPI
  tiles, sparklines), `kpiRegistry.json` config-as-data pattern (the 74
  KPIs become configuration, not code), `components/governance/` (board
  dashboard, print report), `components/compliance/` (findings, QIP, risk
  registers), axios-interceptor + localStorage demo mode.

## Conventions

- Semantic HTML; every interactive element labelled; keyboard navigable.
- No new third-party libraries without discussion.
- No comments unless the WHY is non-obvious.
- IDs are kebab-case text (`riverside`), matching seed data.
- Build must pass before committing: `npm run build`.
- One branch per session/work-step; merge promptly.

## Repository structure

```
├── CLAUDE.md                # this file — canonical analysis + conventions
├── docs/
│   ├── descriptor-extract.md
│   └── source-data/         # extracted JSON from client documents
├── public/peppard-logo.jpg
└── src/
    ├── main.tsx / App.tsx   # router: / (splash) , /overview , /centres/:centreId(/readiness|/return) ,
    │                        # /findings , /standards , /kpis , /board-pack
    ├── theme/tokens.ts      # ALL colours + fonts (single source of truth)
    ├── theme/index.ts       # MUI theme built from tokens
    ├── components/          # AppShell, PageShell, PortalSubNav, RagChip, StatCard, ErrorBoundary
    ├── pages/               # GroupOverview, CentreOperations, FindingsTracker, StandardsRegister,
    │                        # KpiFramework, ReadinessPack (print view)
    └── data/                # types, seed (real Riverside + demo siblings), store (localStorage),
                             # kpis (74-KPI framework, 6 computed live)
```

## What IS built (as of 11 Jul 2026)

- All five screens: Group Overview, Centre Operations (live room
  register @4.65 m²), Findings & Actions (14-day evidence clock +
  workflow), HIQA Standards (self-assessment + sector benchmark bars),
  KPI Framework (13 domains / 74 KPIs, 6 computed live from registers).
- All three generated documents (shared `PrintDoc` frame, print → PDF):
  readiness pack `/centres/:id/readiness`, Department return
  `/centres/:id/return`, quarterly board pack `/board-pack`.
- PPT fallback deck: `docs/Peppard_IPAS_Dashboard_Demo.pptx` (11 slides,
  real app screenshots in `docs/screens/`; regenerate screenshots with
  Playwright channel:"chrome" against the dev server).
- **Data scenario system** (`data/profile.ts` + `SettingsDialog`): the
  generated dataset is driven by a profile (compliance / findings
  pressure / KPI performance, each 0–100) persisted in localStorage.
  Default is **broadly positive** (green-dominant with a small amber
  tail) because the system is shown to the Department and HIQA. The
  Settings cog (top bar) offers Strong / Mixed / Under-pressure presets
  plus sliders, and "Apply & regenerate" reseeds everything.
  **The UI never says "demo"** (Philip, 12 Jul 2026) — no demo chips,
  no reset-demo button; copy says "sample data" / "regenerate".
- **Executive view** (`/exec`, linked from the splash's Peppard card):
  phone-first standalone digest — group status banner (worst RAG +
  overdue roll-up), six stat tiles, needs-attention findings list,
  tappable centre list. Same store/selectors as the desktop screens.
- localStorage persistence + ErrorBoundary so a render error never
  blanks a live walkthrough.
- **Help** (`HelpDialog`, ? icon in top bar): table-of-contents help
  covering every section; opens on the topic matching the current route.
- **Dark mode** (moon/sun icon): `ColorModeProvider` +
  `buildPeppardTheme(mode)`; components take surfaces from the
  `useSurfaces()` hook (`tokens.surface` / `tokens.darkSurface`) —
  **never import the light `surface` set directly in a component**.
  Generated documents are wrapped in the always-light `printTheme`
  (they are paper) with an explicit root text colour.
- Riverside finding lifecycle dates are scenario-anchored to "today" so
  evidence clocks read live; content is the real 24.03.2026 findings
  (statuses/dates driven by the findings-pressure slider; one worked
  example always stays visibly in flight).

## What is NOT done yet

- Remaining output views: daily ops digest, audit & assurance view
  (board pack, return generator and readiness pack are DONE as demo
  documents; the descriptor says price the return generator + room
  register as discrete work packages for the real build).
- Wire remaining 68 KPIs to real registers (Phase 2); incident /
  complaints / fire registers themselves.
- Mackin EHS tracker ingestion (rollout ~Sep 2026, Maeve overseeing).
- Backend + auth (AWS/Cognito vs Supabase — open commercial question),
  multi-user, audit trail.
- CI (none yet). Remote exists since 12 Jul 2026:
  https://github.com/phogan1971/peppard-ipas (private) — push after
  merging to main.

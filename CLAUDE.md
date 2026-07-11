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

## Branding — Peppard, not Genesis

All colours come from `src/theme/tokens.ts` — **never hardcode a hex in a
component**. This one-file discipline exists because Genisis3's navy is
unswappable (scattered across hundreds of files); we do not repeat that.

- Peppard Red `#E01E1F` (structural accent: nav, buttons, headings icons)
- Deep Red `#A81516` (hover), Charcoal `#26262A` (text/headings)
- Warm Light `#F8F4F2` (page bg), Pale Red Tint `#FBEDED`, Border `#E8E0DC`
- Typography: **Cambria headings / Calibri body**
- **Brand red ≠ status red.** RAG uses a darker crimson (`tokens.rag`)
  and status is always colour + text label, never colour alone.
- Logo: `public/peppard-logo.jpg` (red mountain + charcoal wordmark).

## Design system — Genesis patterns

Follow `Genisis3/DESIGN_SYSTEM_HELPER.md` conventions, Peppard-toned:

- **Standard page shell** — implemented once in `src/components/PageShell.tsx`
  (sticky sub-nav at `top: 64`, icon + h5 title at 1.75rem, subtitle 14px,
  divider, content). Every page uses it.
- **Pill-button sub-nav** — `src/components/PortalSubNav.tsx` (selected =
  brand red, the Genesis navy-on-select pattern re-toned).
- **RAG / compliance chips** — `src/components/RagChip.tsx`.
- Cards: white Paper, 1px warm border, no elevation.
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
    ├── main.tsx / App.tsx   # router: / , /centres/:centreId , /findings , /standards
    ├── theme/tokens.ts      # ALL colours + fonts (single source of truth)
    ├── theme/index.ts       # MUI theme built from tokens
    ├── components/          # AppShell, PageShell, PortalSubNav, RagChip
    ├── pages/               # GroupOverview, CentreOperations, FindingsTracker, StandardsRegister
    └── data/                # seed data + localStorage demo store (build step 2)
```

## What is NOT done yet

- Step 2: seed data layer (`src/data/`) — typed models + localStorage
  store hydrated from `docs/source-data/*.json`.
- Step 3: the four Phase-0 screens with real data.
- Later: six output views, KPI engine, return generator, Mackin tracker
  ingestion, backend, auth, PPT export.

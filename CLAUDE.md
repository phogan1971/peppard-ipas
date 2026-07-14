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
   with **sector benchmarking** against published HIQA audits (69
   inspections across 52 centres; the app copy says "69 published HIQA
   IPAS inspections").
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
| `docs/source-data/hiqa-benchmark.json` | HIQA sector tracker: 69 inspections across 52 centres, per-standard judgements, sector distribution per standard |
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
  and this dashboard (`/overview`). The AppShell top bar has a **Log out**
  button that navigates to `/` with router state `{ skipIntro: true }`,
  so the splash lands straight on the two launcher cards (skipping the
  2.6s logo intro, which is only for a fresh launch). No real auth — this
  is a return-to-launcher in the offline demo.

## Design system — Genesis patterns

Follow `Genisis3/DESIGN_SYSTEM_HELPER.md` conventions, Peppard-toned:

- **Standard page shell** — implemented once in `src/components/PageShell.tsx`
  (sticky sub-nav at `top: 64`, icon + h5 title at 1.75rem, subtitle 14px,
  divider, content). Every page uses it.
- **Pill-button sub-nav** — `src/components/PortalSubNav.tsx`: Genisis3
  PortalSubNav verbatim — pills with startIcons inside a #f0f2f5 rounded
  container, borderless, navy-on-select with soft shadow. Below `md` the
  six pills collapse to a **burger + current-section label** opening a
  left Drawer (they would otherwise wrap into three sticky rows).
- **Mobile responsiveness** (13 Jul 2026): the app is phone-usable
  throughout — top-bar action icons collapse into one ⋮ overflow menu
  below `sm` (logos shrink); PageShell stacks title/actions vertically on
  xs and header Selects go full-width; the Compliance 18-tab strip becomes
  a "Section" dropdown below `sm` (unread count inlined into the Alerts
  label); Findings' nine centre pills become a Centre dropdown on xs;
  every table sits in a `TableContainer` (scrolls internally, the page
  never scrolls horizontally); and a theme-level `MuiDialog` override
  makes all dialogs near-fullscreen (8px gutter) below `sm` — no
  per-dialog fullScreen wiring. Verified: no route or compliance section
  overflows a 375px viewport.
- **Stat cards** — `src/components/StatCard.tsx`: Genesis "Alert Summary"
  pattern (large coloured value, tinted 48px icon chip top-right, hover
  lift). Accents from `tokens.accent` (navy/green/blue/orange/purple/red).
- **Accordions** — `src/components/AccordionBlock.tsx`: Genesis §6 block
  (#ebf5ef wrapper, #dde3e6 clickable header hover #cdd5d9, navy bold
  title + caption, navy chevron). Used for HIQA themes + KPI domains, and
  the Centre Operations register/fire/notice panes — keyed on `centre.id`
  so they reset **closed** when a facility opens, with a status chip
  (e.g. "6 to review" / "All in date" / "2 missing") in the header.
  `FireRegisterPanel`/`NoticesPanel` take an `embedded` prop to render
  just their list inside the accordion.
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
    │                        # /findings , /compliance , /standards , /kpis , /board-pack
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
- PPT fallback deck: `docs/Peppard_IPAS_Dashboard_Demo.pptx` (17 slides,
  real app screenshots in `docs/screens/`; includes two Compliance slides
  — governance cockpit + risk/QIP registers). **The deck is a Peppard
  document** (Peppard identity — white/charcoal editorial, Peppard-red
  accents, Peppard logo on the cover) with **Origin credited "powered
  by"** (donut + wordmark on light slides / footers, the full white
  Origin lockup as the hero on the charcoal closing). This is the one
  place Peppard identity leads — app chrome stays Origin navy.
  Reproducible via two committed
  scripts (run the dev server first): `node scripts/capture-screens.mjs`
  re-shoots `docs/screens/*` with Playwright channel:"chrome" (system
  Chrome, no Chromium download), then `node scripts/build-deck.mjs`
  rebuilds the `.pptx` with `pptxgenjs`. Slide narrative + layout live in
  `build-deck.mjs`; edit there, never hand-edit the `.pptx`.
- **Data scenario system** (`data/profile.ts` + `SettingsDialog`): the
  generated dataset is driven by a profile (compliance / findings
  pressure / KPI performance, each 0–100) persisted in localStorage.
  Default is **broadly positive** (green-dominant with a small amber
  tail) because the system is shown to the Department and HIQA. The
  Settings cog (top bar) offers Strong / Mixed / Under-pressure presets
  plus sliders, and "Apply & regenerate" reseeds everything. Settings is
  tabbed (**Data** + **Users**); the Users tab is a read-only placeholder
  (name · role · permissions, from the descriptor's §2.2 roles, "Add user"
  disabled) pending backend/auth.
  **The UI never says "demo"** (Philip, 12 Jul 2026) — no demo chips,
  no reset-demo button; copy says "sample data" / "regenerate".
- **Executive view** (`/exec`, linked from the splash's Peppard card):
  phone-first standalone digest — group status banner (worst RAG +
  overdue roll-up), six stat tiles, needs-attention findings list,
  tappable centre list. Same store/selectors as the desktop screens.
- localStorage persistence + ErrorBoundary so a render error never
  blanks a live walkthrough. Storage key is `peppard-ipas:v2`; the
  persisted blob carries an `anchorDate` and `loadPersisted` **re-anchors
  on load** — findings' raisedOn/dueOn and assessment dates shift forward
  by the days elapsed since last persist, so a browser seeded days before
  a meeting still opens in the state it was left in instead of decaying
  into overdue red (reference data already re-anchors every load).
- **Hardening for a live/borrowed machine**: the ErrorBoundary now takes
  a `resetKey` and both the top-level (in `App.tsx`, covering the splash
  and exec view that render outside the shell) and the shell boundary key
  it on the route, so navigating away from a caught error recovers
  instead of sticking. `ChartDialog` wraps its lazy `Suspense` in a
  boundary so a failed chunk (e.g. a redeploy under an open tab) shows an
  in-dialog "Try again", not a blank page. Every localStorage **write**
  goes through `safeSet`/`safeRemove` (`data/safeStorage.ts`) — store
  persist, profile save, colour mode — so private browsing / full quota
  degrades to in-memory instead of throwing mid-mutation; the colour-mode
  write moved out of the setState updater into a `useEffect`. Roboto is
  loaded via a font `<link>` in `index.html` (falls back to system sans
  offline); print CSS there forces `print-color-adjust: exact` and
  `break-inside: avoid` so RAG chips and tables print intact. The splash
  is wrapped in the always-light `printTheme`, so its launcher cards stay
  white/legible in dark mode.
- **Centre occupancy and roomCount are derived, never seeded**:
  `buildState` computes both from the (override-merged) room register, so
  the headline tile, Group Overview bars, exec view, board pack and both
  generated documents always agree with the room table and move when a
  room is edited. Demo-centre room generation distributes a 78–96%-of-
  capacity target across rooms (never above a room's suitable occupancy);
  Riverside sums its real register (166 recorded, 4 rooms unrecorded —
  the report's own "177 on day" gap is surfaced as an explicit
  "N rooms without recorded occupancy" note, never silently).
- **Help** (`HelpDialog`, ? icon in top bar): table-of-contents help
  covering every section; opens on the topic matching the current route.
- **Stat-card drill-down**: summary cards open a detail view of the
  records behind the figure. Two shared dialogs — `DetailDialog` (a list)
  and `ChartDialog` (an animated recharts chart with a bar/pie/line
  toggle). Group Overview, HIQA Standards, Findings & Actions and KPI
  Framework use the list; Centre Operations uses the chart (room status,
  bed utilisation, capacity comparison, over-occupancy, issue mix).
  Note: recharts animation is rAF-driven, so it only plays in a visible
  tab — a backgrounded/headless tab renders the final frame (this is why
  the automation preview shows empty chart *shapes*; real browsers are
  fine). recharts/d3 are code-split into a lazy `ChartCanvas` chunk that
  only loads on first chart open (keeps the main bundle ~195 kB gzip).
  `ChartCanvas` measures its width synchronously (`useLayoutEffect`) and
  passes explicit dims instead of `ResponsiveContainer`, so it draws
  deterministically from the lazy commit; `ChartDialog` still gates on
  the dialog's `onEntered`.
- **Occupancy colour is commercial, not a space-standard risk**
  (`tokens.occupancyColor` / `occupancyBand`): low occupancy = red
  (empty beds = lost contract revenue), amber, then green as a centre
  approaches full. Discrete RAG bands (green ≥85%, amber ≥80%, else red
  — `OCCUPANCY_GREEN_MIN` / `OCCUPANCY_AMBER_MIN`), NOT a continuous
  blend, so every bar is cleanly one RAG colour. Do NOT invert this —
  high occupancy is healthy at the centre level; the 4.65 m²
  space-standard breach is a separate *room-level* signal.
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
- **Operator data entry (write-through)** — the registers are the entry
  point and everything derives, so the demo can *show data being
  populated*, not just a pre-filled dashboard. The store persists three
  override layers on top of the reseeded reference data
  (`roomOverrides` / `registerOverrides` / `fireOverrides` in
  `PersistedState`), each edit stamped `enteredBy`/`enteredAt`:
  - **Room register** (`RoomFormDialog`): Add/Edit a room on Centre
    Operations — enter length × width and suitable occupancy computes at
    4.65 m² live in the dialog; on save the stat tiles, KPI-11-02 and the
    Department return update. `upsertRoom` derives `suitableOccupancy`
    (operator never keys it). `suitableOccupancyFor` carries a 1e-9
    epsilon: 13.95/4.65 is 2.999… in doubles and must floor to 3, not 2
    (twelve real Riverside rooms are exactly 13.95 m²). Operator rooms
    store `lengthM`/`widthM`; inspection rows record area only, so the
    dialog reconstructs a square for display but **preserves the recorded
    area and suitable occupancy unless length/width are actually edited**
    (`dimensionsEdited` flag) — room 217's report value (24.8 m² →
    suitable 4, vs formula 5) survives a no-op edit by design. Add mode
    rejects duplicate room numbers. The dialog re-syncs its fields on
    every open (it stays mounted).
  - **Fire registers** (`markRegisterReviewed`, `logFireCheck`): "Log
    check" stamps today and the currency chip recomputes.
  - **Findings** (`FindingFormDialog` → `addFinding` / `updateFinding`):
    "Raise finding" and per-card **Edit** share one dialog. Fields cover
    source (IPPS inspection / HIQA monitoring / Internal audit /
    Self-inspection), IPPS section, HIQA standard (dual-axis), priority,
    action, raised date and evidence window. `computeDueOn` re-runs the
    14-day clock on any priority/date change (GREEN carries no deadline;
    RED escalates on creation). Every finding — seeded or entered —
    carries `source` + `hiqaStandard` and is editable; all findings live
    in `persisted.findings`, so edits persist without an override layer.
    Date maths stays in local components (no UTC round-trip) so the
    deadline never drifts a day in a positive-offset timezone.
  - **Mandatory notices** (`NoticeItem`, `buildNotices`, `NoticesPanel`
    → `setNoticeVerified`): the IPPS §2 public-notice checklist with a
    displayed/missing state per notice; "Verify" stamps today/by, "Flag"
    marks it missing. Feeds readiness pack §7 and Department return.
  - **Inspection reports** (`SourceDocument`, `buildSourceDocuments`,
    `InspectionReportsPanel` → `addSourceDocument`, `FindingsSummaryTable`):
    Findings & Actions has an "Inspection reports" panel. Riverside ships
    with its real 24.03.2026 IPPS report as a bundled **sample**
    (`public/riverside-inspection-report.pdf`); an operator uploads a PDF
    (attaches to the filtered centre) and it's referenced with a "View
    report" link. No backend/AI PDF extraction offline — so the report's
    findings (Riverside's are seeded from it) are shown as the readable
    **Findings summary table** (Cards/Table toggle), each row linking back
    to its source report. Uploaded PDFs persist as `data:` URLs in their
    own `peppard-ipas:docs:v1` key so a large blob can't fail the main
    state write; `regenerateData` clears them.
  - **Internal governance, audit-led** (Philip): the dashboard is the
    facility's own governance record, NOT a byproduct of external
    inspection. `buildSourceDocuments` seeds an "Internal audit — senior
    management" per centre (kind `internal`, no document → shown
    "Self-assessed"); `recordInternalAudit` lets the facility carry out a
    new self-audit in-app. `SourceDocument.kind` is `internal` | `sample`
    | `uploaded`; `url` is optional (internal audits have none). The
    "Audits & inspections" panel leads with **Record internal audit**;
    **Attach inspection** (Department/HIQA PDF) is the secondary,
    additional input.
  - **Audit → system → KPIs dissemination** (`ReportDisseminationDialog`,
    "Disseminate" per audit/inspection): a 3-stage flow (Source — internal
    audit *or* external inspection → Populates registers/findings/notices/
    rooms/fire, with live counts → Informs the KPI framework, 7 live KPIs
    badged by domain). "Apply to system" confirms it. Framed as design:
    real per-field capture is a later build; today the mapping is shown
    and the live KPIs already recompute from the populated registers. The
    copy stresses the facility drives it — an external inspection should
    find nothing the dashboard hasn't already. The KPI Framework page
    links back ("record an internal audit … choose Disseminate").
  - A success snackbar spells out the ripple ("…KPI, space-standard tiles
    and the Department return updated"). `regenerateData` clears the
    overrides with the seed.
- **Fire safety registers are first-class** (`FireRegister` +
  `fireCurrencyFor`, `buildFireRegisters`, `FireRegisterPanel`): six
  registers with a required check frequency; currency = days-since-last
  vs frequency → in-date / due-soon (>80%) / overdue. `lastEntry` is
  scenario-anchored to today by the compliance slider (the real March
  service dates would read 4 months stale). Shown on Centre Operations,
  summarised in the readiness pack (§4), and drive live KPI-08-01. The
  fire names are filtered out of the flat admin-register list to avoid
  duplication.
- **Dual regulatory axis is visible**: admin register rows carry
  `ippsSection` + `hiqaStandard` tags (rendered as `IPPS §1.3 · HIQA
  4.8` chips) — one entry evidencing both regimes, the descriptor's
  central constraint made concrete. `REGISTER_TAGS` in `seed.ts` is the
  map; **IPPS §s are the real report's own section numbers** (staff/DLP/
  maintenance sit in §1.1 Office Admin per its checklist, kitchen records
  in §2.6) and every HIQA id was verified against the standard texts
  (security→4.8, transport→7.2, comfort/toiletries→4.9, space-standard &
  maintenance→4.2, DLP/visitor child-protection→8.2, kitchen→5.1) — do
  not retag without re-checking `hiqa-standards.json`. Two registers the
  earlier set omitted were added (Transport service & timetable,
  Resident comfort & wellbeing).
- **Riverside seeds its real inspection outcomes, never RNG** (13 Jul
  2026): register statuses come from the report (`RIVERSIDE_REGISTER_GAPS`
  — security roster + both kitchen records "not available", visitor book
  missing its CSS declaration, transport timetable owed within 14 days,
  comfort items partial), notices seed the report's exact §2.2 result
  (only House rules + IPAS house rules missing), and the Department
  return's §3 statuses are DERIVED per section from live registers /
  notices / fire currency (`sectionStatusFor` in store.ts — the old
  `sectionStatus` PRNG is gone). The gaps are the demo's data-entry
  story: "Review"/"Verify" clears them and §3 updates. Closed findings
  never claim IPAS accepted evidence (the real report's evidence boxes
  are unchecked); GREEN findings carry no evidence lifecycle; the finding
  dialog has an UNMARKED priority so the report's ungraded findings stay
  ungraded through an edit.
- **7 KPIs computed live** (was 6): added KPI-08-01 fire register
  currency.
- **Group profile block** on Group Overview + a narrative paragraph on
  the board pack cover (15 years, GM-per-centre, Cork/Dublin offices,
  uniform policy suite, Mackin EHS) — the operator credibility narrative
  from the client email. Mackin EHS also appears as a master-record line
  in the readiness pack and Department return.
- **Fire currency + dual-axis tags propagate to the generated
  documents**: the Department return carries a regulatory-mapping column
  (IPPS §/HIQA) on the admin registers and a fire-currency section; the
  board pack shows a group fire-currency roll-up. The exec view's "needs
  attention" list surfaces findings *approaching* breach (open, evidence
  due ≤3 days), not only RED/overdue.
- **Compliance section** (`/compliance`, `pages/Compliance.tsx`) — an
  IPAS-native rebuild of Genisis3's `components/compliance` module (which
  is 16k LOC of nursing-home JSX on an axios backend; NOT ported — the IA
  and design are the blueprint, built fresh in peppard's TS/localStorage/
  Origin stack, no new deps). **Full 18-tab Genesis IA** (13 Jul 2026)
  with a facility filter: Cockpit · Dashboard · Audit types · Checklists ·
  Scheduling · Conduct · Results · Findings · Actions/CAPA · QIP register ·
  Risk register · QIP review · Meetings · Policies · Evidence · Alerts
  (unread badge on the tab) · My queue · Settings. (The earlier "Audit
  programme" tab was folded into Scheduling/Results; cockpit links there.)
  Phase 1 built: **Governance Cockpit** (`components/compliance/
  GovernanceCockpit.tsx`) — Regulatory Readiness (evidence timeliness,
  open/overdue actions, next internal audit due) + Operational Posture
  (open-actions domain×age matrix, risk posture, audit-programme %), all
  from live findings/documents; **Actions/
  CAPA** (reuses `FindingsSummaryTable` — findings *are* the CAPA loop).
  Phase 2 built the two persisted registers:
  - **Risk register** (`Risk` type, `buildRisks`, `RiskRegister` +
    `RiskFormDialog`, `riskColors.ts`): 5×5 likelihood × impact with
    `riskScore`/`riskBand` (low/moderate/high/extreme), a heatmap plotting
    open risks per cell, KPI cards (open · extreme · high · reviews
    overdue), and an add/edit register table. Feeds the cockpit's Risk
    posture panel.
  - **QIP register** (`Qip` type, `buildQips`, `QipRegister` +
    `QipFormDialog`): quality-improvement plans with theme/owner/target,
    `actionsDone`/`actionsTotal` → `qipProgress`, progress bars and KPI
    cards (active · under review · avg progress · targets overdue).
  Both persist in the main state blob (`risks`/`qips` on `PersistedState`)
  and re-anchor their dates on load like findings; `regenerateData`
  reseeds them.
  Phase 3 (13 Jul 2026) built the audit programme proper + the remaining
  governance sections. New slices seed in `data/complianceSeed.ts`, all
  persisted on `PersistedState`, re-anchored on load and reseeded by
  `regenerateData`:
  - **Audit types & checklists** (`AuditType` with `checklist` +
    `checklistVersion`; `AuditTypesConfig`, `ChecklistEditor`): 7 seeded
    IPAS audit types (IPPS self-inspection, fire, food/HACCP, safeguarding,
    accommodation, wellbeing, Mackin EHS walk), each with a dual-axis
    `sourceStandard` (e.g. "IPPS §2.3 · HIQA 3.1"), a target % and a
    published checklist whose items carry a `critical` flag. Saving a
    checklist bumps the version; Conduct always runs the latest.
  - **Scheduling** (`AuditSchedule`; `AuditScheduling`): table + Monday
    month-calendar views, priority/recurrence chips, schedule dialog;
    "Conduct" on a scheduled row prefills the wizard and submitting
    completes the schedule.
  - **Conduct** (`ConductAudit`; `submitAudit` in store.ts): 3-step
    Stepper — select facility/type → answer each item Compliant / Not
    compliant / N/A with a live score — → review & submit. Submit files an
    `AuditRecord`, logs an internal `SourceDocument`, and **auto-raises an
    AMBER finding (14-day clock, source "Self-inspection") for every
    critical item marked not compliant** — the write-through story.
  - **Dashboard** (`AuditDashboard`): KPI strip, 12-month compliance trend
    (hand-rolled SVG line so recharts stays in its lazy chunk), compliance
    by audit type vs target, recent audits. **Results** (`AuditResults`):
    register with a response-level view dialog (seeded history rows are
    summary-only; `buildAuditRecords` seeds ~48 audits over 12 months).
  - **Findings triage** (`FindingsTriage`; `triageFinding`): filterable
    findings register where each finding is routed down a governance
    pathway (CAPA / escalate to risk / QIP candidate / monitor) with a
    mandatory rationale — escalation creates the linked Risk/Qip
    (`triagePathway`/`linkedRiskId`/`linkedQipId` on `Finding`).
  - **QIP review** (`QipReview`): queue of `under_review` QIPs, reviewed
    via `QipFormDialog`. **Meetings** (`Meeting`; `MeetingsPanel`):
    cadence-typed governance log (group governance / centre management /
    safeguarding / fire safety / resident forum), quorum chips, action
    follow-through %, record dialog. **Policies** (`Policy`;
    `PolicyRegister`): the uniform group policy suite (12 seeded), annual
    review cycle, derived current/due-soon/overdue status, "Mark reviewed"
    stamps today and bumps the minor version. **Evidence**
    (`EvidencePanel`): every `SourceDocument` in one library + PDF attach
    (same 4 MB localStorage budget as Findings & Actions).
  - **Alerts** (`data/alerts.ts` `computeAlerts`; `AlertsPanel`,
    `ComplianceSettings`): alerts are **derived live from the registers**
    (10 rules: RED finding, overdue action, extreme risk, missed/due-soon
    audits, fire/risk/policy/QIP lapses) — never stored, so they can't
    disagree with the data. Deterministic ids (`rule:entityId`) let
    read-state (`alertsRead`) persist; Settings toggles rules
    (`alertRulesDisabled`).
  - **My queue** (`MyQueue`): the manager's work queue — overdue evidence,
    registers needing review, lapsed fire checks, missing notices, risk
    reviews, QIP targets and due audits — every row deep-linking to its
    tab or centre page.
  - `vite.config.ts` dev port honours a `PORT` env override and
    `.claude/launch.json` sets `autoPort`, so two sessions can preview
    this folder at once.

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
- Remote + CI are live (12 Jul 2026):
  https://github.com/phogan1971/peppard-ipas (private), push after
  merging to main; `.github/workflows/build.yml` runs `npm run build`
  on pushes to main and on PRs.
- Deployed (12 Jul 2026): https://peppard-ipas.netlify.app — Netlify
  site `peppard-ipas` (team Workout), linked to this folder. Deploys
  are MANUAL: `netlify deploy --prod --dir dist` after merging to main
  (no Netlify↔GitHub auto-deploy hook yet). SPA routing via
  `public/_redirects`; build config in `netlify.toml`.

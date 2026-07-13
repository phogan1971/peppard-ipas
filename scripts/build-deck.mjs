// Rebuilds docs/Peppard_IPAS_Dashboard_Demo.pptx from the screenshots in
// docs/screens (regenerate those first with scripts/capture-screens.mjs).
// Run from the repo root: node scripts/build-deck.mjs
import pptxgen from "pptxgenjs";

const OUT = "docs/Peppard_IPAS_Dashboard_Demo.pptx";
const S = "docs/screens";

// ── Palette (from the app's theme/tokens; pptxgenjs hex: no leading #) ──
const NAVY = "00465C";
const NAVY_DK = "022A38";
const TEAL = "0E7F8B";
const GREEN = "23A566";
const MINT_BG = "E4F1E8";
const TEAL_BG = "E2EEF0";
const RED = "E01E1F";
const INK = "26262A";
const GRAY = "5A6572";
const LIGHT = "F4F6F8";
const CARD = "FFFFFF";
const BORDER = "E1E6EA";
const WHITE = "FFFFFF";

const FONT = "Calibri";
const IMG_RATIO = 1.6; // screenshots are 2880 x 1800

const p = new pptxgen();
p.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
p.author = "Origin Care Group";
p.company = "Origin Care Group";
p.title = "Peppard IPAS Operator Dashboard";

const softShadow = () => ({ type: "outer", color: "8A96A3", blur: 9, offset: 4, angle: 90, opacity: 0.35 });

// A framed screenshot fitted to a box, aspect-correct, bottom-aligned into it.
function screenshot(slide, path, x, y, w) {
  const h = w / IMG_RATIO;
  slide.addImage({ path, x, y, w, h, sizing: { type: "contain", w, h }, shadow: softShadow() });
  return h;
}

function slideTitle(slide, title, sub) {
  slide.addText(title, { x: 0.55, y: 0.34, w: 12.2, h: 0.6, fontFace: FONT, fontSize: 26, bold: true, color: NAVY, margin: 0 });
  if (sub) slide.addText(sub, { x: 0.55, y: 0.96, w: 12.2, h: 0.4, fontFace: FONT, fontSize: 13, color: GRAY, margin: 0 });
}

function pageNum(slide, n) {
  slide.addText(String(n), { x: 12.6, y: 7.05, w: 0.5, h: 0.3, fontFace: FONT, fontSize: 9, color: GRAY, align: "right", margin: 0 });
}

// Right-hand "highlights" column beside a screenshot.
function highlights(slide, x, y, w, header, points, accent = TEAL) {
  slide.addShape(p.ShapeType.ellipse, { x, y: y + 0.02, w: 0.16, h: 0.16, fill: { color: accent } });
  slide.addText(header, { x: x + 0.26, y: y - 0.06, w: w - 0.26, h: 0.3, fontFace: FONT, fontSize: 12, bold: true, color: NAVY, margin: 0, charSpacing: 1 });
  slide.addText(
    points.map((t, i) => ({ text: t, options: { bullet: { indent: 14 }, breakLine: i < points.length - 1, paraSpaceAfter: 8 } })),
    { x, y: y + 0.36, w, h: 4.4, fontFace: FONT, fontSize: 13, color: INK, valign: "top", margin: 0 },
  );
}

// A rounded content card.
function card(slide, x, y, w, h, fill = CARD) {
  slide.addShape(p.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.09, fill: { color: fill }, line: { color: BORDER, width: 1 }, shadow: softShadow() });
}

// ── Slide layouts ───────────────────────────────────────────────────────

// A standard screenshot slide: title + image left, highlights right.
function shotSlide({ n, title, sub, img, header, points, accent }) {
  const s = p.addSlide();
  s.background = { color: WHITE };
  slideTitle(s, title, sub);
  screenshot(s, `${S}/${img}`, 0.55, 1.45, 8.55);
  highlights(s, 9.35, 1.6, 3.45, header, points, accent);
  pageNum(s, n);
  return s;
}

// 1 ── Title
{
  const s = p.addSlide();
  s.background = { color: NAVY };
  s.addShape(p.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 7.5, fill: { color: NAVY } });
  s.addImage({ path: "public/origin-logo-white.png", x: 0.7, y: 0.6, w: 2.3, h: 0.72, sizing: { type: "contain", w: 2.3, h: 0.72 } });
  s.addText("Peppard IPAS", { x: 0.7, y: 2.35, w: 12, h: 1.0, fontFace: FONT, fontSize: 54, bold: true, color: WHITE, margin: 0 });
  s.addText("Operator Compliance Dashboard", { x: 0.7, y: 3.35, w: 12, h: 0.8, fontFace: FONT, fontSize: 30, color: MINT_BG, margin: 0 });
  s.addText("One dataset — two regulatory regimes — no double entry", {
    x: 0.72, y: 4.35, w: 12, h: 0.5, fontFace: FONT, fontSize: 16, italic: true, color: "9FCFA8", margin: 0,
  });
  s.addText(
    [
      { text: "Eight IPAS accommodation centres · Department of Justice IPPS + HIQA National Standards", options: { breakLine: true, paraSpaceAfter: 4 } },
      { text: "Delivered by Origin under the Framework Services Agreement · peppard-ipas.netlify.app", options: {} },
    ],
    { x: 0.72, y: 6.35, w: 12, h: 0.8, fontFace: FONT, fontSize: 12.5, color: "B8CDD6", margin: 0 },
  );
  // Peppard identity chip, bottom-right
  s.addShape(p.ShapeType.roundRect, { x: 11.0, y: 0.6, w: 1.7, h: 0.95, rectRadius: 0.08, fill: { color: WHITE } });
  s.addImage({ path: "public/peppard-logo.jpg", x: 11.15, y: 0.72, w: 1.4, h: 0.7, sizing: { type: "contain", w: 1.4, h: 0.7 } });
}

// 2 ── The dual regulatory axis
{
  const s = p.addSlide();
  s.background = { color: WHITE };
  slideTitle(s, "The core design constraint: one dataset, two regimes", "Every register carries tags for both — so one entry evidences both regulators");
  // Left card — IPPS
  card(s, 0.55, 1.55, 5.9, 4.05);
  s.addShape(p.ShapeType.ellipse, { x: 0.85, y: 1.85, w: 0.34, h: 0.34, fill: { color: NAVY } });
  s.addText("DoJ", { x: 0.85, y: 1.85, w: 0.34, h: 0.34, fontFace: FONT, fontSize: 9, bold: true, color: WHITE, align: "center", valign: "middle", margin: 0 });
  s.addText("Department of Justice — IPPS contract", { x: 1.32, y: 1.82, w: 4.9, h: 0.4, fontFace: FONT, fontSize: 16, bold: true, color: NAVY, margin: 0 });
  s.addText("Granular, physical, contractual — payment depends on it", { x: 0.85, y: 2.32, w: 5.3, h: 0.35, fontFace: FONT, fontSize: 11.5, italic: true, color: GRAY, margin: 0 });
  s.addText(
    [
      "Rooms, registers and ratios — space standard 4.65 m² per person",
      "Findings graded RED / AMBER / GREEN",
      "14-day evidence loop for corrective proof",
      "The inspection-report structure digitised as live registers",
    ].map((t, i, a) => ({ text: t, options: { bullet: { indent: 14 }, breakLine: i < a.length - 1, paraSpaceAfter: 9 } })),
    { x: 0.85, y: 2.8, w: 5.35, h: 2.6, fontFace: FONT, fontSize: 13.5, color: INK, valign: "top", margin: 0 },
  );
  // Right card — HIQA
  card(s, 6.9, 1.55, 5.9, 4.05);
  s.addShape(p.ShapeType.ellipse, { x: 7.2, y: 1.85, w: 0.34, h: 0.34, fill: { color: TEAL } });
  s.addText("H", { x: 7.2, y: 1.85, w: 0.34, h: 0.34, fontFace: FONT, fontSize: 11, bold: true, color: WHITE, align: "center", valign: "middle", margin: 0 });
  s.addText("HIQA — National Standards", { x: 7.67, y: 1.82, w: 4.9, h: 0.4, fontFace: FONT, fontSize: 16, bold: true, color: TEAL, margin: 0 });
  s.addText("Thematic monitoring — obligations run to the Department & Tusla", { x: 7.2, y: 2.32, w: 5.35, h: 0.35, fontFace: FONT, fontSize: 11.5, italic: true, color: GRAY, margin: 0 });
  s.addText(
    [
      "40 standards across 10 themes",
      "Four-point scale: Compliant → Substantially → Partially → Not compliant",
      "IPAS centres are not designated centres — no statutory HIQA schedule",
      "Benchmarked against 69 published sector inspections",
    ].map((t, i, a) => ({ text: t, options: { bullet: { indent: 14 }, breakLine: i < a.length - 1, paraSpaceAfter: 9 } })),
    { x: 7.2, y: 2.8, w: 5.35, h: 2.6, fontFace: FONT, fontSize: 13.5, color: INK, valign: "top", margin: 0 },
  );
  // Callout card
  card(s, 0.55, 5.85, 12.25, 1.05, MINT_BG);
  s.addText("One entry, tagged for both regimes — the operator never keys the same fact twice, and every KPI computes from a register.", {
    x: 0.9, y: 5.85, w: 11.6, h: 1.05, fontFace: FONT, fontSize: 15, bold: true, color: NAVY, align: "center", valign: "middle", margin: 0,
  });
  pageNum(s, 2);
}

// 3 ── Three modules + six output views
{
  const s = p.addSlide();
  s.background = { color: WHITE };
  slideTitle(s, "What it delivers", "Three modules feeding six operator views — from the client descriptor");
  const mods = [
    ["1", "Department returns", "Centre master, seven admin registers, room-level register with automatic 4.65 m² occupancy, fire registers and the findings + 14-day evidence loop.", NAVY],
    ["2", "HIQA standards register", "Self-assessment per standard per centre, with sector benchmarking against 69 published HIQA inspections.", TEAL],
    ["3", "KPI framework", "13 domains, 74 KPIs — every KPI computes from a register; nothing is manually keyed.", GREEN],
  ];
  const cw = 3.95, gap = 0.2;
  mods.forEach((m, i) => {
    const x = 0.55 + i * (cw + gap);
    card(s, x, 1.55, cw, 3.05);
    s.addShape(p.ShapeType.ellipse, { x: x + 0.3, y: 1.85, w: 0.5, h: 0.5, fill: { color: m[3] } });
    s.addText(m[0], { x: x + 0.3, y: 1.85, w: 0.5, h: 0.5, fontFace: FONT, fontSize: 20, bold: true, color: WHITE, align: "center", valign: "middle", margin: 0 });
    s.addText(m[1], { x: x + 0.3, y: 2.5, w: cw - 0.6, h: 0.5, fontFace: FONT, fontSize: 16, bold: true, color: NAVY, margin: 0 });
    s.addText(m[2], { x: x + 0.3, y: 3.0, w: cw - 0.6, h: 1.5, fontFace: FONT, fontSize: 12.5, color: INK, valign: "top", margin: 0 });
  });
  s.addText("Six output views", { x: 0.55, y: 4.95, w: 12, h: 0.35, fontFace: FONT, fontSize: 14, bold: true, color: NAVY, margin: 0 });
  const views = ["Daily centre operations", "Compliance RAG", "Audit & assurance", "Quarterly board pack", "Department return generator", "Inspection-readiness pack"];
  const pw = 3.9, ph = 0.62, gx = 0.2, gy = 0.2;
  views.forEach((v, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = 0.55 + col * (pw + gx), y = 5.4 + row * (ph + gy);
    s.addShape(p.ShapeType.roundRect, { x, y, w: pw, h: ph, rectRadius: 0.3, fill: { color: LIGHT }, line: { color: BORDER, width: 1 } });
    s.addText(v, { x, y, w: pw, h: ph, fontFace: FONT, fontSize: 12.5, bold: true, color: NAVY, align: "center", valign: "middle", margin: 0 });
  });
  pageNum(s, 3);
}

// 4-11 ── Screenshot walkthrough
shotSlide({
  n: 4, title: "Group Overview", sub: "The whole portfolio at a glance — compliance RAG across all eight centres",
  img: "01-group-overview.png", header: "ON THIS SCREEN", accent: NAVY,
  points: [
    "Contracted capacity, occupancy, open findings and overdue evidence — all live",
    "Occupancy is derived from each centre's room register, so the numbers always reconcile",
    "Per-centre RAG escalates on overdue evidence, and surfaces ungraded findings honestly",
  ],
});
shotSlide({
  n: 5, title: "Centre Operations — the room register", sub: "Riverside, seeded from the real 24.03.2026 inspection report",
  img: "02-centre-operations.png", header: "ON THIS SCREEN",
  points: [
    "Suitable occupancy derived automatically at 4.65 m² per person",
    "Occupancy sums the register — the report's four unrecorded rooms are stated, not hidden",
    "Each admin register is tagged to its IPPS section and HIQA standard — one entry, both regimes",
  ],
});
shotSlide({
  n: 6, title: "Operator data entry — registers in, everything derives", sub: "The demo shows data being populated, not just a pre-filled dashboard",
  img: "09-room-entry.png", header: "ON THIS SCREEN", accent: GREEN,
  points: [
    "Enter length × width — suitable occupancy computes at 4.65 m² live in the dialog",
    "On save, the stat tiles, KPI-11-02 and the Department return all update",
    "Room, fire, notice and finding edits persist and ripple everywhere",
  ],
});
shotSlide({
  n: 7, title: "Findings & the 14-day evidence loop", sub: "The IPPS contractual exposure, tracked to close",
  img: "03-findings-tracker.png", header: "ON THIS SCREEN", accent: RED,
  points: [
    "RED / AMBER / GREEN findings with a live 14-day evidence clock",
    "One definition of 'overdue' across every count, chip and KPI",
    "Real Riverside findings kept faithful — ungraded items stay ungraded",
  ],
});
shotSlide({
  n: 8, title: "Fire registers & mandatory notices", sub: "First-class fire-safety currency and the IPPS §2 public-notice checklist",
  img: "10-fire-notices.png", header: "ON THIS SCREEN", accent: RED,
  points: [
    "Six fire registers with a required check frequency → in-date / due-soon / overdue",
    "Currency drives live KPI-08-01 and the Department return",
    "Mackin EHS delivers the 2026 fire-risk and safety-audit programme",
  ],
});
shotSlide({
  n: 9, title: "HIQA Standards — the group position", sub: "Opens on all eight centres: Peppard's own spread beside the published sector",
  img: "04-standards-register.png", header: "ON THIS SCREEN", accent: TEAL,
  points: [
    "320 self-assessments rolled up across the portfolio (40 standards × 8 centres)",
    "Each standard shows Peppard's 8-centre spread next to the 69-inspection sector bar",
    "Clearly labelled: Peppard has not yet been HIQA-inspected — these are self-assessments",
  ],
});
shotSlide({
  n: 10, title: "Drill in — and filter by facility", sub: "Every roll-up narrows to a single centre in one click",
  img: "11-standards-group-filter.png", header: "ON THIS SCREEN", accent: TEAL,
  points: [
    "Any stat card opens the records behind the figure",
    "A facility filter narrows the list to one centre — offered only where it helps",
    "The same filter is on the Findings and Group Overview roll-ups",
  ],
});
shotSlide({
  n: 11, title: "KPI framework — 13 domains, 74 KPIs", sub: "Config-as-data: the 74 KPIs are configuration, not code",
  img: "05-kpi-framework.png", header: "ON THIS SCREEN", accent: GREEN,
  points: [
    "Seven KPIs compute LIVE from the registers already in the system",
    "Occupancy, space standard, findings-closed-on-time, open REDs, mould, prohibited items, fire currency",
    "The rest show indicative values until their registers come online in Phase 2",
  ],
});

// 12 ── One-click documents
{
  const s = p.addSlide();
  s.background = { color: WHITE };
  slideTitle(s, "One-click generated documents", "Assembled from the live registers — nothing is transcribed. Print → PDF.");
  const docs = [
    ["08-dept-return.png", "Department return", "IPPS inspection format, with §3 status derived from the live registers"],
    ["06-readiness-pack.png", "Inspection-readiness pack", "Everything an inspector asks for, pre-assembled per centre"],
    ["07-board-pack.png", "Quarterly board pack", "Group governance position with thematic risks"],
  ];
  const cw = 3.95, gap = 0.2;
  docs.forEach((d, i) => {
    const x = 0.55 + i * (cw + gap);
    const h = screenshot(s, `${S}/${d[0]}`, x, 1.6, cw);
    s.addText(d[1], { x, y: 1.6 + h + 0.12, w: cw, h: 0.35, fontFace: FONT, fontSize: 15, bold: true, color: NAVY, align: "center", margin: 0 });
    s.addText(d[2], { x, y: 1.6 + h + 0.5, w: cw, h: 0.7, fontFace: FONT, fontSize: 11.5, color: GRAY, align: "center", valign: "top", margin: 0 });
  });
  pageNum(s, 12);
}

// 13 ── Rigour
{
  const s = p.addSlide();
  s.background = { color: WHITE };
  slideTitle(s, "Built to withstand scrutiny", "The Department may hold the real report — so the app agrees with it");
  const stats = [
    ["24.03.2026", "Riverside seeded from the real inspection", NAVY],
    ["40 / 40", "standards mapped & tags re-verified", TEAL],
    ["0", "fabricated regulatory outcomes", GREEN],
    ["4.65 m²", "space standard, exact at every multiple", RED],
  ];
  const cw = 2.98, gap = 0.15;
  stats.forEach((st, i) => {
    const x = 0.55 + i * (cw + gap);
    card(s, x, 1.55, cw, 1.75);
    s.addText(st[0], { x: x + 0.1, y: 1.7, w: cw - 0.2, h: 0.75, fontFace: FONT, fontSize: 30, bold: true, color: st[2], align: "center", margin: 0 });
    s.addText(st[1], { x: x + 0.15, y: 2.5, w: cw - 0.3, h: 0.7, fontFace: FONT, fontSize: 12, color: INK, align: "center", valign: "top", margin: 0 });
  });
  s.addText(
    [
      "Riverside's 'not available' registers are seeded from the report — they are the live data-entry story, not hidden.",
      "Every dual-axis tag was re-checked against the standard texts (security → 4.8, transport → 7.2, space & maintenance → 4.2).",
      "One coherent overdue definition; ungraded findings can't hide; KPIs match their published definitions.",
      "Hardened for a live/borrowed machine — error recovery on every route, storage-safe writes, offline-safe fonts.",
    ].map((t, i, a) => ({ text: t, options: { bullet: { indent: 14 }, breakLine: i < a.length - 1, paraSpaceAfter: 10 } })),
    { x: 0.7, y: 3.75, w: 12.1, h: 3.2, fontFace: FONT, fontSize: 14.5, color: INK, valign: "top", margin: 0 },
  );
  pageNum(s, 13);
}

// 14 ── Roadmap
{
  const s = p.addSlide();
  s.background = { color: WHITE };
  slideTitle(s, "Where this goes", "A working demo today; a phased build behind it");
  const phases = [
    ["Phase 0 — now", "LIVE", "Four demo screens + all three generated documents, deployed and shareable.", GREEN, MINT_BG],
    ["Phase 1", "", "Centre master, room register, fire registers and the findings loop as live contractual exposure.", NAVY, CARD],
    ["Phase 2", "", "Wire the remaining KPIs to real registers; full standards benchmarking.", TEAL, CARD],
    ["Phase 3", "", "Generated outputs — board pack, readiness pack and the Department-return generator.", NAVY, CARD],
  ];
  const cw = 2.98, gap = 0.15;
  phases.forEach((ph, i) => {
    const x = 0.55 + i * (cw + gap);
    card(s, x, 1.6, cw, 3.7, ph[4]);
    s.addText(ph[0], { x: x + 0.25, y: 1.85, w: cw - 0.5, h: 0.4, fontFace: FONT, fontSize: 15, bold: true, color: NAVY, margin: 0 });
    if (ph[1]) {
      s.addShape(p.ShapeType.roundRect, { x: x + 0.25, y: 2.3, w: 1.0, h: 0.42, rectRadius: 0.21, fill: { color: ph[3] } });
      s.addText(ph[1], { x: x + 0.25, y: 2.3, w: 1.0, h: 0.42, fontFace: FONT, fontSize: 11, bold: true, color: WHITE, align: "center", valign: "middle", margin: 0 });
    }
    s.addText(ph[2], { x: x + 0.25, y: ph[1] ? 2.95 : 2.35, w: cw - 0.5, h: 2.2, fontFace: FONT, fontSize: 12.5, color: INK, valign: "top", margin: 0 });
  });
  s.addText("Backend & auth (AWS/Cognito vs Supabase) remain an open commercial question — deliberately not pre-empted in code.", {
    x: 0.55, y: 5.6, w: 12.25, h: 0.5, fontFace: FONT, fontSize: 12.5, italic: true, color: GRAY, margin: 0,
  });
  pageNum(s, 14);
}

// 15 ── Closing
{
  const s = p.addSlide();
  s.background = { color: NAVY };
  s.addImage({ path: "public/origin-logo-white.png", x: 0.7, y: 0.6, w: 2.3, h: 0.72, sizing: { type: "contain", w: 2.3, h: 0.72 } });
  s.addText("Live now", { x: 0.7, y: 2.6, w: 12, h: 1.0, fontFace: FONT, fontSize: 48, bold: true, color: WHITE, margin: 0 });
  s.addText("peppard-ipas.netlify.app", { x: 0.72, y: 3.7, w: 12, h: 0.7, fontFace: FONT, fontSize: 26, color: "9FCFA8", margin: 0 });
  s.addText(
    [
      { text: "A live demo built for the Department of Justice, Home Affairs and Migration meeting.", options: { breakLine: true, paraSpaceAfter: 4 } },
      { text: "Delivered by Origin under the Framework Services Agreement.", options: {} },
    ],
    { x: 0.72, y: 5.6, w: 12, h: 0.9, fontFace: FONT, fontSize: 14, color: "B8CDD6", margin: 0 },
  );
}

await p.writeFile({ fileName: OUT });
console.log("wrote", OUT);

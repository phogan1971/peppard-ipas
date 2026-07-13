import riversideJson from "../../docs/source-data/riverside-inspection.json";
import standardsJson from "../../docs/source-data/hiqa-standards.json";
import benchmarkJson from "../../docs/source-data/hiqa-benchmark.json";
import { getProfile } from "./profile";
import {
  BenchmarkInspection,
  Centre,
  FireRegister,
  Finding,
  FindingPriority,
  HiqaStandard,
  Judgement,
  NoticeItem,
  RegisterEntry,
  Room,
  SectorDistribution,
  StandardAssessment,
  suitableOccupancyFor,
} from "./types";

// ── Raw JSON shapes (only the fields we consume) ────────────────────────
interface RiversideJson {
  inspectionDate: string;
  centre: {
    name: string;
    accommodationId: string;
    managerOnDuty: string;
    providerContractCapacity: number;
    occupancyOnDay: number;
    roomCount: number;
    centreProfile: string;
  };
  registers: { name: string; status?: string; observations?: string | null; cssDeclarationIncluded?: boolean }[];
  rooms: Room[];
  findings: {
    ref: number;
    section: string;
    finding: string;
    priority: string | null;
    actionRequired: string;
    evidenceDueDays: number | null;
  }[];
  areasInspectedChecklist: string[];
  sections: { title: string }[];
  ragLegend: Record<string, string>;
}

interface StandardsJson {
  themes: { number: number; name: string; standards: { id: string; text: string }[] }[];
}

interface BenchmarkJson {
  inspections: { centre: string; judgements: Record<string, string> }[];
}

const riverside = riversideJson as unknown as RiversideJson;
const standardsSrc = standardsJson as unknown as StandardsJson;
const benchmarkSrc = benchmarkJson as unknown as BenchmarkJson;

// ── Deterministic PRNG so demo data is stable across reloads ────────────
function mulberry(seedStr: string): () => number {
  let h = 1779033703;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

function pick<T>(rand: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

function isoDaysFromToday(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  // Local components (not toISOString/UTC) so seeded dates line up with the
  // store's local-date evidence-clock maths in a positive-offset timezone.
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

// ── The 8 Peppard centres (client email, 11 Jul 2026) ───────────────────
interface CentreSpec {
  id: string;
  name: string;
  shortName: string;
  location: string;
  county: string;
  capacity: number;
  profile: string;
  manager: string;
}

const CENTRE_SPECS: CentreSpec[] = [
  { id: "riverside", name: "Riverside Accommodation Centre", shortName: "Riverside", location: "Macroom", county: "Cork", capacity: 198, profile: "Families and Single Females", manager: "Peter O'Brien" },
  { id: "blackrock", name: "Blackrock Accommodation Centre", shortName: "Blackrock", location: "Blackrock", county: "Dublin", capacity: 120, profile: "Families", manager: "Sarah Kavanagh" },
  { id: "st-johns", name: "Saint Johns House Accommodation Centre", shortName: "St Johns House", location: "Tallaght", county: "Dublin", capacity: 160, profile: "Families and Single Females", manager: "Mark Whelan" },
  { id: "ballaghaderreen", name: "Ballaghaderreen Accommodation Centre", shortName: "Ballaghaderreen", location: "Ballaghaderreen", county: "Roscommon", capacity: 220, profile: "Families", manager: "Aoife Duignan" },
  { id: "carraroe", name: "Carraroe Accommodation Centre", shortName: "Carraroe", location: "An Cheathrú Rua", county: "Galway", capacity: 90, profile: "Single Males", manager: "Cormac Ó Flaithearta" },
  { id: "riverhouse", name: "Riverhouse Accommodation Centre", shortName: "Riverhouse", location: "Castleconnell", county: "Limerick", capacity: 110, profile: "Families", manager: "Denise Ryan" },
  { id: "old-hse", name: "OLD HSE Accommodation Centre", shortName: "OLD HSE Buncrana", location: "Buncrana", county: "Donegal", capacity: 75, profile: "Single Males", manager: "James Doherty" },
  { id: "mulroy", name: "Mulroy Accommodation Centre", shortName: "Mulroy", location: "Milford", county: "Donegal", capacity: 85, profile: "Families and Single Females", manager: "Claire Gallagher" },
];

// ── Department return reference structures (from the IPPS report) ───────
export const AREAS_INSPECTED_CHECKLIST: string[] = riverside.areasInspectedChecklist;
export const INSPECTION_SECTIONS: string[] = riverside.sections.map((s) => s.title);
export const RAG_LEGEND: Record<string, string> = riverside.ragLegend;


// ── Standards (real, from national-standards.pdf) ───────────────────────
export const STANDARDS: HiqaStandard[] = standardsSrc.themes.flatMap((t) =>
  t.standards.map((s) => ({
    id: s.id,
    themeNumber: t.number,
    themeName: t.name,
    text: s.text,
  })),
);

// ── Sector benchmark (real, recomputed from raw judgement matrix — the
//    workbook's own COUNTIF distribution misses trailing-space variants) ─
export const BENCHMARK_INSPECTIONS: BenchmarkInspection[] = benchmarkSrc.inspections.map((i) => ({
  centre: i.centre,
  judgements: i.judgements as Record<string, Judgement>,
}));

export function sectorDistributionFor(standardId: string): SectorDistribution {
  const dist: SectorDistribution = {
    standardId,
    compliant: 0,
    substantiallyCompliant: 0,
    partiallyCompliant: 0,
    notCompliant: 0,
    totalAssessed: 0,
  };
  for (const insp of BENCHMARK_INSPECTIONS) {
    const j = insp.judgements[standardId];
    if (j && j !== "notAssessed") {
      dist[j] += 1;
      dist.totalAssessed += 1;
    }
  }
  return dist;
}

// ── Centres ─────────────────────────────────────────────────────────────
export function buildCentres(): Centre[] {
  return CENTRE_SPECS.map((spec) => {
    const real = spec.id === "riverside";
    const rand = mulberry(`centre-${spec.id}`);
    return {
      id: spec.id,
      name: spec.name,
      shortName: spec.shortName,
      location: spec.location,
      county: spec.county,
      contractCapacity: real ? riverside.centre.providerContractCapacity : spec.capacity,
      // Placeholders — the store derives occupancy and roomCount from the
      // (override-merged) room register so the two can never disagree.
      occupancy: 0,
      roomCount: 0,
      profile: spec.profile,
      manager: spec.manager,
      accommodationId: real ? riverside.centre.accommodationId : `IPPS-A-00${190 + CENTRE_SPECS.indexOf(spec)}`,
      lastIppsInspection: real ? riverside.inspectionDate : isoDaysFromToday(-Math.round(30 + rand() * 200)),
      isDemoData: !real,
    };
  });
}

// ── Rooms ───────────────────────────────────────────────────────────────
const DEMO_BED_CONFIGS = ["2S", "3S", "1D", "1D,1S", "2S/1B", "1D,1B", "4S", "3S/1D"] as const;
const DEMO_ROOM_ISSUES = [
  "Fridge in room",
  "Kettle in room",
  "Mould spotting in bathroom",
  "Window restrictor missing",
  "Damaged flooring",
  "Extension lead in use",
] as const;

export function buildRooms(centreId: string): Room[] {
  if (centreId === "riverside") return riverside.rooms;
  const centre = CENTRE_SPECS.find((c) => c.id === centreId);
  if (!centre) return [];
  const rand = mulberry(`rooms-${centreId}`);
  const count = Math.round(centre.capacity / 3.6);
  const rooms: Room[] = [];
  const emptyIdx = new Set<number>();
  for (let i = 0; i < count; i++) {
    const floor = 1 + Math.floor(i / 20);
    const room = `${floor}${String((i % 20) + 1).padStart(2, "0")}`;
    const dimensions = Math.round((11 + rand() * 16) * 100) / 100;
    const suitable = suitableOccupancyFor(dimensions);
    if (rand() < 0.08) emptyIdx.add(i);
    const issues: string[] = [];
    const issueRate = 0.06 + 0.3 * (1 - getProfile().compliance / 100);
    if (rand() < issueRate) issues.push(pick(rand, DEMO_ROOM_ISSUES));
    rooms.push({
      room,
      bedConfig: pick(rand, DEMO_BED_CONFIGS),
      currentOccupancy: 0,
      dimensionsM2: dimensions,
      suitableOccupancy: suitable,
      issues,
    });
  }
  // The centre's headline occupancy is derived from this register, so the
  // per-room occupancies must sum to a commercially plausible level —
  // distribute a 78–96%-of-capacity target proportionally across the
  // non-empty rooms, never exceeding a room's suitable occupancy.
  const fillable = rooms.filter((_, i) => !emptyIdx.has(i));
  const suitableSum = fillable.reduce((s, r) => s + (r.suitableOccupancy ?? 0), 0);
  const target = Math.min(Math.round(centre.capacity * (0.78 + rand() * 0.18)), suitableSum);
  let allocated = 0;
  for (const r of fillable) {
    r.currentOccupancy = Math.floor(((r.suitableOccupancy ?? 0) * target) / suitableSum);
    allocated += r.currentOccupancy;
  }
  for (const r of fillable) {
    if (allocated >= target) break;
    if ((r.currentOccupancy ?? 0) < (r.suitableOccupancy ?? 0)) {
      r.currentOccupancy = (r.currentOccupancy ?? 0) + 1;
      allocated += 1;
    }
  }
  // A well-run group still has a few space-standard breaches — a demo centre
  // with zero over-occupied rooms next to Riverside's ten reads as fabricated.
  // Tip a compliance-scaled handful of rooms one over suitable, moving the bed
  // from a donor room so the centre's occupancy total is unchanged.
  const overCount = Math.min(3, Math.round((1 - getProfile().compliance / 100) * 4 * rand()));
  const atSuitable = fillable.filter((r) => (r.currentOccupancy ?? 0) === (r.suitableOccupancy ?? 0) && (r.suitableOccupancy ?? 0) > 0);
  for (let k = 0; k < overCount && k < atSuitable.length; k++) {
    const over = atSuitable[k];
    const donor = fillable.find((d) => d !== over && (d.currentOccupancy ?? 0) >= 2);
    if (!donor) break;
    over.currentOccupancy = (over.currentOccupancy ?? 0) + 1;
    donor.currentOccupancy = (donor.currentOccupancy ?? 0) - 1;
  }
  return rooms;
}

// ── Administration registers ────────────────────────────────────────────
// Dual regulatory axis: each register row maps to the IPPS report section it
// evidences and to a HIQA National Standard, so one entry serves both regimes.
// IPPS §s are the REAL report's own section numbers (1.1 Office Admin,
// 1.2 Child Protection, 1.3 General Safety & Security, 1.5 Resident
// Wellbeing, 1.6 Transport, 2.6 Kitchen Area) — the register appears in
// that section's checklist. HIQA ids verified against the standard texts:
// 4.8 security measures/licensing, 7.2 dedicated transport service,
// 4.9 non-food items (toiletries/nappies), 4.2 maintenance & repairs,
// 8.2 child protection incl. the DLP indicator, 5.1 kitchen facilities
// equipped and maintained, 1.2 governance records, 2.1 recruitment/roles.
const REGISTER_TAGS: Record<string, { ipps: string; hiqa: string }> = {
  "Latest Resident Register": { ipps: "1.1", hiqa: "1.2" },
  "Full List of Staff Employed including roles & duties": { ipps: "1.1", hiqa: "2.1" },
  "Separate list of designated liaison persons for child protection": { ipps: "1.1", hiqa: "8.2" },
  "Appendix 2 visitor child-protection declaration record": { ipps: "1.2", hiqa: "8.2" },
  "Visitor sign-in book": { ipps: "1.3", hiqa: "8.2" },
  "Maintenance issues log": { ipps: "1.1", hiqa: "4.2" },
  "Security roster": { ipps: "1.3", hiqa: "4.8" },
  "Kitchen daily cleaning record": { ipps: "2.6", hiqa: "5.1" },
  "Kitchen periodic deep-clean record": { ipps: "2.6", hiqa: "5.1" },
  // Transport and resident comfort — the two admin areas the IPPS report
  // covers but the earlier register set omitted.
  "Transport service & timetable": { ipps: "1.6", hiqa: "7.2" },
  "Resident comfort & wellbeing provision": { ipps: "1.5", hiqa: "4.9" },
};

// Extra admin registers added to every centre (not present in the raw
// Riverside register list, which folds these into inspection sections).
const EXTRA_REGISTER_NAMES = ["Transport service & timetable", "Resident comfort & wellbeing provision"];

// Riverside's register states come from the real 24.03.2026 report — three
// registers were recorded "not available" and the visitor book lacks its
// CSS declaration. They seed as needing attention so the demo can show the
// operator closing real gaps; "Review" clears them via the override layer.
const RIVERSIDE_REGISTER_GAPS: Record<string, string> = {
  "Security roster": "Not available at 24.03.2026 inspection — 24/7 PSA-licenced security staff not in place (Grennan Security)",
  "Kitchen daily cleaning record": "Not available at 24.03.2026 inspection — no record of daily cleaning of kitchen, food service & dining areas",
  "Kitchen periodic deep-clean record": "Not available at 24.03.2026 inspection — no record of periodic deep cleans (behind cookers/fridges etc.)",
  "Visitor sign-in book": "In place at reception but does not include a CSS declaration (24.03.2026 inspection)",
  "Transport service & timetable": "Timetable to be submitted within 14 days of receipt of the 24.03.2026 inspection report",
  "Resident comfort & wellbeing provision": "Baby lotions and hand soap not provided free of charge at 24.03.2026 inspection",
};

// Varied "needs attention" notes so every demo register doesn't read the
// same verbatim string across all seven centres.
const ATTENTION_NOTES = [
  "Gaps identified at last internal audit — update in progress",
  "Entries outstanding since the last senior-management review",
  "Being brought up to date following a staff changeover",
  "Partial record — remaining entries to be reconciled this week",
  "Flagged at self-inspection; corrective update scheduled",
] as const;

export function buildRegisters(centreId: string): RegisterEntry[] {
  const c = getProfile().compliance / 100;
  const rand = mulberry(`registers-${centreId}-${Math.round(c * 100)}`);
  const inOrder = 0.55 + 0.44 * c;
  const names = [
    ...riverside.registers.map((r) => r.name).filter((n) => !FIRE_REGISTER_NAMES.has(n)),
    ...EXTRA_REGISTER_NAMES,
  ];
  return names.map((name) => {
    const roll = rand();
    const tag = REGISTER_TAGS[name] ?? null;
    if (centreId === "riverside") {
      const gap = RIVERSIDE_REGISTER_GAPS[name];
      return {
        name,
        lastReviewed: gap ? riverside.inspectionDate : isoDaysFromToday(-Math.round(rand() * 21)),
        status: gap ? ("attention" as const) : ("in_order" as const),
        note: gap ?? null,
        ippsSection: tag?.ipps ?? null,
        hiqaStandard: tag?.hiqa ?? null,
      };
    }
    const status: RegisterEntry["status"] =
      roll < inOrder ? "in_order" : roll < inOrder + (1 - inOrder) * 0.75 ? "attention" : "not_reviewed";
    return {
      name,
      lastReviewed: isoDaysFromToday(-Math.round(rand() * 45)),
      status,
      note: status === "attention" ? pick(rand, ATTENTION_NOTES) : null,
      ippsSection: tag?.ipps ?? null,
      hiqaStandard: tag?.hiqa ?? null,
    };
  });
}

// ── Fire safety registers (first-class, with currency) ──────────────────
interface FireSpec {
  name: string;
  shortName: string;
  frequencyDays: number;
}
const FIRE_SPECS: FireSpec[] = [
  { name: "Emergency Lighting Service Records", shortName: "Emergency lighting", frequencyDays: 30 },
  { name: "Fire Alarm (Panel) / Carbon Monoxide & Detection System Service Records", shortName: "Fire alarm & detection", frequencyDays: 7 },
  { name: "Firefighting Equipment Service Records (Extinguishers/Hose Reels/Blankets)", shortName: "Firefighting equipment", frequencyDays: 30 },
  { name: "Fire Exit Doors/Means of Escape Inspections", shortName: "Fire exits & escape routes", frequencyDays: 7 },
  { name: "Fire Drill Schedule", shortName: "Fire drills", frequencyDays: 90 },
  { name: "Staff Fire Safety Instruction & Training", shortName: "Staff fire training", frequencyDays: 365 },
];
export const FIRE_REGISTER_NAMES = new Set(FIRE_SPECS.map((s) => s.name));

// ── Mandatory public notices (IPPS report §2 visual inspection) ─────────
export const MANDATORY_NOTICES: string[] = [
  "Designated Liaison Person (DLP) details",
  "Parental supervision notice",
  "HSE breastfeeding notice",
  "House rules",
  "IPAS house rules",
  "Complaint forms & procedure",
  "Incident reporting procedure",
  "IOM voluntary return information",
  "Anti-trafficking notice",
  "Violence and harassment notice",
  "Emergency numbers (Garda, hospital, fire, duty social work, out-of-hours GP)",
  "IPAS contact email address",
];

// The real report's §2.2 result: everything displayed except the two sets
// of house rules. Riverside seeds exactly that — the operator can close the
// two gaps live via "Verify".
const RIVERSIDE_NOTICES_MISSING = new Set(["House rules", "IPAS house rules"]);

export function buildNotices(centreId: string): NoticeItem[] {
  const c = getProfile().compliance / 100;
  const rand = mulberry(`notices-${centreId}-${Math.round(c * 100)}`);
  const compliantRate = 0.7 + 0.28 * c;
  return MANDATORY_NOTICES.map((name) => {
    const compliant =
      centreId === "riverside" ? !RIVERSIDE_NOTICES_MISSING.has(name) : rand() < compliantRate;
    return {
      name,
      compliant,
      verifiedOn: compliant ? isoDaysFromToday(-Math.round(rand() * 30)) : null,
      verifiedBy: null,
    };
  });
}

export function buildFireRegisters(centreId: string): FireRegister[] {
  const c = getProfile().compliance / 100;
  const rand = mulberry(`fire-${centreId}-${Math.round(c * 100)}`);
  return FIRE_SPECS.map((spec) => {
    // Anchor the last check to today, scaled by compliance: a well-run
    // centre sits comfortably inside its required interval, a pressured one
    // drifts towards (and sometimes past) the frequency threshold.
    const factor = 0.15 + (1 - c) * 0.85 + (rand() - 0.5) * 0.3;
    const offset = Math.max(0, Math.round(spec.frequencyDays * factor));
    return {
      name: spec.name,
      shortName: spec.shortName,
      frequencyDays: spec.frequencyDays,
      lastEntry: isoDaysFromToday(-offset),
    };
  });
}

// ── Findings ────────────────────────────────────────────────────────────
// Riverside findings are the real 24.03.2026 inspection content, but the
// lifecycle dates are DEMO dates anchored to today so the 14-day evidence
// clock reads live in a demonstration (see CLAUDE.md).
const DEMO_FINDING_POOL: { section: string; finding: string; priority: FindingPriority; actionRequired: string; hiqaStandard: string }[] = [
  { section: "6. Summary Details", finding: "Fire Safety Issues", priority: "RED", actionRequired: "Fire drill records incomplete for the previous quarter. Full drill to be carried out and register updated; confirmation within 14 days.", hiqaStandard: "3.1" },
  { section: "6. Summary Details", finding: "Electrical Equipment in Room", priority: "AMBER", actionRequired: "Prohibited electrical items found during spot checks. Management to inspect all rooms and remove; confirmation within 14 days.", hiqaStandard: "4.2" },
  { section: "6. Summary Details", finding: "Mould/Damp", priority: "AMBER", actionRequired: "Mould identified in bathroom areas. Deep clean and remediation required; photographic evidence within 14 days.", hiqaStandard: "4.2" },
  { section: "6. Summary Details", finding: "Food Safety Issues", priority: "AMBER", actionRequired: "Kitchen deep-clean record gaps. Deep clean to be completed and register brought up to date; confirmation within 14 days.", hiqaStandard: "5.1" },
  { section: "6. Summary Details", finding: "Overcrowding", priority: "GREEN", actionRequired: "Room occupancies verified against the 4.65 m² space standard. No action required.", hiqaStandard: "4.2" },
  { section: "6. Summary Details", finding: "Fixtures & Fittings", priority: "GREEN", actionRequired: "Minor wear noted in communal areas. Monitor at next internal audit.", hiqaStandard: "4.3" },
];

// HIQA standard a Riverside inspection finding maps to (dual-axis), keyed by
// the finding title from the real report.
// 4.2 carries the 4.65 m² space-standard and maintenance/repairs
// indicators (not 4.1, which is allocation planning); 4.8 is security.
const RIVERSIDE_FINDING_HIQA: Record<string, string> = {
  "Fire Safety Issues": "3.1",
  "Electrical Equipment in Room": "4.2",
  "Mould/Damp": "4.2",
  "Food Safety Issues": "5.1",
  "Overcrowding": "4.2",
  "Security & Staffing": "4.8",
  "Fixtures & Fittings": "4.3",
};

// Source PDF contains "N/A" and unchecked priority boxes — anything
// outside the RAG scale becomes null (rendered as UNMARKED).
function normalisePriority(raw: string | null): FindingPriority | null {
  const v = raw?.trim().toUpperCase();
  return v === "RED" || v === "AMBER" || v === "GREEN" ? v : null;
}

// A closed finding's close date: raised-to-now, biased inside its evidence
// window (a well-run loop closes on time) and never in the future. KPI-11-04
// compares this to the due date to judge on-time vs late closure.
function closedOnFor(raisedDaysAgo: number, evidenceDueDays: number | null, roll: number): string {
  const closeLag = Math.round((evidenceDueDays ?? 14) * (0.4 + roll * 0.5));
  return isoDaysFromToday(-Math.max(0, raisedDaysAgo - closeLag));
}

export function buildFindings(): Finding[] {
  const findings: Finding[] = [];
  const intensity = getProfile().findings / 100;

  // Riverside content is the real 24.03.2026 inspection; the lifecycle is
  // scenario-driven — low pressure reads as a well-managed evidence loop
  // (mostly closed, nothing overdue), high pressure as a backlog.
  let keepOneLive = true; // one worked example stays visibly in flight
  riverside.findings.forEach((f, idx) => {
    const rand = mulberry(`riverside-f${f.ref}-${Math.round(intensity * 100)}`);
    const raisedDaysAgo = intensity >= 0.7 ? 15 + (idx % 3) * 3 : 4 + (idx % 4) * 2;
    const raisedOn = isoDaysFromToday(-raisedDaysAgo);
    const dueOn = f.evidenceDueDays ? isoDaysFromToday(-raisedDaysAgo + f.evidenceDueDays) : null;
    const roll = rand();
    let status: Finding["status"] = "open";
    if (f.evidenceDueDays) {
      if (keepOneLive) {
        status = "evidence_submitted";
        keepOneLive = false;
      } else if (intensity < 0.4) status = roll < 0.65 ? "closed" : roll < 0.9 ? "evidence_submitted" : "open";
      else if (intensity < 0.7) status = roll < 0.35 ? "closed" : roll < 0.6 ? "evidence_submitted" : "open";
      else status = roll < 0.1 ? "closed" : roll < 0.25 ? "evidence_submitted" : "open";
    }
    findings.push({
      id: `riverside-f${f.ref}`,
      centreId: "riverside",
      source: "IPPS inspection",
      section: f.section,
      hiqaStandard: RIVERSIDE_FINDING_HIQA[f.finding] ?? null,
      finding: f.finding,
      priority: normalisePriority(f.priority),
      actionRequired: f.actionRequired,
      evidenceDueDays: f.evidenceDueDays,
      raisedOn,
      dueOn,
      status,
      closedOn: status === "closed" ? closedOnFor(raisedDaysAgo, f.evidenceDueDays, roll) : null,
      // Never assert a Department outcome the real report doesn't record —
      // the report's evidence-of-resolution boxes are unchecked throughout.
      evidenceNote:
        status === "closed"
          ? "Closed — evidence pack on file"
          : status === "evidence_submitted"
            ? "Evidence pack submitted — awaiting confirmation"
            : null,
    });
  });

  const redP = Math.max(0, (intensity - 0.4) * 0.6);
  const amberP = 0.25 + intensity * 0.4;
  for (const spec of CENTRE_SPECS) {
    if (spec.id === "riverside") continue;
    const rand = mulberry(`findings-${spec.id}-${Math.round(intensity * 100)}`);
    const count = Math.round(intensity * 4) + (rand() < 0.5 ? 0 : 1);
    for (let i = 0; i < count; i++) {
      const roll = rand();
      const pool =
        roll < redP
          ? DEMO_FINDING_POOL.filter((t) => t.priority === "RED")
          : roll < redP + amberP
            ? DEMO_FINDING_POOL.filter((t) => t.priority === "AMBER")
            : DEMO_FINDING_POOL.filter((t) => t.priority === "GREEN");
      const tpl = pick(rand, pool);
      const overdueAllowed = intensity >= 0.7;
      const raisedDaysAgo = overdueAllowed ? Math.round(rand() * 25) : 2 + Math.round(rand() * 9);
      const closed = rand() < 0.7 - intensity * 0.5;
      const isGreen = tpl.priority === "GREEN";
      // GREEN carries no evidence loop — it is noted and monitored, never
      // "evidence submitted"; internal-audit closures never claim a
      // Department acceptance.
      findings.push({
        id: `${spec.id}-f${i + 1}`,
        centreId: spec.id,
        source: "Internal audit",
        section: tpl.section,
        hiqaStandard: tpl.hiqaStandard,
        finding: tpl.finding,
        priority: tpl.priority,
        actionRequired: tpl.actionRequired,
        evidenceDueDays: isGreen ? null : 14,
        raisedOn: isoDaysFromToday(-raisedDaysAgo),
        dueOn: isGreen ? null : isoDaysFromToday(-raisedDaysAgo + 14),
        status: closed ? "closed" : !isGreen && rand() < 0.5 ? "evidence_submitted" : "open",
        closedOn: closed ? closedOnFor(raisedDaysAgo, isGreen ? null : 14, roll) : null,
        evidenceNote: closed
          ? isGreen
            ? "No action required — noted at internal review"
            : "Closed at internal review — evidence on file"
          : null,
      });
    }
  }

  return findings;
}

// ── HIQA self-assessments ───────────────────────────────────────────────
// Peppard has not yet been HIQA-inspected; these are internal
// self-assessment seeds, weighted realistic (mostly compliant).
export function buildAssessments(): StandardAssessment[] {
  const out: StandardAssessment[] = [];
  const c = getProfile().compliance / 100;
  // Scenario cut-points: at the default (broadly positive) profile most
  // standards sit compliant/substantial with a small improvement tail.
  const cutCompliant = 0.25 + 0.58 * c;
  const cutSubstantial = cutCompliant + 0.16;
  const cutPartial = cutSubstantial + 0.06 + 0.1 * (1 - c);
  for (const spec of CENTRE_SPECS) {
    const rand = mulberry(`assess-${spec.id}-${Math.round(c * 100)}`);
    for (const std of STANDARDS) {
      const roll = rand();
      const judgement: Judgement =
        roll < cutCompliant
          ? "compliant"
          : roll < cutSubstantial
            ? "substantiallyCompliant"
            : roll < cutPartial
              ? "partiallyCompliant"
              : "notCompliant";
      out.push({
        centreId: spec.id,
        standardId: std.id,
        judgement,
        note: null,
        assessedOn: isoDaysFromToday(-Math.round(rand() * 60)),
      });
    }
  }
  return out;
}

import riversideJson from "../../docs/source-data/riverside-inspection.json";
import standardsJson from "../../docs/source-data/hiqa-standards.json";
import benchmarkJson from "../../docs/source-data/hiqa-benchmark.json";
import {
  BenchmarkInspection,
  Centre,
  Finding,
  FindingPriority,
  HiqaStandard,
  Judgement,
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
  registers: { name: string }[];
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
  return d.toISOString().slice(0, 10);
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

export function sectionStatus(centreId: string, sectionTitle: string): "in_order" | "see_findings" {
  const rand = mulberry(`section-${centreId}-${sectionTitle}`);
  return rand() < 0.85 ? "in_order" : "see_findings";
}

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
    const occupancy = real
      ? riverside.centre.occupancyOnDay
      : Math.round(spec.capacity * (0.78 + rand() * 0.18));
    return {
      id: spec.id,
      name: spec.name,
      shortName: spec.shortName,
      location: spec.location,
      county: spec.county,
      contractCapacity: real ? riverside.centre.providerContractCapacity : spec.capacity,
      occupancy,
      roomCount: real ? riverside.rooms.length : Math.round(spec.capacity / 3.6),
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
  for (let i = 0; i < count; i++) {
    const floor = 1 + Math.floor(i / 20);
    const room = `${floor}${String((i % 20) + 1).padStart(2, "0")}`;
    const dimensions = Math.round((11 + rand() * 16) * 100) / 100;
    const suitable = suitableOccupancyFor(dimensions);
    const empty = rand() < 0.08;
    const occupancy = empty ? 0 : Math.max(1, Math.min(suitable, Math.round(rand() * (suitable + 1))));
    const issues: string[] = [];
    if (rand() < 0.22) issues.push(pick(rand, DEMO_ROOM_ISSUES));
    rooms.push({
      room,
      bedConfig: pick(rand, DEMO_BED_CONFIGS),
      currentOccupancy: occupancy,
      dimensionsM2: dimensions,
      suitableOccupancy: suitable,
      issues,
    });
  }
  return rooms;
}

// ── Administration registers ────────────────────────────────────────────
export function buildRegisters(centreId: string): RegisterEntry[] {
  const rand = mulberry(`registers-${centreId}`);
  return riverside.registers.map((r) => {
    const roll = rand();
    const status: RegisterEntry["status"] =
      centreId === "riverside" ? "in_order" : roll < 0.78 ? "in_order" : roll < 0.93 ? "attention" : "not_reviewed";
    return {
      name: r.name,
      lastReviewed: isoDaysFromToday(-Math.round(rand() * 45)),
      status,
      note: status === "attention" ? "Gaps identified at last internal audit — update in progress" : null,
    };
  });
}

// ── Findings ────────────────────────────────────────────────────────────
// Riverside findings are the real 24.03.2026 inspection content, but the
// lifecycle dates are DEMO dates anchored to today so the 14-day evidence
// clock reads live in a demonstration (see CLAUDE.md).
const DEMO_FINDING_POOL: { section: string; finding: string; priority: FindingPriority; actionRequired: string }[] = [
  { section: "6. Summary Details", finding: "Fire Safety Issues", priority: "RED", actionRequired: "Fire drill records incomplete for the previous quarter. Full drill to be carried out and register updated; confirmation within 14 days." },
  { section: "6. Summary Details", finding: "Electrical Equipment in Room", priority: "AMBER", actionRequired: "Prohibited electrical items found during spot checks. Management to inspect all rooms and remove; confirmation within 14 days." },
  { section: "6. Summary Details", finding: "Mould/Damp", priority: "AMBER", actionRequired: "Mould identified in bathroom areas. Deep clean and remediation required; photographic evidence within 14 days." },
  { section: "6. Summary Details", finding: "Food Safety Issues", priority: "AMBER", actionRequired: "Kitchen deep-clean record gaps. Deep clean to be completed and register brought up to date; confirmation within 14 days." },
  { section: "6. Summary Details", finding: "Overcrowding", priority: "GREEN", actionRequired: "Room occupancies verified against the 4.65 m² space standard. No action required." },
  { section: "6. Summary Details", finding: "Fixtures & Fittings", priority: "GREEN", actionRequired: "Minor wear noted in communal areas. Monitor at next internal audit." },
];

// Source PDF contains "N/A" and unchecked priority boxes — anything
// outside the RAG scale becomes null (rendered as UNMARKED).
function normalisePriority(raw: string | null): FindingPriority | null {
  const v = raw?.trim().toUpperCase();
  return v === "RED" || v === "AMBER" || v === "GREEN" ? v : null;
}

export function buildFindings(): Finding[] {
  const findings: Finding[] = [];

  riverside.findings.forEach((f, idx) => {
    const raisedDaysAgo = 6 + (idx % 3) * 4; // 6–14 days ago → live clocks
    const raisedOn = isoDaysFromToday(-raisedDaysAgo);
    const dueOn = f.evidenceDueDays ? isoDaysFromToday(-raisedDaysAgo + f.evidenceDueDays) : null;
    findings.push({
      id: `riverside-f${f.ref}`,
      centreId: "riverside",
      section: f.section,
      finding: f.finding,
      priority: normalisePriority(f.priority),
      actionRequired: f.actionRequired,
      evidenceDueDays: f.evidenceDueDays,
      raisedOn,
      dueOn,
      status: "open",
      evidenceNote: null,
    });
  });

  for (const spec of CENTRE_SPECS) {
    if (spec.id === "riverside") continue;
    const rand = mulberry(`findings-${spec.id}`);
    const count = 1 + Math.floor(rand() * 4);
    for (let i = 0; i < count; i++) {
      const tpl = pick(rand, DEMO_FINDING_POOL);
      const raisedDaysAgo = Math.round(rand() * 25);
      const closed = rand() < 0.45;
      findings.push({
        id: `${spec.id}-f${i + 1}`,
        centreId: spec.id,
        section: tpl.section,
        finding: tpl.finding,
        priority: tpl.priority,
        actionRequired: tpl.actionRequired,
        evidenceDueDays: tpl.priority === "GREEN" ? null : 14,
        raisedOn: isoDaysFromToday(-raisedDaysAgo),
        dueOn: tpl.priority === "GREEN" ? null : isoDaysFromToday(-raisedDaysAgo + 14),
        status: closed ? "closed" : rand() < 0.4 ? "evidence_submitted" : "open",
        evidenceNote: closed ? "Evidence pack submitted and accepted" : null,
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
  for (const spec of CENTRE_SPECS) {
    const rand = mulberry(`assess-${spec.id}`);
    for (const std of STANDARDS) {
      const roll = rand();
      const judgement: Judgement =
        roll < 0.5 ? "compliant" : roll < 0.78 ? "substantiallyCompliant" : roll < 0.94 ? "partiallyCompliant" : "notCompliant";
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

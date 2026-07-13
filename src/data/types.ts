export type FindingPriority = "RED" | "AMBER" | "GREEN";

export type FindingStatus = "open" | "evidence_submitted" | "closed";

export type Judgement =
  | "compliant"
  | "substantiallyCompliant"
  | "partiallyCompliant"
  | "notCompliant"
  | "notAssessed";

export const JUDGEMENT_LABELS: Record<Judgement, string> = {
  compliant: "Compliant",
  substantiallyCompliant: "Substantially compliant",
  partiallyCompliant: "Partially compliant",
  notCompliant: "Not compliant",
  notAssessed: "Not assessed",
};

export interface Centre {
  id: string;
  name: string;
  shortName: string;
  location: string;
  county: string;
  contractCapacity: number;
  occupancy: number;
  roomCount: number;
  profile: string;
  manager: string;
  accommodationId: string;
  lastIppsInspection: string | null;
  // Only Riverside carries real inspection data; everything else is
  // clearly-flagged demo data derived from the Riverside shape.
  isDemoData: boolean;
}

export interface Room {
  room: string;
  bedConfig: string | null;
  currentOccupancy: number | null;
  dimensionsM2: number | null;
  suitableOccupancy: number | null;
  // Stored so an edit reopens with the entered dimensions instead of
  // reconstructing them from the area (which silently changes the room).
  // Absent on inspection-report rows, which record area only.
  lengthM?: number;
  widthM?: number;
  issues: string[];
  enteredBy?: string;
  enteredAt?: string; // ISO datetime — set when entered through the dashboard
}

export interface RegisterEntry {
  name: string;
  lastReviewed: string;
  status: "in_order" | "attention" | "not_reviewed";
  note: string | null;
  // Dual regulatory axis — one register row evidences both regimes.
  ippsSection: string | null; // e.g. "1.2" (IPPS report section)
  hiqaStandard: string | null; // e.g. "8.1" (HIQA National Standard)
  // Set when a centre manager records a review through the dashboard, so
  // an operator-entered value is visibly distinct from seed data.
  enteredBy?: string;
  enteredAt?: string; // ISO datetime
}

// Fire safety registers are first-class: each carries its required check
// frequency and turns amber, then red, as currency lapses (descriptor §3.5).
export interface FireRegister {
  name: string;
  shortName: string;
  frequencyDays: number; // required interval between checks
  lastEntry: string | null; // ISO date of most recent check
  enteredBy?: string;
  enteredAt?: string;
}

// Mandatory public-notice checklist (IPPS report §2 visual inspection): each
// line carries a compliant state, the date it was verified and by whom.
export interface NoticeItem {
  name: string;
  compliant: boolean;
  verifiedOn: string | null;
  verifiedBy: string | null;
}

export type FireCurrencyState = "in_date" | "due_soon" | "overdue";

export interface FireCurrency {
  state: FireCurrencyState;
  daysSince: number | null;
  frequencyDays: number;
}

export function fireCurrencyFor(reg: FireRegister, today = new Date()): FireCurrency {
  if (!reg.lastEntry) return { state: "overdue", daysSince: null, frequencyDays: reg.frequencyDays };
  const last = new Date(reg.lastEntry + "T00:00:00");
  const t = new Date(today);
  t.setHours(0, 0, 0, 0);
  const daysSince = Math.round((t.getTime() - last.getTime()) / 86400000);
  const state: FireCurrencyState =
    daysSince > reg.frequencyDays ? "overdue" : daysSince > reg.frequencyDays * 0.8 ? "due_soon" : "in_date";
  return { state, daysSince, frequencyDays: reg.frequencyDays };
}

export type FindingSource = "IPPS inspection" | "HIQA monitoring" | "Internal audit" | "Self-inspection";

export const FINDING_SOURCES: FindingSource[] = [
  "IPPS inspection",
  "HIQA monitoring",
  "Internal audit",
  "Self-inspection",
];

export interface Finding {
  id: string;
  centreId: string;
  source?: FindingSource; // which inspection/regime raised it
  section: string; // IPPS report section reference
  hiqaStandard?: string | null; // dual-axis link to a HIQA National Standard
  finding: string;
  priority: FindingPriority | null;
  actionRequired: string;
  evidenceDueDays: number | null;
  raisedOn: string; // ISO date
  dueOn: string | null; // ISO date — raisedOn + evidenceDueDays
  status: FindingStatus;
  closedOn?: string | null; // ISO date the finding was closed — lets KPI-11-04 judge lateness
  evidenceNote: string | null;
}

export interface HiqaStandard {
  id: string; // "1.1" … "10.5"
  themeNumber: number;
  themeName: string;
  text: string;
}

export interface StandardAssessment {
  centreId: string;
  standardId: string;
  judgement: Judgement;
  note: string | null;
  assessedOn: string | null;
}

// One published HIQA inspection of a (non-Peppard) sector centre —
// the benchmark universe.
export interface BenchmarkInspection {
  centre: string;
  judgements: Record<string, Judgement>;
}

export interface SectorDistribution {
  standardId: string;
  compliant: number;
  substantiallyCompliant: number;
  partiallyCompliant: number;
  notCompliant: number;
  totalAssessed: number;
}

export const SPACE_STANDARD_M2_PER_PERSON = 4.65;

// The epsilon guards exact multiples of 4.65: in IEEE doubles
// 13.95 / 4.65 = 2.9999999999999996, which would floor to 2 when the
// regulatorily correct answer is exactly 3.
export function suitableOccupancyFor(dimensionsM2: number): number {
  return Math.floor(dimensionsM2 / SPACE_STANDARD_M2_PER_PERSON + 1e-9);
}

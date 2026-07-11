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
  issues: string[];
}

export interface RegisterEntry {
  name: string;
  lastReviewed: string;
  status: "in_order" | "attention" | "not_reviewed";
  note: string | null;
}

export interface Finding {
  id: string;
  centreId: string;
  section: string;
  finding: string;
  priority: FindingPriority | null;
  actionRequired: string;
  evidenceDueDays: number | null;
  raisedOn: string; // ISO date
  dueOn: string | null; // ISO date — raisedOn + evidenceDueDays
  status: FindingStatus;
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

export function suitableOccupancyFor(dimensionsM2: number): number {
  return Math.floor(dimensionsM2 / SPACE_STANDARD_M2_PER_PERSON);
}

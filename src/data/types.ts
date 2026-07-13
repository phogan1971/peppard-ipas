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

// A governance source attached to a centre — an internal audit the facility
// carried out, or an external inspection (Department/HIQA) — whose findings
// are summarised in the Findings & Actions table. The system is the internal
// governance record; inspections are inputs to it, not the other way round.
export interface SourceDocument {
  id: string;
  centreId: string;
  name: string;
  uploadedOn: string; // ISO date (audit/inspection date)
  uploadedBy: string;
  url?: string; // public path (sample) or data: URL (upload); absent for an internal audit
  kind: "internal" | "sample" | "uploaded";
  sizeKb?: number;
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
  // Governance triage (Compliance → Findings): the pathway a finding was
  // routed down, and the register entry it spawned (risk/QIP), if any.
  triagePathway?: TriagePathway | null;
  triageNote?: string | null;
  linkedRiskId?: string | null;
  linkedQipId?: string | null;
}

export type TriagePathway = "corrective_action" | "risk_register" | "qip_candidate" | "monitor";

export const TRIAGE_PATHWAY_LABELS: Record<TriagePathway, string> = {
  corrective_action: "Corrective action (CAPA)",
  risk_register: "Escalate to risk register",
  qip_candidate: "QIP candidate",
  monitor: "Monitor — no action",
};

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

// ── Risk register (5×5 likelihood × impact) ─────────────────────────────
export type RiskScale = 1 | 2 | 3 | 4 | 5;
export type RiskBand = "low" | "moderate" | "high" | "extreme";
export type RiskStatus = "open" | "monitoring" | "closed";

export interface Risk {
  id: string;
  centreId: string | null; // null = group-level risk
  title: string;
  category: string;
  likelihood: RiskScale;
  impact: RiskScale;
  controls: string;
  owner: string;
  openedOn: string; // ISO
  reviewOn: string | null; // ISO — next review date
  status: RiskStatus;
}

export const RISK_LIKELIHOOD_LABELS = ["", "Rare", "Unlikely", "Possible", "Likely", "Almost certain"];
export const RISK_IMPACT_LABELS = ["", "Negligible", "Minor", "Moderate", "Major", "Catastrophic"];

export function riskScore(likelihood: number, impact: number): number {
  return likelihood * impact;
}
export function riskBand(score: number): RiskBand {
  if (score >= 15) return "extreme";
  if (score >= 8) return "high";
  if (score >= 4) return "moderate";
  return "low";
}
export const RISK_BAND_LABELS: Record<RiskBand, string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
  extreme: "Extreme",
};

// ── QIP register (Quality Improvement Plans) ────────────────────────────
export type QipStatus = "active" | "under_review" | "closed";

export interface Qip {
  id: string;
  centreId: string | null;
  title: string;
  theme: string; // HIQA theme / domain the plan improves
  objective: string;
  owner: string;
  status: QipStatus;
  openedOn: string; // ISO
  targetOn: string | null; // ISO — target completion
  actionsTotal: number;
  actionsDone: number;
}

export function qipProgress(q: Qip): number {
  return q.actionsTotal === 0 ? 0 : Math.round((q.actionsDone / q.actionsTotal) * 100);
}

// ── Audit types & checklists (Compliance → Audit types / Checklists) ────
export interface ChecklistItem {
  id: string;
  text: string;
  critical: boolean; // a non-compliant critical item auto-raises a finding
}

export interface AuditType {
  id: string;
  name: string;
  description: string;
  category: string; // audit domain, e.g. "Fire safety", "Food & catering"
  sourceStandard: string; // dual-axis reference, e.g. "IPPS §2.3 · HIQA 3.1"
  targetPct: number; // target compliance %
  active: boolean;
  checklistVersion: number; // bumps on every checklist save
  checklist: ChecklistItem[];
}

// ── Audit scheduling (Compliance → Scheduling) ──────────────────────────
export type SchedulePriority = "high" | "medium" | "low";
export type ScheduleRecurrence = "one_off" | "monthly" | "quarterly";
export type ScheduleStatus = "scheduled" | "completed" | "cancelled";

export interface AuditSchedule {
  id: string;
  centreId: string;
  auditTypeId: string;
  dueOn: string; // ISO date
  assignedTo: string;
  priority: SchedulePriority;
  recurrence: ScheduleRecurrence;
  status: ScheduleStatus;
  notes: string | null;
}

export const RECURRENCE_LABELS: Record<ScheduleRecurrence, string> = {
  one_off: "One-off",
  monthly: "Monthly",
  quarterly: "Quarterly",
};

// ── Conducted audits (Compliance → Conduct / Results / Dashboard) ───────
export type AuditAnswer = "compliant" | "not_compliant" | "na";

export interface AuditResponse {
  itemId: string;
  text: string;
  critical: boolean;
  answer: AuditAnswer;
  note: string | null;
}

export interface AuditRecord {
  id: string;
  centreId: string;
  auditTypeId: string;
  auditName: string;
  conductedOn: string; // ISO date
  conductedBy: string;
  compliancePct: number;
  targetPct: number;
  // Item-level responses exist for audits conducted in-app; seeded history
  // rows carry a summary score only.
  responses: AuditResponse[];
  findingsRaised: number;
  scheduleId: string | null;
}

export function auditCompliancePct(responses: AuditResponse[]): number {
  const answered = responses.filter((r) => r.answer !== "na");
  if (answered.length === 0) return 100;
  return Math.round((answered.filter((r) => r.answer === "compliant").length / answered.length) * 100);
}

// ── Governance meetings (Compliance → Meetings) ─────────────────────────
export type MeetingType = "governance" | "management" | "safeguarding" | "fire_safety" | "resident_forum";

export const MEETING_TYPE_META: Record<MeetingType, { label: string; cadenceDays: number }> = {
  governance: { label: "Group governance", cadenceDays: 30 },
  management: { label: "Centre management", cadenceDays: 30 },
  safeguarding: { label: "Safeguarding review", cadenceDays: 90 },
  fire_safety: { label: "Fire safety review", cadenceDays: 90 },
  resident_forum: { label: "Resident forum", cadenceDays: 30 },
};

export interface Meeting {
  id: string;
  centreId: string | null; // null = group-level
  title: string;
  type: MeetingType;
  heldOn: string; // ISO date
  chair: string;
  attendees: number;
  quorum: boolean;
  minutesRef: string | null;
  actionsTotal: number;
  actionsDone: number;
  nextOn: string | null; // ISO date of the next scheduled meeting
}

// ── Policy register (Compliance → Policies) ─────────────────────────────
export interface Policy {
  id: string;
  name: string;
  category: string; // Safeguarding / Fire & safety / Operations / HR / Governance
  owner: string;
  version: string; // e.g. "v3.1"
  reviewCycleDays: number;
  lastReviewed: string; // ISO date
  nextReviewDue: string; // ISO date
  docRef: string | null;
}

export type PolicyStatus = "current" | "due_soon" | "overdue";

export function policyStatusFor(p: Policy, todayIso: string, dueSoonDays = 90): PolicyStatus {
  if (p.nextReviewDue < todayIso) return "overdue";
  const [y, m, d] = todayIso.split("-").map(Number);
  const warn = new Date(y, m - 1, d + dueSoonDays);
  const warnIso = `${warn.getFullYear()}-${String(warn.getMonth() + 1).padStart(2, "0")}-${String(warn.getDate()).padStart(2, "0")}`;
  return p.nextReviewDue <= warnIso ? "due_soon" : "current";
}

// ── Alerts (Compliance → Alerts / Settings) ─────────────────────────────
// Alerts are DERIVED live from the registers — never stored — so they can
// never disagree with the underlying data. Only read-state and rule
// enablement persist.
export type AlertSeverity = "critical" | "warning" | "info";

export interface ComplianceAlert {
  id: string; // deterministic: `${ruleKey}:${entityId}` so read-state persists
  ruleKey: string;
  severity: AlertSeverity;
  title: string;
  body: string;
  centreId: string | null;
  tab: string | null; // compliance tab a click opens
}

export interface AlertRule {
  key: string;
  label: string;
  description: string;
  severity: AlertSeverity;
  enabled: boolean;
}

export const SPACE_STANDARD_M2_PER_PERSON = 4.65;

// The epsilon guards exact multiples of 4.65: in IEEE doubles
// 13.95 / 4.65 = 2.9999999999999996, which would floor to 2 when the
// regulatorily correct answer is exactly 3.
export function suitableOccupancyFor(dimensionsM2: number): number {
  return Math.floor(dimensionsM2 / SPACE_STANDARD_M2_PER_PERSON + 1e-9);
}

import { useSyncExternalStore } from "react";
import {
  buildAssessments,
  buildCentres,
  buildFindings,
  buildFireRegisters,
  buildNotices,
  buildRegisters,
  buildRooms,
  buildSourceDocuments,
} from "./seed";
import { DataProfile, saveProfile } from "./profile";
import { safeRemove, safeSet } from "./safeStorage";
import {
  Centre,
  FireRegister,
  Finding,
  FindingPriority,
  FindingSource,
  FindingStatus,
  Judgement,
  NoticeItem,
  RegisterEntry,
  Room,
  SourceDocument,
  StandardAssessment,
  fireCurrencyFor,
  suitableOccupancyFor,
} from "./types";

// Genisis3 demo-mode pattern: no backend, seed once into localStorage,
// mutations persist there. Only user-mutable state is persisted —
// reference data (centres, rooms, registers) reseeds on every load so
// schema changes never strand stale copies.
// v2: adds anchorDate + room lengthM/widthM; older blobs reseed cleanly.
const STORAGE_KEY = "peppard-ipas:v2";
// Uploaded inspection reports live in their own key: a PDF base64 blob must
// not jeopardise the main state write if it pushes localStorage over quota.
const DOCS_KEY = "peppard-ipas:docs:v1";

function loadUploadedDocs(): Record<string, SourceDocument[]> {
  try {
    const raw = localStorage.getItem(DOCS_KEY);
    if (raw) return JSON.parse(raw) as Record<string, SourceDocument[]>;
  } catch {
    // ignore — start with none
  }
  return {};
}

// Operator-entered edits persist as override layers on top of the reseeded
// reference data, so a centre manager's entries survive reloads while schema
// changes to the seed never strand stale copies.
type RegisterOverride = Pick<RegisterEntry, "lastReviewed" | "status" | "note" | "enteredBy" | "enteredAt">;
type FireOverride = Pick<FireRegister, "lastEntry" | "enteredBy" | "enteredAt">;

interface PersistedState {
  // Local date the persisted findings/assessments were last anchored to.
  // Reference data re-anchors its dates to "today" on every load; without
  // this, persisted findings decay day by day until the whole dataset
  // reads overdue. On load, dates are shifted forward by the gap.
  anchorDate: string;
  findings: Finding[];
  assessments: StandardAssessment[];
  roomOverrides: Record<string, Room[]>; // centreId -> full edited room list
  registerOverrides: Record<string, RegisterOverride>; // `${centreId}::${name}`
  fireOverrides: Record<string, FireOverride>; // `${centreId}::${name}`
  noticeOverrides: Record<string, NoticeItem[]>; // centreId -> full notice list
}

// Local-component date helpers (no toISOString/UTC round-trip, so a date
// never drifts a day in a positive-offset timezone).
function localDateIso(d = new Date()): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function shiftIsoDate(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return localDateIso(new Date(y, m - 1, d + days));
}

function daysBetweenIso(fromIso: string, toIso: string): number {
  const [fy, fm, fd] = fromIso.split("-").map(Number);
  const [ty, tm, td] = toIso.split("-").map(Number);
  return Math.round((new Date(ty, tm - 1, td).getTime() - new Date(fy, fm - 1, fd).getTime()) / 86400000);
}

export interface AppState {
  centres: Centre[];
  roomsByCentre: Record<string, Room[]>;
  registersByCentre: Record<string, RegisterEntry[]>;
  fireByCentre: Record<string, FireRegister[]>;
  noticesByCentre: Record<string, NoticeItem[]>;
  documentsByCentre: Record<string, SourceDocument[]>;
  findings: Finding[];
  assessments: StandardAssessment[];
}

const emptyOverrides = () => ({ roomOverrides: {}, registerOverrides: {}, fireOverrides: {}, noticeOverrides: {} });

// Shift every scenario-anchored date forward so the dataset reads exactly
// as it did on the day it was persisted — evidence clocks, "raised N days
// ago" and assessment dates all stay relative to today.
function reanchor(parsed: PersistedState, today: string): PersistedState {
  const delta = daysBetweenIso(parsed.anchorDate, today);
  if (delta === 0) return parsed;
  return {
    ...parsed,
    anchorDate: today,
    findings: parsed.findings.map((f) => ({
      ...f,
      raisedOn: shiftIsoDate(f.raisedOn, delta),
      dueOn: f.dueOn ? shiftIsoDate(f.dueOn, delta) : null,
    })),
    assessments: parsed.assessments.map((a) => ({
      ...a,
      assessedOn: a.assessedOn ? shiftIsoDate(a.assessedOn, delta) : null,
    })),
  };
}

function loadPersisted(): PersistedState {
  const today = localDateIso();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedState;
      if (Array.isArray(parsed.findings) && Array.isArray(parsed.assessments) && typeof parsed.anchorDate === "string") {
        return reanchor(
          {
            anchorDate: parsed.anchorDate,
            findings: parsed.findings,
            assessments: parsed.assessments,
            roomOverrides: parsed.roomOverrides ?? {},
            registerOverrides: parsed.registerOverrides ?? {},
            fireOverrides: parsed.fireOverrides ?? {},
            noticeOverrides: parsed.noticeOverrides ?? {},
          },
          today,
        );
      }
    }
  } catch {
    // corrupt storage — fall through to reseed
  }
  return { anchorDate: today, findings: buildFindings(), assessments: buildAssessments(), ...emptyOverrides() };
}

let persisted: PersistedState = loadPersisted();
let uploadedDocs: Record<string, SourceDocument[]> = loadUploadedDocs();

function buildState(): AppState {
  const seeded = buildCentres();
  const roomsByCentre = Object.fromEntries(
    seeded.map((c) => [c.id, persisted.roomOverrides[c.id] ?? buildRooms(c.id)]),
  );
  // The room register is the single source of truth for occupancy and room
  // count — the centre headline is derived from it (post-override), so a
  // room edit ripples to every tile, roll-up and generated document.
  const centres = seeded.map((c) => {
    const rooms = roomsByCentre[c.id] ?? [];
    return {
      ...c,
      occupancy: rooms.reduce((s, r) => s + (r.currentOccupancy ?? 0), 0),
      roomCount: rooms.length,
    };
  });
  return {
    centres,
    roomsByCentre,
    registersByCentre: Object.fromEntries(
      centres.map((c) => [
        c.id,
        buildRegisters(c.id).map((r) => {
          const ov = persisted.registerOverrides[`${c.id}::${r.name}`];
          return ov ? { ...r, ...ov } : r;
        }),
      ]),
    ),
    fireByCentre: Object.fromEntries(
      centres.map((c) => [
        c.id,
        buildFireRegisters(c.id).map((r) => {
          const ov = persisted.fireOverrides[`${c.id}::${r.name}`];
          return ov ? { ...r, ...ov } : r;
        }),
      ]),
    ),
    noticesByCentre: Object.fromEntries(
      centres.map((c) => [c.id, persisted.noticeOverrides[c.id] ?? buildNotices(c.id)]),
    ),
    documentsByCentre: Object.fromEntries(
      centres.map((c) => [c.id, [...buildSourceDocuments(c.id), ...(uploadedDocs[c.id] ?? [])]]),
    ),
    findings: persisted.findings,
    assessments: persisted.assessments,
  };
}

let state: AppState = buildState();
const listeners = new Set<() => void>();

function persist() {
  safeSet(STORAGE_KEY, JSON.stringify(persisted));
}

// Recompute derived state from the persisted layer and notify subscribers.
function commit() {
  state = buildState();
  persist();
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, () => state);
}

// ── Mutations ───────────────────────────────────────────────────────────

function nowIso(): string {
  return new Date().toISOString();
}

export function setFindingStatus(findingId: string, status: FindingStatus, evidenceNote?: string) {
  const today = localDateIso();
  persisted.findings = persisted.findings.map((f) => {
    if (f.id !== findingId) return f;
    // Stamp the close date (so KPI-11-04 can tell on-time from late) and
    // clear it — plus any stale evidence note — when a finding reopens.
    const closedOn = status === "closed" ? today : null;
    const note = status === "open" ? null : evidenceNote ?? f.evidenceNote;
    return { ...f, status, closedOn, evidenceNote: note };
  });
  commit();
}

export function setAssessment(centreId: string, standardId: string, judgement: Judgement, note?: string) {
  persisted.assessments = persisted.assessments.map((a) =>
    a.centreId === centreId && a.standardId === standardId
      ? { ...a, judgement, note: note ?? a.note, assessedOn: localDateIso() }
      : a,
  );
  commit();
}

export interface RoomInput {
  room: string;
  bedConfig: string;
  currentOccupancy: number;
  lengthM: number;
  widthM: number;
  // False when the operator saved without touching length/width, so an
  // inspection-report room keeps its recorded area and suitable occupancy
  // (the dialog reconstructs dimensions from area, which is lossy).
  dimensionsEdited: boolean;
  issues: string[];
}

// Add or update a room. Suitable occupancy is derived here from the entered
// dimensions at the 4.65 m² space standard — the operator never keys it.
export function upsertRoom(centreId: string, input: RoomInput, enteredBy: string) {
  const current = state.roomsByCentre[centreId] ?? [];
  const idx = current.findIndex((r) => r.room === input.room.trim());
  const existing = idx >= 0 ? current[idx] : null;
  const keepRecorded = !input.dimensionsEdited && existing?.dimensionsM2 != null;
  const dimensionsM2 = keepRecorded
    ? (existing.dimensionsM2 as number)
    : Math.round(input.lengthM * input.widthM * 100) / 100;
  const next: Room = {
    room: input.room.trim(),
    bedConfig: input.bedConfig.trim() || null,
    currentOccupancy: input.currentOccupancy,
    dimensionsM2,
    suitableOccupancy: keepRecorded ? existing.suitableOccupancy : suitableOccupancyFor(dimensionsM2),
    ...(keepRecorded
      ? existing.lengthM != null && existing.widthM != null
        ? { lengthM: existing.lengthM, widthM: existing.widthM }
        : {}
      : { lengthM: input.lengthM, widthM: input.widthM }),
    issues: input.issues,
    enteredBy,
    enteredAt: nowIso(),
  };
  const updated = idx >= 0 ? current.map((r, i) => (i === idx ? next : r)) : [...current, next];
  persisted.roomOverrides = { ...persisted.roomOverrides, [centreId]: updated };
  commit();
}

export function markRegisterReviewed(centreId: string, name: string, enteredBy: string) {
  persisted.registerOverrides = {
    ...persisted.registerOverrides,
    [`${centreId}::${name}`]: {
      lastReviewed: localDateIso(),
      status: "in_order",
      note: null,
      enteredBy,
      enteredAt: nowIso(),
    },
  };
  commit();
}

export function setNoticeVerified(centreId: string, name: string, compliant: boolean, enteredBy: string) {
  const current = state.noticesByCentre[centreId] ?? [];
  const updated = current.map((n) =>
    n.name === name
      ? { ...n, compliant, verifiedOn: localDateIso(), verifiedBy: enteredBy }
      : n,
  );
  persisted.noticeOverrides = { ...persisted.noticeOverrides, [centreId]: updated };
  commit();
}

export function logFireCheck(centreId: string, name: string, enteredBy: string) {
  persisted.fireOverrides = {
    ...persisted.fireOverrides,
    [`${centreId}::${name}`]: {
      lastEntry: localDateIso(),
      enteredBy,
      enteredAt: nowIso(),
    },
  };
  commit();
}

export interface FindingInput {
  centreId: string;
  source: FindingSource;
  section: string;
  hiqaStandard: string | null;
  finding: string;
  // null = ungraded, matching the real report's unchecked RAG boxes —
  // editing an UNMARKED finding must not force a grade onto it.
  priority: FindingPriority | null;
  actionRequired: string;
  raisedOn: string; // ISO date
  evidenceDueDays: number | null;
}

// The 14-day clock and RAG rules applied in one place: GREEN carries no
// evidence deadline; everything else dues at raisedOn + evidenceDueDays.
// Date arithmetic stays in local components (no toISOString/UTC round-trip)
// so the deadline never drifts a day in a positive-offset timezone.
function computeDueOn(raisedOn: string, priority: FindingPriority | null, evidenceDueDays: number | null): string | null {
  if (priority === "GREEN" || evidenceDueDays === null) return null;
  const [y, m, d] = raisedOn.split("-").map(Number);
  const dt = new Date(y, m - 1, d + evidenceDueDays);
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${dt.getFullYear()}-${mm}-${dd}`;
}

export function addFinding(input: FindingInput) {
  const evidenceDueDays = input.priority === "GREEN" ? null : input.evidenceDueDays;
  const finding: Finding = {
    id: `${input.centreId}-manual-${Date.now()}`,
    centreId: input.centreId,
    source: input.source,
    section: input.section.trim() || "6. Summary Details",
    hiqaStandard: input.hiqaStandard,
    finding: input.finding.trim(),
    priority: input.priority,
    actionRequired: input.actionRequired.trim(),
    evidenceDueDays,
    raisedOn: input.raisedOn,
    dueOn: computeDueOn(input.raisedOn, input.priority, evidenceDueDays),
    status: "open",
    closedOn: null,
    evidenceNote: null,
  };
  // Append, not prepend: the Department return numbers findings by position,
  // so a new manual finding must not displace the report's real refs 1–7.
  persisted.findings = [...persisted.findings, finding];
  commit();
}

// Re-edit any finding (seeded or operator-created). Priority/date changes
// re-run the 14-day clock so the evidence deadline stays consistent.
export function updateFinding(id: string, input: FindingInput) {
  const evidenceDueDays = input.priority === "GREEN" ? null : input.evidenceDueDays;
  persisted.findings = persisted.findings.map((f) =>
    f.id === id
      ? {
          ...f,
          centreId: input.centreId,
          source: input.source,
          section: input.section.trim() || "6. Summary Details",
          hiqaStandard: input.hiqaStandard,
          finding: input.finding.trim(),
          priority: input.priority,
          actionRequired: input.actionRequired.trim(),
          evidenceDueDays,
          raisedOn: input.raisedOn,
          dueOn: computeDueOn(input.raisedOn, input.priority, evidenceDueDays),
        }
      : f,
  );
  commit();
}

// Attach an uploaded inspection report to a centre. The PDF is held as a
// data: URL so it opens without a backend; persisted in its own key.
export function addSourceDocument(
  centreId: string,
  doc: { name: string; dataUrl: string; sizeKb: number },
  uploadedBy: string,
) {
  const entry: SourceDocument = {
    id: `${centreId}-doc-${Date.now()}`,
    centreId,
    name: doc.name,
    uploadedOn: localDateIso(),
    uploadedBy,
    url: doc.dataUrl,
    kind: "uploaded",
    sizeKb: doc.sizeKb,
  };
  uploadedDocs = { ...uploadedDocs, [centreId]: [...(uploadedDocs[centreId] ?? []), entry] };
  safeSet(DOCS_KEY, JSON.stringify(uploadedDocs));
  commit();
}

// Regenerate the sample dataset, optionally under a new scenario profile.
export function regenerateData(profile?: DataProfile) {
  if (profile) saveProfile(profile);
  safeRemove(STORAGE_KEY);
  safeRemove(DOCS_KEY);
  persisted = {
    anchorDate: localDateIso(),
    findings: buildFindings(),
    assessments: buildAssessments(),
    ...emptyOverrides(),
  };
  uploadedDocs = {};
  state = buildState();
  listeners.forEach((l) => l());
}

// ── Selectors ───────────────────────────────────────────────────────────

export function daysUntilDue(finding: Finding): number | null {
  if (!finding.dueOn) return null;
  const due = new Date(finding.dueOn + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86400000);
}

// THE single definition of "overdue evidence", used by every count, chip and
// KPI: a finding whose 14-day clock has run out while it is still open —
// evidence_submitted means the operator has responded, so it is not overdue.
export function isOverdue(finding: Finding): boolean {
  if (finding.status !== "open") return false;
  const d = daysUntilDue(finding);
  return d !== null && d < 0;
}

export type EscalationLevel = "RED" | "AMBER" | "GREEN" | "UNMARKED" | "NONE";

export interface CentreCompliance {
  openRed: number;
  openAmber: number;
  openGreen: number;
  openUnmarked: number;
  overdue: number;
  // Worst open finding by inspector RAG grade (ignores the evidence clock).
  worst: EscalationLevel;
  // Headline escalation: overdue evidence is a contractual-loop breach, so it
  // lifts a centre to RED regardless of the underlying grade. Group Overview,
  // the board pack and the exec view all read this, so they never disagree.
  status: EscalationLevel;
}

const ESCALATION_LABELS: Record<EscalationLevel, string> = {
  RED: "RED items open",
  AMBER: "AMBER items open",
  GREEN: "GREEN items only",
  UNMARKED: "Ungraded items open",
  NONE: "No open findings",
};

// Shared headline for a centre's status chip — reason-accurate so an overdue
// AMBER centre reads "Evidence overdue", not "AMBER items open".
export function centreStatusLabel(cc: CentreCompliance): string {
  if (cc.overdue > 0 && cc.openRed === 0) return "Evidence overdue";
  return ESCALATION_LABELS[cc.status];
}

// §3 of the Department return: each inspection section's status is DERIVED
// from the live registers, notices and fire currency mapped to it — never
// generated. A section is in order exactly when nothing tagged to it needs
// attention.
export interface SectionState {
  status: "in_order" | "attention";
  notes: string[];
}

export function sectionStatusFor(sectionTitle: string, centreId: string, s: AppState): SectionState {
  const num = sectionTitle.match(/^\d+(?:\.\d+)?/)?.[0] ?? "";
  const notes: string[] = [];
  for (const r of s.registersByCentre[centreId] ?? []) {
    if (r.ippsSection === num && r.status !== "in_order") {
      notes.push(`${r.name}: ${r.status === "attention" ? "needs attention" : "not reviewed"}`);
    }
  }
  if (num === "2.2") {
    const missing = (s.noticesByCentre[centreId] ?? []).filter((n) => !n.compliant);
    if (missing.length > 0) notes.push(`${missing.length} mandatory notice${missing.length > 1 ? "s" : ""} not displayed`);
  }
  if (num === "2.3") {
    const overdue = (s.fireByCentre[centreId] ?? []).filter((r) => fireCurrencyFor(r).state === "overdue");
    if (overdue.length > 0) notes.push(`${overdue.length} fire register${overdue.length > 1 ? "s" : ""} overdue`);
  }
  return { status: notes.length > 0 ? "attention" : "in_order", notes };
}

export function centreCompliance(centreId: string, findings: Finding[]): CentreCompliance {
  const open = findings.filter((f) => f.centreId === centreId && f.status !== "closed");
  const openRed = open.filter((f) => f.priority === "RED").length;
  const openAmber = open.filter((f) => f.priority === "AMBER").length;
  const openGreen = open.filter((f) => f.priority === "GREEN").length;
  const openUnmarked = open.filter((f) => f.priority === null).length;
  const overdue = open.filter(isOverdue).length;
  const worst: EscalationLevel =
    openRed > 0 ? "RED" : openAmber > 0 ? "AMBER" : openGreen > 0 ? "GREEN" : openUnmarked > 0 ? "UNMARKED" : "NONE";
  const status: EscalationLevel = overdue > 0 ? "RED" : worst;
  return { openRed, openAmber, openGreen, openUnmarked, overdue, worst, status };
}

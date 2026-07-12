import { useSyncExternalStore } from "react";
import {
  buildAssessments,
  buildCentres,
  buildFindings,
  buildFireRegisters,
  buildNotices,
  buildRegisters,
  buildRooms,
} from "./seed";
import { DataProfile, saveProfile } from "./profile";
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
  StandardAssessment,
  suitableOccupancyFor,
} from "./types";

// Genisis3 demo-mode pattern: no backend, seed once into localStorage,
// mutations persist there. Only user-mutable state is persisted —
// reference data (centres, rooms, registers) reseeds on every load so
// schema changes never strand stale copies.
const STORAGE_KEY = "peppard-ipas:v1";

// Operator-entered edits persist as override layers on top of the reseeded
// reference data, so a centre manager's entries survive reloads while schema
// changes to the seed never strand stale copies.
type RegisterOverride = Pick<RegisterEntry, "lastReviewed" | "status" | "note" | "enteredBy" | "enteredAt">;
type FireOverride = Pick<FireRegister, "lastEntry" | "enteredBy" | "enteredAt">;

interface PersistedState {
  findings: Finding[];
  assessments: StandardAssessment[];
  roomOverrides: Record<string, Room[]>; // centreId -> full edited room list
  registerOverrides: Record<string, RegisterOverride>; // `${centreId}::${name}`
  fireOverrides: Record<string, FireOverride>; // `${centreId}::${name}`
  noticeOverrides: Record<string, NoticeItem[]>; // centreId -> full notice list
}

export interface AppState {
  centres: Centre[];
  roomsByCentre: Record<string, Room[]>;
  registersByCentre: Record<string, RegisterEntry[]>;
  fireByCentre: Record<string, FireRegister[]>;
  noticesByCentre: Record<string, NoticeItem[]>;
  findings: Finding[];
  assessments: StandardAssessment[];
}

const emptyOverrides = () => ({ roomOverrides: {}, registerOverrides: {}, fireOverrides: {}, noticeOverrides: {} });

function loadPersisted(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedState;
      if (Array.isArray(parsed.findings) && Array.isArray(parsed.assessments)) {
        return {
          findings: parsed.findings,
          assessments: parsed.assessments,
          roomOverrides: parsed.roomOverrides ?? {},
          registerOverrides: parsed.registerOverrides ?? {},
          fireOverrides: parsed.fireOverrides ?? {},
          noticeOverrides: parsed.noticeOverrides ?? {},
        };
      }
    }
  } catch {
    // corrupt storage — fall through to reseed
  }
  return { findings: buildFindings(), assessments: buildAssessments(), ...emptyOverrides() };
}

let persisted: PersistedState = loadPersisted();

function buildState(): AppState {
  const centres = buildCentres();
  return {
    centres,
    roomsByCentre: Object.fromEntries(
      centres.map((c) => [c.id, persisted.roomOverrides[c.id] ?? buildRooms(c.id)]),
    ),
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
    findings: persisted.findings,
    assessments: persisted.assessments,
  };
}

let state: AppState = buildState();
const listeners = new Set<() => void>();

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
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
  persisted.findings = persisted.findings.map((f) =>
    f.id === findingId ? { ...f, status, evidenceNote: evidenceNote ?? f.evidenceNote } : f,
  );
  commit();
}

export function setAssessment(centreId: string, standardId: string, judgement: Judgement, note?: string) {
  persisted.assessments = persisted.assessments.map((a) =>
    a.centreId === centreId && a.standardId === standardId
      ? { ...a, judgement, note: note ?? a.note, assessedOn: new Date().toISOString().slice(0, 10) }
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
  issues: string[];
}

// Add or update a room. Suitable occupancy is derived here from the entered
// dimensions at the 4.65 m² space standard — the operator never keys it.
export function upsertRoom(centreId: string, input: RoomInput, enteredBy: string) {
  const dimensionsM2 = Math.round(input.lengthM * input.widthM * 100) / 100;
  const next: Room = {
    room: input.room.trim(),
    bedConfig: input.bedConfig.trim() || null,
    currentOccupancy: input.currentOccupancy,
    dimensionsM2,
    suitableOccupancy: suitableOccupancyFor(dimensionsM2),
    issues: input.issues,
    enteredBy,
    enteredAt: nowIso(),
  };
  const current = state.roomsByCentre[centreId] ?? [];
  const idx = current.findIndex((r) => r.room === next.room);
  const updated = idx >= 0 ? current.map((r, i) => (i === idx ? next : r)) : [...current, next];
  persisted.roomOverrides = { ...persisted.roomOverrides, [centreId]: updated };
  commit();
}

export function markRegisterReviewed(centreId: string, name: string, enteredBy: string) {
  persisted.registerOverrides = {
    ...persisted.registerOverrides,
    [`${centreId}::${name}`]: {
      lastReviewed: new Date().toISOString().slice(0, 10),
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
      ? { ...n, compliant, verifiedOn: new Date().toISOString().slice(0, 10), verifiedBy: enteredBy }
      : n,
  );
  persisted.noticeOverrides = { ...persisted.noticeOverrides, [centreId]: updated };
  commit();
}

export function logFireCheck(centreId: string, name: string, enteredBy: string) {
  persisted.fireOverrides = {
    ...persisted.fireOverrides,
    [`${centreId}::${name}`]: {
      lastEntry: new Date().toISOString().slice(0, 10),
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
  priority: FindingPriority;
  actionRequired: string;
  raisedOn: string; // ISO date
  evidenceDueDays: number | null;
}

// The 14-day clock and RAG rules applied in one place: GREEN carries no
// evidence deadline; everything else dues at raisedOn + evidenceDueDays.
// Date arithmetic stays in local components (no toISOString/UTC round-trip)
// so the deadline never drifts a day in a positive-offset timezone.
function computeDueOn(raisedOn: string, priority: FindingPriority, evidenceDueDays: number | null): string | null {
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
    evidenceNote: null,
  };
  persisted.findings = [finding, ...persisted.findings];
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

// Regenerate the sample dataset, optionally under a new scenario profile.
export function regenerateData(profile?: DataProfile) {
  if (profile) saveProfile(profile);
  localStorage.removeItem(STORAGE_KEY);
  persisted = { findings: buildFindings(), assessments: buildAssessments(), ...emptyOverrides() } as PersistedState;
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

export interface CentreCompliance {
  openRed: number;
  openAmber: number;
  openGreen: number;
  openUnmarked: number;
  overdue: number;
  worst: "RED" | "AMBER" | "GREEN" | "NONE";
}

export function centreCompliance(centreId: string, findings: Finding[]): CentreCompliance {
  const open = findings.filter((f) => f.centreId === centreId && f.status !== "closed");
  const openRed = open.filter((f) => f.priority === "RED").length;
  const openAmber = open.filter((f) => f.priority === "AMBER").length;
  const openGreen = open.filter((f) => f.priority === "GREEN").length;
  const openUnmarked = open.filter((f) => f.priority === null).length;
  const overdue = open.filter((f) => {
    const d = daysUntilDue(f);
    return d !== null && d < 0 && f.status === "open";
  }).length;
  const worst = openRed > 0 ? "RED" : openAmber > 0 ? "AMBER" : openGreen > 0 ? "GREEN" : "NONE";
  return { openRed, openAmber, openGreen, openUnmarked, overdue, worst };
}

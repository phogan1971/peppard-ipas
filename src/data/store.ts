import { useSyncExternalStore } from "react";
import { buildAssessments, buildCentres, buildFindings, buildRegisters, buildRooms } from "./seed";
import { DataProfile, saveProfile } from "./profile";
import { Centre, Finding, FindingStatus, Judgement, RegisterEntry, Room, StandardAssessment } from "./types";

// Genisis3 demo-mode pattern: no backend, seed once into localStorage,
// mutations persist there. Only user-mutable state is persisted —
// reference data (centres, rooms, registers) reseeds on every load so
// schema changes never strand stale copies.
const STORAGE_KEY = "peppard-ipas:v1";

interface PersistedState {
  findings: Finding[];
  assessments: StandardAssessment[];
}

export interface AppState {
  centres: Centre[];
  roomsByCentre: Record<string, Room[]>;
  registersByCentre: Record<string, RegisterEntry[]>;
  findings: Finding[];
  assessments: StandardAssessment[];
}

function loadPersisted(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedState;
      if (Array.isArray(parsed.findings) && Array.isArray(parsed.assessments)) return parsed;
    }
  } catch {
    // corrupt storage — fall through to reseed
  }
  return { findings: buildFindings(), assessments: buildAssessments() };
}

function buildState(): AppState {
  const centres = buildCentres();
  const persisted = loadPersisted();
  return {
    centres,
    roomsByCentre: Object.fromEntries(centres.map((c) => [c.id, buildRooms(c.id)])),
    registersByCentre: Object.fromEntries(centres.map((c) => [c.id, buildRegisters(c.id)])),
    findings: persisted.findings,
    assessments: persisted.assessments,
  };
}

let state: AppState = buildState();
const listeners = new Set<() => void>();

function persist() {
  const toSave: PersistedState = { findings: state.findings, assessments: state.assessments };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
}

function emit() {
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

export function setFindingStatus(findingId: string, status: FindingStatus, evidenceNote?: string) {
  state = {
    ...state,
    findings: state.findings.map((f) =>
      f.id === findingId ? { ...f, status, evidenceNote: evidenceNote ?? f.evidenceNote } : f,
    ),
  };
  emit();
}

export function setAssessment(centreId: string, standardId: string, judgement: Judgement, note?: string) {
  state = {
    ...state,
    assessments: state.assessments.map((a) =>
      a.centreId === centreId && a.standardId === standardId
        ? { ...a, judgement, note: note ?? a.note, assessedOn: new Date().toISOString().slice(0, 10) }
        : a,
    ),
  };
  emit();
}

// Regenerate the sample dataset, optionally under a new scenario profile.
export function regenerateData(profile?: DataProfile) {
  if (profile) saveProfile(profile);
  localStorage.removeItem(STORAGE_KEY);
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

import kpiJson from "../../docs/source-data/kpi-framework.json";
import { AppState, isOverdue } from "./store";
import { getProfile } from "./profile";
import { fireCurrencyFor } from "./types";

// Prohibited-item keywords for KPI-07-06 — the electrical/food/knife items an
// inspection flags. Deliberately excludes structural/hygiene issues (mould,
// damp, floor, repair, wall, cockroach) and "Empty", which are not
// prohibited items and belong to other KPIs.
const PROHIBITED_ITEM_RE =
  /fridge|freezer|kettle|microwave|heater|\bfan\b|iron|cook|electric|knife|alcohol|extension|candle|incense|airfryer|toaster|plug|dehumidifier|food/i;
const MOULD_DAMP_RE = /mould|damp/i;

// KPI-08-01 names four checks explicitly (lighting, panel, equipment, exits);
// drills and staff training are excluded from the currency figure.
const CURRENCY_FIRE_REGISTERS = new Set([
  "Emergency lighting",
  "Fire alarm & detection",
  "Firefighting equipment",
  "Fire exits & escape routes",
]);

export interface KpiDef {
  id: string;
  name: string;
  definition: string;
  sourceRegister: string;
  target: string;
  frequency: string;
}

export interface KpiDomain {
  id: string;
  name: string;
  description: string;
  kpis: KpiDef[];
}

export const KPI_DOMAINS: KpiDomain[] = (kpiJson as unknown as { domains: KpiDomain[] }).domains;

export type KpiStatus = "meets" | "near" | "breach";

export interface KpiValue {
  display: string;
  status: KpiStatus;
  live: boolean; // computed from the demo registers vs illustrative value
}

// ── Live computations — KPIs whose assurance registers exist in the demo
//    dataset already. This is the descriptor's core rule made visible:
//    every KPI computes from a register, nothing manually keyed. ────────
function liveValue(kpiId: string, state: AppState): KpiValue | null {
  const allRooms = Object.values(state.roomsByCentre).flat();
  const open = state.findings.filter((f) => f.status !== "closed");

  switch (kpiId) {
    case "kpi-11-01": {
      const within = state.centres.filter((c) => c.occupancy <= c.contractCapacity).length;
      const pct = Math.round((within / state.centres.length) * 100);
      return { display: `${pct}% of centres`, status: pct === 100 ? "meets" : "breach", live: true };
    }
    case "kpi-11-02": {
      const assessable = allRooms.filter((r) => r.currentOccupancy !== null && r.suitableOccupancy !== null);
      const within = assessable.filter((r) => r.currentOccupancy! <= r.suitableOccupancy!).length;
      const pct = Math.round((within / assessable.length) * 100);
      return { display: `${pct}% of rooms`, status: pct === 100 ? "meets" : pct >= 95 ? "near" : "breach", live: true };
    }
    case "kpi-11-04": {
      // Definition: "% Department findings closed within 14 days with
      // evidence." Population is Department (IPPS inspection) findings whose
      // outcome is settled — closed, or past due and still open. In-window
      // findings aren't yet a pass or a fail, so they're excluded from both
      // sides; a finding counts on-time only if it was actually closed on or
      // before its due date (closedOn), so closing a late finding can't flip
      // the KPI to 100%.
      const dept = state.findings.filter((f) => f.source === "IPPS inspection" && f.dueOn !== null);
      const settled = dept.filter((f) => f.status === "closed" || isOverdue(f));
      if (settled.length === 0) return { display: "None due yet", status: "meets", live: true };
      const onTime = settled.filter((f) => f.status === "closed" && f.closedOn != null && f.closedOn <= f.dueOn!).length;
      const pct = Math.round((onTime / settled.length) * 100);
      return { display: `${pct}% on time`, status: pct === 100 ? "meets" : pct >= 90 ? "near" : "breach", live: true };
    }
    case "kpi-11-05": {
      const reds = open.filter((f) => f.priority === "RED").length;
      return { display: `${reds} open`, status: reds === 0 ? "meets" : "breach", live: true };
    }
    case "kpi-07-05": {
      // Sourced from the room register (per the framework): a "case" is a room
      // flagged with mould/damp. The overdue count comes from the linked
      // remediation findings, which carry the 14-day clock.
      const mouldRooms = allRooms.filter((r) => r.issues.some((i) => MOULD_DAMP_RE.test(i))).length;
      const overdueFindings = open.filter((f) => MOULD_DAMP_RE.test(f.finding) && isOverdue(f)).length;
      return {
        display: `${mouldRooms} room${mouldRooms === 1 ? "" : "s"} flagged · ${overdueFindings} >14d`,
        status: overdueFindings > 0 ? "breach" : mouldRooms === 0 ? "meets" : "near",
        live: true,
      };
    }
    case "kpi-07-06": {
      // Prohibited items only — "Empty", mould/damp and structural issues are
      // not prohibited items and must not inflate this figure.
      const flagged = allRooms.filter((r) => r.issues.some((i) => PROHIBITED_ITEM_RE.test(i))).length;
      const per100 = Math.round((flagged / allRooms.length) * 100);
      return { display: `${per100} per 100 rooms`, status: per100 <= 10 ? "meets" : per100 <= 25 ? "near" : "breach", live: true };
    }
    case "kpi-08-01": {
      const fire = Object.values(state.fireByCentre)
        .flat()
        .filter((r) => CURRENCY_FIRE_REGISTERS.has(r.shortName));
      if (fire.length === 0) return null;
      const inDate = fire.filter((r) => fireCurrencyFor(r).state === "in_date").length;
      const pct = Math.round((inDate / fire.length) * 100);
      return { display: `${pct}% in date`, status: pct === 100 ? "meets" : pct >= 90 ? "near" : "breach", live: true };
    }
    default:
      return null;
  }
}

// ── Illustrative values for the remaining KPIs, shaped by target type ──
function demoRand(seedStr: string): () => number {
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

function demoValue(kpi: KpiDef): KpiValue {
  const k = getProfile().kpi / 100;
  const rand = demoRand(`kpi-${kpi.id}-${Math.round(k * 100)}`);
  const roll = rand();
  const t = kpi.target;

  // Scenario band: how the KPI performs relative to target, driven by the
  // profile's KPI slider. "good" hits target, "near" is close, "bad" misses.
  const meetsCut = 0.3 + 0.62 * k;
  const band: KpiStatus = roll < meetsCut ? "meets" : roll < meetsCut + (1 - meetsCut) * 0.65 ? "near" : "breach";

  if (t.includes("%")) {
    const pct = band === "meets" ? 100 : band === "near" ? 90 + Math.round(rand() * 9) : 76 + Math.round(rand() * 12);
    return { display: `${pct}%`, status: band, live: false };
  }
  if (t.trim() === "0" || t.startsWith("0 ")) {
    const n = band === "meets" ? 0 : band === "near" ? 1 : 1 + Math.round(rand() * 2);
    return { display: `${n}`, status: n === 0 ? "meets" : "breach", live: false };
  }
  if (t.includes("hrs")) {
    const hrs = band === "meets" ? 24 + Math.round(rand() * 22) : band === "near" ? 49 + Math.round(rand() * 22) : 74 + Math.round(rand() * 20);
    return { display: `${hrs} hrs avg`, status: band, live: false };
  }
  if (t === "↓" || t.toLowerCase().includes("rising") || t.toLowerCase().includes("reduction")) {
    const n = Math.round(rand() * 14);
    const delta = 1 + Math.round(rand() * 3);
    const down = band !== "breach";
    return {
      display: `${n} (${down ? "↓" : "↑"}${delta} on last month)`,
      status: down ? "meets" : "near",
      live: false,
    };
  }
  return { display: band === "breach" ? "Outstanding" : "Completed", status: band === "breach" ? "near" : band, live: false };
}

export function kpiValue(kpi: KpiDef, state: AppState): KpiValue {
  return liveValue(kpi.id, state) ?? demoValue(kpi);
}

export function domainRollup(domain: KpiDomain, state: AppState): { meets: number; near: number; breach: number; worst: KpiStatus } {
  let meets = 0,
    near = 0,
    breach = 0;
  for (const kpi of domain.kpis) {
    const v = kpiValue(kpi, state);
    if (v.status === "meets") meets++;
    else if (v.status === "near") near++;
    else breach++;
  }
  return { meets, near, breach, worst: breach > 0 ? "breach" : near > 0 ? "near" : "meets" };
}

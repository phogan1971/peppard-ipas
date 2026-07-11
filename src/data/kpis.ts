import kpiJson from "../../docs/source-data/kpi-framework.json";
import { AppState, daysUntilDue } from "./store";

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
      const due = state.findings.filter((f) => f.dueOn !== null);
      if (due.length === 0) return { display: "No findings due", status: "meets", live: true };
      const onTime = due.filter((f) => f.status !== "open" || (daysUntilDue(f) ?? 0) >= 0).length;
      const pct = Math.round((onTime / due.length) * 100);
      return { display: `${pct}% on time`, status: pct === 100 ? "meets" : pct >= 90 ? "near" : "breach", live: true };
    }
    case "kpi-11-05": {
      const reds = open.filter((f) => f.priority === "RED").length;
      return { display: `${reds} open`, status: reds === 0 ? "meets" : "breach", live: true };
    }
    case "kpi-07-05": {
      const mould = open.filter((f) => /mould|damp/i.test(f.finding));
      const overdue = mould.filter((f) => (daysUntilDue(f) ?? 0) < 0).length;
      return {
        display: `${mould.length} open, ${overdue} >14 days`,
        status: overdue === 0 ? (mould.length === 0 ? "meets" : "near") : "breach",
        live: true,
      };
    }
    case "kpi-07-06": {
      const flagged = allRooms.filter((r) => r.issues.length > 0).length;
      const per100 = Math.round((flagged / allRooms.length) * 100);
      return { display: `${per100} per 100 rooms`, status: per100 <= 10 ? "meets" : per100 <= 25 ? "near" : "breach", live: true };
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
  const rand = demoRand(`kpi-${kpi.id}`);
  const roll = rand();
  const t = kpi.target;

  if (t.includes("%")) {
    const pct = roll < 0.62 ? 100 : roll < 0.88 ? 90 + Math.round(rand() * 9) : 78 + Math.round(rand() * 10);
    const status: KpiStatus = pct === 100 ? "meets" : pct >= 90 ? "near" : "breach";
    return { display: `${pct}%`, status, live: false };
  }
  if (t.trim() === "0" || t.startsWith("0 ")) {
    const n = roll < 0.75 ? 0 : 1 + Math.round(rand() * 2);
    return { display: `${n}`, status: n === 0 ? "meets" : "breach", live: false };
  }
  if (t.includes("hrs")) {
    const hrs = 24 + Math.round(rand() * 40);
    const status: KpiStatus = hrs < 48 ? "meets" : hrs <= 72 ? "near" : "breach";
    return { display: `${hrs} hrs avg`, status, live: false };
  }
  if (t === "↓" || t.toLowerCase().includes("rising") || t.toLowerCase().includes("reduction")) {
    const n = Math.round(rand() * 14);
    const delta = Math.round(rand() * 4);
    const down = roll < 0.7;
    return { display: `${n} (${down ? "↓" : "↑"}${delta} on last month)`, status: down ? "meets" : "near", live: false };
  }
  return { display: "Completed", status: roll < 0.85 ? "meets" : "near", live: false };
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

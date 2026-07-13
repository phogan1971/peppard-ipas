// Data scenario profile — drives how the generated sample dataset leans.
// Defaults are broadly positive: this system is shown to the Department
// and HIQA, so the resting state is "well-run group with a small,
// well-managed tail of issues".
export interface DataProfile {
  compliance: number; // 0-100 — standards judgements + register order
  findings: number; // 0-100 — volume/severity/overdue pressure of findings
  kpi: number; // 0-100 — share of KPIs on target
}

import { safeSet } from "./safeStorage";

export type PresetKey = "strong" | "mixed" | "pressure";

export const PROFILE_PRESETS: Record<PresetKey, { label: string; description: string; profile: DataProfile }> = {
  strong: {
    label: "Strong performance",
    description: "Green-dominant: high compliance, few findings, KPIs on target",
    profile: { compliance: 88, findings: 18, kpi: 90 },
  },
  mixed: {
    label: "Mixed performance",
    description: "Amber-leaning: solid core with visible improvement areas",
    profile: { compliance: 62, findings: 50, kpi: 68 },
  },
  pressure: {
    label: "Under pressure",
    description: "Red-leaning: material non-compliance and overdue actions",
    profile: { compliance: 35, findings: 85, kpi: 45 },
  },
};

export const DEFAULT_PROFILE: DataProfile = PROFILE_PRESETS.strong.profile;

const PROFILE_KEY = "peppard-ipas:profile:v1";

export function getProfile(): DataProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as DataProfile;
      if ([p.compliance, p.findings, p.kpi].every((n) => typeof n === "number" && n >= 0 && n <= 100)) {
        return p;
      }
    }
  } catch {
    // fall through to default
  }
  return DEFAULT_PROFILE;
}

export function saveProfile(profile: DataProfile) {
  safeSet(PROFILE_KEY, JSON.stringify(profile));
}

export function matchingPreset(profile: DataProfile): PresetKey | null {
  for (const [key, preset] of Object.entries(PROFILE_PRESETS)) {
    const p = preset.profile;
    if (p.compliance === profile.compliance && p.findings === profile.findings && p.kpi === profile.kpi) {
      return key as PresetKey;
    }
  }
  return null;
}

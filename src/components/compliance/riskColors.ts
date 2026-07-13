import { RiskBand, riskBand, riskScore } from "../../data/types";
import { rag, accent } from "../../theme/tokens";

// Foreground / tint per risk band, shared by the register table, heatmap,
// form dialog and cockpit so the 5×5 matrix reads consistently everywhere.
export const BAND_COLOR: Record<RiskBand, { fg: string; bg: string }> = {
  low: { fg: rag.green, bg: rag.greenBg },
  moderate: { fg: rag.amber, bg: rag.amberBg },
  high: { fg: accent.orange, bg: "#FBE7D6" },
  extreme: { fg: rag.red, bg: rag.redBg },
};

export function cellColor(likelihood: number, impact: number) {
  return BAND_COLOR[riskBand(riskScore(likelihood, impact))];
}

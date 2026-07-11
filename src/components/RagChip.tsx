import Chip from "@mui/material/Chip";
import { rag, compliance } from "../theme/tokens";

export type RagPriority = "RED" | "AMBER" | "GREEN";
export type ComplianceJudgement =
  | "Compliant"
  | "Substantially compliant"
  | "Partially compliant"
  | "Not compliant"
  | "Not assessed";

const RAG_STYLES: Record<RagPriority, { color: string; bg: string }> = {
  RED: { color: rag.red, bg: rag.redBg },
  AMBER: { color: rag.amber, bg: rag.amberBg },
  GREEN: { color: rag.green, bg: rag.greenBg },
};

const COMPLIANCE_STYLES: Record<ComplianceJudgement, { color: string; bg: string }> = {
  Compliant: { color: compliance.compliant, bg: compliance.compliantBg },
  "Substantially compliant": { color: compliance.substantially, bg: compliance.substantiallyBg },
  "Partially compliant": { color: compliance.partially, bg: compliance.partiallyBg },
  "Not compliant": { color: compliance.notCompliant, bg: compliance.notCompliantBg },
  "Not assessed": { color: compliance.notAssessed, bg: compliance.notAssessedBg },
};

// Status is always colour + text, never colour alone.
export function RagChip({ priority, size = "small" }: { priority: RagPriority; size?: "small" | "medium" }) {
  const s = RAG_STYLES[priority];
  return (
    <Chip
      label={priority}
      size={size}
      sx={{ color: s.color, backgroundColor: s.bg, fontWeight: 700, letterSpacing: 0.4 }}
    />
  );
}

export function ComplianceChip({
  judgement,
  size = "small",
}: {
  judgement: ComplianceJudgement;
  size?: "small" | "medium";
}) {
  const s = COMPLIANCE_STYLES[judgement];
  return <Chip label={judgement} size={size} sx={{ color: s.color, backgroundColor: s.bg }} />;
}

import Chip from "@mui/material/Chip";
import { rag, compliance } from "../theme/tokens";
import { FindingPriority, Judgement, JUDGEMENT_LABELS } from "../data/types";

const RAG_STYLES: Record<FindingPriority, { color: string; bg: string }> = {
  RED: { color: rag.red, bg: rag.redBg },
  AMBER: { color: rag.amber, bg: rag.amberBg },
  GREEN: { color: rag.green, bg: rag.greenBg },
};

const COMPLIANCE_STYLES: Record<Judgement, { color: string; bg: string }> = {
  compliant: { color: compliance.compliant, bg: compliance.compliantBg },
  substantiallyCompliant: { color: compliance.substantially, bg: compliance.substantiallyBg },
  partiallyCompliant: { color: compliance.partially, bg: compliance.partiallyBg },
  notCompliant: { color: compliance.notCompliant, bg: compliance.notCompliantBg },
  notAssessed: { color: compliance.notAssessed, bg: compliance.notAssessedBg },
};

// Status is always colour + text, never colour alone.
export function RagChip({ priority, size = "small" }: { priority: FindingPriority | null; size?: "small" | "medium" }) {
  const s = priority ? RAG_STYLES[priority] : undefined;
  if (!s) {
    return (
      <Chip label="UNMARKED" size={size} sx={{ color: rag.neutral, backgroundColor: rag.neutralBg, fontWeight: 700, letterSpacing: 0.4 }} />
    );
  }
  return (
    <Chip label={priority} size={size} sx={{ color: s.color, backgroundColor: s.bg, fontWeight: 700, letterSpacing: 0.4 }} />
  );
}

export function ComplianceChip({ judgement, size = "small" }: { judgement: Judgement; size?: "small" | "medium" }) {
  const s = COMPLIANCE_STYLES[judgement];
  return <Chip label={JUDGEMENT_LABELS[judgement]} size={size} sx={{ color: s.color, backgroundColor: s.bg }} />;
}

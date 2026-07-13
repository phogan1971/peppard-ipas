import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import DescriptionIcon from "@mui/icons-material/Description";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import ListAltIcon from "@mui/icons-material/ListAlt";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import CampaignIcon from "@mui/icons-material/Campaign";
import InsightsIcon from "@mui/icons-material/Insights";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { SvgIconComponent } from "@mui/icons-material";
import { SourceDocument } from "../data/types";
import { useAppState } from "../data/store";
import { accent, rag, brand } from "../theme/tokens";
import { useSurfaces } from "../theme";

interface Props {
  open: boolean;
  doc: SourceDocument | null;
  centreName: (id: string) => string;
  onClose: () => void;
  onApply: (doc: SourceDocument) => void;
}

// The KPI domains a Department inspection informs, and how many of their
// KPIs already compute live from the populated registers.
const KPI_TARGETS: { domain: string; live: number; total: number }[] = [
  { domain: "11 · Occupancy & inspection performance", live: 4, total: 5 },
  { domain: "7 · Accommodation & environment", live: 2, total: 7 },
  { domain: "8 · Fire & environmental safety", live: 1, total: 5 },
  { domain: "1 · Governance & oversight", live: 0, total: 5 },
  { domain: "4 · Resident experience & rights", live: 0, total: 5 },
  { domain: "9 · Food, catering & cooking", live: 0, total: 5 },
  { domain: "13 · Quality improvement & audit", live: 0, total: 5 },
];

function RecordCard({ icon: Icon, count, label }: { icon: SvgIconComponent; count: number; label: string }) {
  const surf = useSurfaces();
  return (
    <Box sx={{ flex: "1 1 120px", minWidth: 110, p: 1.25, borderRadius: 1.5, border: "1px solid", borderColor: surf.border, backgroundColor: surf.subtleBg, textAlign: "center" }}>
      <Icon sx={{ color: accent.navy, fontSize: 22 }} />
      <Typography sx={{ fontSize: "1.15rem", fontWeight: 800, color: "text.primary", lineHeight: 1.1 }}>{count}</Typography>
      <Typography sx={{ fontSize: "0.68rem", color: "text.secondary", lineHeight: 1.2 }}>{label}</Typography>
    </Box>
  );
}

function Arrow({ label }: { label: string }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", my: 1 }}>
      <ArrowDownwardIcon sx={{ color: brand.primary, fontSize: 20 }} />
      <Typography sx={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: 0.8, color: "text.secondary", fontWeight: 700 }}>
        {label}
      </Typography>
    </Box>
  );
}

function StageLabel({ n, text }: { n: number; text: string }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
      <Box sx={{ width: 22, height: 22, borderRadius: "50%", backgroundColor: brand.primary, color: "#fff", fontSize: "0.75rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {n}
      </Box>
      <Typography sx={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, color: "text.secondary" }}>
        {text}
      </Typography>
    </Box>
  );
}

export default function ReportDisseminationDialog({ open, doc, centreName, onClose, onApply }: Props) {
  const surf = useSurfaces();
  const state = useAppState();
  if (!doc) return null;

  const cid = doc.centreId;
  const findings = state.findings.filter((f) => f.centreId === cid).length;
  const rooms = (state.roomsByCentre[cid] ?? []).length;
  const registers = (state.registersByCentre[cid] ?? []).length;
  const fire = (state.fireByCentre[cid] ?? []).length;
  const notices = (state.noticesByCentre[cid] ?? []).length;
  const liveTotal = KPI_TARGETS.reduce((s, d) => s + d.live, 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>How this audit informs the system</DialogTitle>
      <DialogContent dividers>
        <Typography sx={{ fontSize: "0.85rem", color: "text.secondary", mb: 2 }}>
          The dashboard is the internal governance record. This {doc.kind === "internal" ? "internal audit" : "inspection"}{" "}
          — carried out {doc.kind === "internal" ? "by the facility itself" : "externally"} — populates the registers and
          records, which in turn compute the KPIs. The same flow serves a proactive self-audit and an external
          inspection, so nothing is keyed twice.
        </Typography>

        {/* Stage 1 — the source */}
        <StageLabel n={1} text={doc.kind === "internal" ? "Source — internal audit (facility-led)" : "Source — external inspection"} />
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5, borderRadius: 1.5, border: `1px solid ${brand.primary}`, backgroundColor: surf.subtleBg }}>
          <DescriptionIcon sx={{ color: brand.primary, fontSize: 26 }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: "0.9rem", fontWeight: 700 }}>{doc.name}</Typography>
            <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
              {centreName(cid)} · {doc.uploadedOn} · {doc.uploadedBy}
            </Typography>
          </Box>
        </Box>

        <Arrow label="Extracts into" />

        {/* Stage 2 — records populated */}
        <StageLabel n={2} text="Populates registers & records" />
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <RecordCard icon={FactCheckIcon} count={findings} label="Findings & 14-day loop" />
          <RecordCard icon={MeetingRoomIcon} count={rooms} label="Room register" />
          <RecordCard icon={ListAltIcon} count={registers} label="Admin registers" />
          <RecordCard icon={LocalFireDepartmentIcon} count={fire} label="Fire registers" />
          <RecordCard icon={CampaignIcon} count={notices} label="Mandatory notices" />
        </Box>

        <Arrow label="Computes" />

        {/* Stage 3 — KPIs informed */}
        <StageLabel n={3} text={`Informs the KPI framework — ${liveTotal} compute live today`} />
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
          {KPI_TARGETS.map((d) => (
            <Box key={d.domain} sx={{ display: "flex", alignItems: "center", gap: 1, p: 1, borderRadius: 1, backgroundColor: surf.subtleBg }}>
              <InsightsIcon sx={{ color: d.live > 0 ? rag.green : "text.disabled", fontSize: 18 }} />
              <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, flex: 1 }}>Domain {d.domain}</Typography>
              {d.live > 0 ? (
                <Chip label={`${d.live} live`} size="small" sx={{ height: 20, fontSize: "0.66rem", fontWeight: 700, backgroundColor: rag.greenBg, color: rag.green }} />
              ) : (
                <Chip label="Phase 2" size="small" sx={{ height: 20, fontSize: "0.66rem", fontWeight: 600, backgroundColor: surf.pillRowBg, color: "text.secondary" }} />
              )}
            </Box>
          ))}
        </Box>

        <Box sx={{ mt: 2, p: 1.25, borderRadius: 1, backgroundColor: rag.amberBg }}>
          <Typography sx={{ fontSize: "0.76rem", color: "text.primary" }}>
            <strong>Design workflow.</strong> The facility drives this — internal audits are recorded here proactively, so
            an external inspection should find nothing the dashboard hasn't already. In the full build an audit's fields
            capture directly into each register; today the mapping is shown and the live KPIs already recompute from the
            populated registers, so the flow is aligned end to end.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" disableElevation onClick={() => onApply(doc)}>
          Apply to system
        </Button>
      </DialogActions>
    </Dialog>
  );
}

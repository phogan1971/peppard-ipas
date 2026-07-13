import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import GavelIcon from "@mui/icons-material/Gavel";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import GppMaybeIcon from "@mui/icons-material/GppMaybe";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import StatCard from "../StatCard";
import { daysUntilDue, isOverdue, useAppState } from "../../data/store";
import { Finding, riskBand, riskScore } from "../../data/types";
import { accent, rag } from "../../theme/tokens";
import { useSurfaces } from "../../theme";

const AUDIT_CYCLE_DAYS = 90; // internal audits run quarterly

function localToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function daysSince(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Math.round((localToday().getTime() - new Date(y, m - 1, d).getTime()) / 86400000);
}

// Map a finding to an operational domain for the posture matrix.
function findingDomain(f: Finding): string {
  const t = f.finding.toLowerCase();
  if (/fire/.test(t)) return "Fire safety";
  if (/food|kitchen|catering/.test(t)) return "Food, catering";
  if (/safeguard|child|security|visitor|protection/.test(t)) return "Safeguarding";
  if (/electric|mould|damp|fixture|overcrowd|room|fabric|maintenance/.test(t)) return "Accommodation";
  return "Other";
}

const DOMAINS = ["Fire safety", "Accommodation", "Food, catering", "Safeguarding", "Other"];
const AGE_BUCKETS = [
  { label: "0-7 days", test: (n: number) => n <= 7 },
  { label: "8-30 days", test: (n: number) => n >= 8 && n <= 30 },
  { label: "31-60 days", test: (n: number) => n >= 31 && n <= 60 },
  { label: "60+ days", test: (n: number) => n > 60 },
];

export default function GovernanceCockpit({ centreFilter, onOpenTab }: { centreFilter: string; onOpenTab: (tab: string) => void }) {
  const surf = useSurfaces();
  const { findings, documentsByCentre, centres, risks } = useAppState();

  const scope = centreFilter === "all" ? centres.map((c) => c.id) : [centreFilter];
  const inScope = (id: string) => scope.includes(id);
  const cFindings = findings.filter((f) => inScope(f.centreId));

  // Risk posture (group-level risks show in every facility view)
  const scopedRisks = risks.filter((r) => centreFilter === "all" || r.centreId === centreFilter || r.centreId === null);
  const openRisks = scopedRisks.filter((r) => r.status !== "closed");
  const riskExtreme = openRisks.filter((r) => riskBand(riskScore(r.likelihood, r.impact)) === "extreme").length;
  const riskHigh = openRisks.filter((r) => riskBand(riskScore(r.likelihood, r.impact)) === "high").length;
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const riskReviewsOverdue = openRisks.filter((r) => r.reviewOn && r.reviewOn < todayIso).length;

  const open = cFindings.filter((f) => f.status !== "closed");
  const openRed = open.filter((f) => f.priority === "RED").length;
  const overdue = open.filter(isOverdue).length;
  const due = cFindings.filter((f) => f.dueOn !== null);
  const onTimePct = due.length === 0 ? 100 : Math.round((due.filter((f) => !isOverdue(f)).length / due.length) * 100);

  // Internal-audit programme: each centre runs a quarterly self-audit.
  const internalAudits = scope
    .flatMap((id) => (documentsByCentre[id] ?? []).filter((d) => d.kind === "internal").map((d) => ({ ...d, centreId: id })));
  const lastAuditByCentre = new Map<string, string>();
  for (const a of internalAudits) {
    const cur = lastAuditByCentre.get(a.centreId);
    if (!cur || a.uploadedOn > cur) lastAuditByCentre.set(a.centreId, a.uploadedOn);
  }
  const nextDueDays = scope
    .map((id) => {
      const last = lastAuditByCentre.get(id);
      return last ? AUDIT_CYCLE_DAYS - daysSince(last) : -999; // never audited → overdue
    })
    .sort((a, b) => a - b);
  const soonestNext = nextDueDays[0] ?? AUDIT_CYCLE_DAYS;

  // Audits completed this quarter vs the number of centres in scope.
  const now = new Date();
  const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  const qStartIso = `${qStart.getFullYear()}-${String(qStart.getMonth() + 1).padStart(2, "0")}-01`;
  const doneThisQuarter = scope.filter((id) => {
    const last = lastAuditByCentre.get(id);
    return last && last >= qStartIso;
  }).length;
  const auditPct = scope.length === 0 ? 0 : Math.round((doneThisQuarter / scope.length) * 100);

  // Open actions × age matrix
  const matrix: Record<string, number[]> = {};
  for (const dom of DOMAINS) matrix[dom] = [0, 0, 0, 0];
  for (const f of open) {
    const dom = findingDomain(f);
    const age = daysSince(f.raisedOn);
    const bi = AGE_BUCKETS.findIndex((b) => b.test(age));
    if (bi >= 0) matrix[dom][bi] += 1;
  }
  const overdueCells = open.filter((f) => {
    const d = daysUntilDue(f);
    return d !== null && d < 0;
  }).length;

  return (
    <Box>
      <Typography variant="overline" sx={{ color: "text.secondary", fontWeight: 700, letterSpacing: 1 }}>
        Regulatory readiness
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3, mt: 0.25 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Evidence timeliness"
            value={`${onTimePct}%`}
            sub="findings inside the 14-day loop"
            accent={onTimePct >= 90 ? accent.green : onTimePct >= 75 ? accent.orange : accent.red}
            icon={GavelIcon}
            onClick={() => onOpenTab("actions")}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Open actions"
            value={open.length}
            sub={`${openRed} RED · corrective actions`}
            accent={openRed > 0 ? accent.red : accent.orange}
            icon={WarningAmberIcon}
            onClick={() => onOpenTab("actions")}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Next internal audit"
            value={soonestNext < 0 ? `${-soonestNext}d over` : `${soonestNext}d`}
            sub={soonestNext < 0 ? "self-audit overdue" : "until next self-audit due"}
            accent={soonestNext < 0 ? accent.red : soonestNext <= 14 ? accent.orange : accent.blue}
            icon={EventAvailableIcon}
            onClick={() => onOpenTab("audit")}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Overdue actions"
            value={overdue}
            sub="past the 14-day evidence clock"
            accent={overdue > 0 ? accent.red : accent.green}
            icon={ErrorOutlineIcon}
            onClick={() => onOpenTab("actions")}
          />
        </Grid>
      </Grid>

      <Typography variant="overline" sx={{ color: "text.secondary", fontWeight: 700, letterSpacing: 1 }}>
        Operational posture
      </Typography>
      <Grid container spacing={2} sx={{ mt: 0.25 }}>
        {/* Open actions × overdue age */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", mb: 1 }}>
              <Typography sx={{ fontWeight: 700, color: "text.primary" }}>Open actions — domain × age</Typography>
              <Typography sx={{ fontSize: "0.78rem", color: overdueCells > 0 ? rag.red : "text.secondary", fontWeight: overdueCells > 0 ? 700 : 400 }}>
                {overdueCells} overdue
              </Typography>
            </Box>
            <Box sx={{ overflowX: "auto" }}>
              <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                <Box component="thead">
                  <Box component="tr">
                    <Box component="th" sx={{ textAlign: "left", py: 0.5, color: "text.secondary", fontWeight: 600 }} />
                    {AGE_BUCKETS.map((b) => (
                      <Box component="th" key={b.label} sx={{ textAlign: "center", py: 0.5, px: 1, color: "text.secondary", fontWeight: 600, fontSize: "0.72rem" }}>
                        {b.label}
                      </Box>
                    ))}
                  </Box>
                </Box>
                <Box component="tbody">
                  {DOMAINS.map((dom) => (
                    <Box component="tr" key={dom}>
                      <Box component="td" sx={{ py: 0.6, pr: 1, fontWeight: 600 }}>{dom}</Box>
                      {matrix[dom].map((n, i) => (
                        <Box
                          component="td"
                          key={i}
                          sx={{
                            textAlign: "center",
                            py: 0.6,
                            m: 0.25,
                            fontWeight: n > 0 ? 700 : 400,
                            color: n > 0 ? (i === 3 ? rag.red : "text.primary") : "text.disabled",
                            backgroundColor: n > 0 ? (i === 3 ? rag.redBg : surf.subtleBg) : "transparent",
                            borderRadius: 1,
                          }}
                        >
                          {n}
                        </Box>
                      ))}
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Risk posture — Phase 2 */}
        <Grid item xs={12} sm={6} lg={3}>
          <Paper sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <GppMaybeIcon sx={{ color: accent.purple, fontSize: 20 }} />
                <Typography sx={{ fontWeight: 700 }}>Risk posture</Typography>
              </Box>
              {riskReviewsOverdue > 0 && (
                <Chip label={`${riskReviewsOverdue} review${riskReviewsOverdue === 1 ? "" : "s"} due`} size="small" sx={{ height: 20, fontSize: "0.64rem", fontWeight: 700, backgroundColor: rag.redBg, color: rag.red }} />
              )}
            </Box>
            <Typography sx={{ fontSize: "2rem", fontWeight: 800, color: "text.primary", lineHeight: 1 }}>{openRisks.length}</Typography>
            <Typography sx={{ fontSize: "0.78rem", color: "text.secondary", mb: 1 }}>
              open risks · {riskExtreme} extreme · {riskHigh} high
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Button size="small" onClick={() => onOpenTab("risk")} sx={{ alignSelf: "flex-start", px: 0 }}>
              Open risk register →
            </Button>
          </Paper>
        </Grid>

        {/* Audit programme */}
        <Grid item xs={12} sm={6} lg={3}>
          <Paper sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <FactCheckIcon sx={{ color: accent.navy, fontSize: 20 }} />
              <Typography sx={{ fontWeight: 700 }}>Audit programme</Typography>
            </Box>
            <Typography sx={{ fontSize: "2rem", fontWeight: 800, color: auditPct >= 80 ? rag.green : auditPct >= 50 ? rag.amber : rag.red, lineHeight: 1 }}>
              {auditPct}%
            </Typography>
            <Typography sx={{ fontSize: "0.78rem", color: "text.secondary", mb: 1 }}>
              {doneThisQuarter} of {scope.length} self-audits this quarter
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
              Next due in {soonestNext < 0 ? `${-soonestNext}d (overdue)` : `${soonestNext}d`}
            </Typography>
            <Button size="small" onClick={() => onOpenTab("audit")} sx={{ alignSelf: "flex-start", px: 0 }}>
              Open audit programme →
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

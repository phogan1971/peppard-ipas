import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import PercentIcon from "@mui/icons-material/Percent";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import GppMaybeIcon from "@mui/icons-material/GppMaybe";
import EventIcon from "@mui/icons-material/Event";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import StatCard from "../StatCard";
import { isOverdue, useAppState } from "../../data/store";
import { riskBand, riskScore } from "../../data/types";
import { accent, rag, ragAccent } from "../../theme/tokens";
import { useSurfaces } from "../../theme";

function todayParts(): { y: number; m: number } {
  const d = new Date();
  return { y: d.getFullYear(), m: d.getMonth() };
}

// Recharts stays out of the main bundle (it's a lazy chart chunk), so the
// 12-month trend is a small hand-rolled SVG line — deterministic, no
// animation dependency, prints intact.
function TrendLine({ points, target }: { points: (number | null)[]; target: number }) {
  const surf = useSurfaces();
  const W = 640;
  const H = 180;
  const padL = 34;
  const padB = 22;
  const padT = 10;
  const min = 50;
  const max = 100;
  const x = (i: number) => padL + (i * (W - padL - 8)) / Math.max(1, points.length - 1);
  const y = (v: number) => padT + ((max - v) * (H - padT - padB)) / (max - min);
  const path = points
    .map((v, i) => (v === null ? null : `${x(i)},${y(v)}`))
    .filter(Boolean)
    .map((p, i) => `${i === 0 ? "M" : "L"}${p}`)
    .join(" ");
  const { y: cy, m: cm } = todayParts();
  const monthLabel = (i: number) => {
    const d = new Date(cy, cm - (points.length - 1 - i), 1);
    return d.toLocaleDateString("en-IE", { month: "short" });
  };
  return (
    <Box component="svg" viewBox={`0 0 ${W} ${H}`} sx={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label="Average audit compliance by month">
      {[60, 70, 80, 90, 100].map((v) => (
        <g key={v}>
          <line x1={padL} x2={W - 8} y1={y(v)} y2={y(v)} stroke={surf.border} strokeWidth={1} />
          <text x={padL - 6} y={y(v) + 3.5} textAnchor="end" fontSize={10} fill="currentColor" opacity={0.6}>
            {v}%
          </text>
        </g>
      ))}
      <line x1={padL} x2={W - 8} y1={y(target)} y2={y(target)} stroke={ragAccent.amber} strokeWidth={1.5} strokeDasharray="5 4" />
      <text x={W - 10} y={y(target) - 4} textAnchor="end" fontSize={10} fill={ragAccent.amber} fontWeight={700}>
        target {target}%
      </text>
      <path d={path} fill="none" stroke={accent.blue} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {points.map((v, i) =>
        v === null ? null : <circle key={i} cx={x(i)} cy={y(v)} r={3.2} fill={accent.blue} />,
      )}
      {points.map((_, i) => (
        <text key={i} x={x(i)} y={H - 6} textAnchor="middle" fontSize={9.5} fill="currentColor" opacity={0.6}>
          {monthLabel(i)}
        </text>
      ))}
    </Box>
  );
}

export default function AuditDashboard({ centreFilter, onOpenTab }: { centreFilter: string; onOpenTab: (tab: string) => void }) {
  const { auditRecords, auditTypes, findings, qips, risks, schedules, centres } = useAppState();
  const scope = (id: string) => centreFilter === "all" || id === centreFilter;

  const records = auditRecords.filter((r) => scope(r.centreId));
  const avgPct = records.length === 0 ? 0 : Math.round(records.reduce((s, r) => s + r.compliancePct, 0) / records.length);
  const open = findings.filter((f) => scope(f.centreId) && f.status !== "closed");
  const overdue = open.filter(isOverdue).length;
  const openQips = qips.filter((q) => (centreFilter === "all" || q.centreId === centreFilter || q.centreId === null) && q.status !== "closed").length;
  const openRisks = risks.filter((r) => (centreFilter === "all" || r.centreId === centreFilter || r.centreId === null) && r.status !== "closed");
  const extremeHigh = openRisks.filter((r) => ["extreme", "high"].includes(riskBand(riskScore(r.likelihood, r.impact)))).length;
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const scheduled = schedules.filter((s) => scope(s.centreId) && s.status === "scheduled" && s.dueOn >= todayIso).length;
  const missed = schedules.filter((s) => scope(s.centreId) && s.status === "scheduled" && s.dueOn < todayIso).length;

  // Monthly average compliance over the last 12 months.
  const { y: cy, m: cm } = todayParts();
  const monthKey = (iso: string) => iso.slice(0, 7);
  const months: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(cy, cm - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  const trend = months.map((mk) => {
    const inMonth = records.filter((r) => monthKey(r.conductedOn) === mk);
    return inMonth.length === 0 ? null : Math.round(inMonth.reduce((s, r) => s + r.compliancePct, 0) / inMonth.length);
  });

  // Compliance by audit type.
  const byType = auditTypes
    .filter((t) => t.active)
    .map((t) => {
      const rs = records.filter((r) => r.auditTypeId === t.id);
      const avg = rs.length === 0 ? null : Math.round(rs.reduce((s, r) => s + r.compliancePct, 0) / rs.length);
      return { type: t, count: rs.length, avg };
    })
    .filter((r) => r.count > 0)
    .sort((a, b) => (a.avg ?? 0) - (b.avg ?? 0));

  const recent = [...records].sort((a, b) => (a.conductedOn < b.conductedOn ? 1 : -1)).slice(0, 8);
  const centreName = (id: string) => centres.find((c) => c.id === id)?.shortName ?? id;
  const pctColor = (pct: number, target: number) => (pct >= target ? rag.green : pct >= target - 10 ? rag.amber : rag.red);

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}>
          <StatCard label="Audits (12 months)" value={records.length} sub="internal audit programme" accent={accent.navy} icon={FactCheckIcon} onClick={() => onOpenTab("results")} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Avg compliance" value={`${avgPct}%`} sub="across all audit types" accent={avgPct >= 85 ? accent.green : avgPct >= 70 ? accent.orange : accent.red} icon={PercentIcon} onClick={() => onOpenTab("results")} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Open actions" value={open.length} sub="corrective actions in flight" accent={accent.orange} icon={WarningAmberIcon} onClick={() => onOpenTab("actions")} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Overdue actions" value={overdue} sub="past the 14-day clock" accent={overdue > 0 ? accent.red : accent.green} icon={ErrorOutlineIcon} onClick={() => onOpenTab("actions")} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Open QIPs" value={openQips} sub="improvement plans" accent={accent.purple} icon={TrendingUpIcon} onClick={() => onOpenTab("qip")} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="High/extreme risks" value={extremeHigh} sub={`of ${openRisks.length} open risks`} accent={extremeHigh > 0 ? accent.red : accent.green} icon={GppMaybeIcon} onClick={() => onOpenTab("risk")} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Scheduled" value={scheduled} sub="audits upcoming" accent={accent.blue} icon={EventIcon} onClick={() => onOpenTab("scheduling")} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Missed" value={missed} sub="scheduled audits past due" accent={missed > 0 ? accent.red : accent.green} icon={EventBusyIcon} onClick={() => onOpenTab("scheduling")} />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={7}>
          <Paper sx={{ p: 2 }}>
            <Typography sx={{ fontWeight: 700, mb: 0.5 }}>Compliance trend — 12 months</Typography>
            <Typography sx={{ fontSize: "0.78rem", color: "text.secondary", mb: 1 }}>
              Average internal-audit compliance score per month{centreFilter !== "all" ? ` · ${centreName(centreFilter)}` : " · all facilities"}
            </Typography>
            <TrendLine points={trend} target={90} />
          </Paper>
        </Grid>
        <Grid item xs={12} lg={5}>
          <Paper sx={{ overflow: "hidden", height: "100%" }}>
            <Box sx={{ p: 2, pb: 1 }}>
              <Typography sx={{ fontWeight: 700 }}>Compliance by audit type</Typography>
            </Box>
            <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Audit type</TableCell>
                  <TableCell align="right">Audits</TableCell>
                  <TableCell sx={{ minWidth: 130 }}>Avg vs target</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {byType.map(({ type, count, avg }) => (
                  <TableRow key={type.id} hover>
                    <TableCell>
                      <Typography sx={{ fontSize: "0.82rem", fontWeight: 600 }}>{type.name}</Typography>
                      <Typography sx={{ fontSize: "0.68rem", color: "text.secondary" }}>{type.sourceStandard}</Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: "0.82rem" }}>{count}</TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={avg ?? 0}
                          sx={{ flex: 1, height: 7, borderRadius: 4, backgroundColor: "action.hover", "& .MuiLinearProgress-bar": { backgroundColor: pctColor(avg ?? 0, type.targetPct) } }}
                        />
                        <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, minWidth: 60, color: pctColor(avg ?? 0, type.targetPct) }}>
                          {avg}% / {type.targetPct}%
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ overflow: "hidden", mt: 2 }}>
        <Box sx={{ p: 2, pb: 1 }}>
          <Typography sx={{ fontWeight: 700 }}>Recent audits</Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Audit</TableCell>
                <TableCell>Facility</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Conducted by</TableCell>
                <TableCell align="right">Score</TableCell>
                <TableCell align="right">Findings</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recent.map((r) => (
                <TableRow key={r.id} hover sx={{ cursor: "pointer" }} onClick={() => onOpenTab("results")}>
                  <TableCell sx={{ fontSize: "0.82rem", fontWeight: 600 }}>{r.auditName}</TableCell>
                  <TableCell sx={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}>{centreName(r.centreId)}</TableCell>
                  <TableCell sx={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}>{r.conductedOn}</TableCell>
                  <TableCell sx={{ fontSize: "0.8rem" }}>{r.conductedBy}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: pctColor(r.compliancePct, r.targetPct) }}>{r.compliancePct}%</TableCell>
                  <TableCell align="right" sx={{ fontSize: "0.82rem" }}>{r.findingsRaised}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

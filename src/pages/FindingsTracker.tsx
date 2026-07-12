import { useState } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import ScheduleIcon from "@mui/icons-material/Schedule";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import PageShell from "../components/PageShell";
import StatCard from "../components/StatCard";
import DetailDialog, { DetailContent } from "../components/DetailDialog";
import { RagChip } from "../components/RagChip";
import { daysUntilDue, setFindingStatus, useAppState } from "../data/store";
import { Finding, FindingStatus } from "../data/types";
import { brand, rag, accent } from "../theme/tokens";
import { useSurfaces } from "../theme";

const STATUS_META: Record<FindingStatus, { label: string; color: string; bg: string }> = {
  open: { label: "Open", color: rag.red, bg: rag.redBg },
  evidence_submitted: { label: "Evidence submitted", color: rag.amber, bg: rag.amberBg },
  closed: { label: "Closed", color: rag.green, bg: rag.greenBg },
};

function DueClock({ finding }: { finding: Finding }) {
  const days = daysUntilDue(finding);
  if (days === null || finding.status === "closed") return null;
  const overdue = days < 0;
  const dueSoon = days >= 0 && days <= 5;
  const label = overdue ? `${-days}d overdue` : days === 0 ? "Due today" : `${days}d remaining`;
  const c = overdue ? { color: "#fff", bg: rag.red } : dueSoon ? { color: rag.amber, bg: rag.amberBg } : { color: rag.green, bg: rag.greenBg };
  return <Chip label={label} size="small" sx={{ backgroundColor: c.bg, color: c.color, fontWeight: 700 }} />;
}

export default function FindingsTracker() {
  const { centres, findings } = useAppState();
  const s = useSurfaces();
  const [centreFilter, setCentreFilter] = useState<string>("all");
  const [showClosed, setShowClosed] = useState(false);

  const filtered = findings
    .filter((f) => centreFilter === "all" || f.centreId === centreFilter)
    .filter((f) => showClosed || f.status !== "closed")
    .sort((a, b) => {
      const da = daysUntilDue(a) ?? 999;
      const db = daysUntilDue(b) ?? 999;
      return da - db;
    });

  const open = findings.filter((f) => f.status !== "closed");
  const overdueCount = open.filter((f) => {
    const d = daysUntilDue(f);
    return d !== null && d < 0 && f.status === "open";
  }).length;
  const dueThisWeek = open.filter((f) => {
    const d = daysUntilDue(f);
    return d !== null && d >= 0 && d <= 7;
  }).length;

  const centreName = (id: string) => centres.find((c) => c.id === id)?.shortName ?? id;

  const [detail, setDetail] = useState<DetailContent | null>(null);

  const statusChip = (f: Finding) => {
    const sm = STATUS_META[f.status];
    return <Chip label={sm.label} size="small" sx={{ backgroundColor: sm.bg, color: sm.color, fontWeight: 700, height: 20, fontSize: "0.68rem" }} />;
  };

  const findingRows = (list: Finding[]) =>
    [...list]
      .sort((a, b) => (daysUntilDue(a) ?? 9999) - (daysUntilDue(b) ?? 9999))
      .map((f) => ({
        id: f.id,
        leading: <RagChip priority={f.priority} />,
        primary: `${centreName(f.centreId)} · ${f.finding}`,
        secondary: f.actionRequired,
        trailing: f.status === "closed" ? statusChip(f) : <DueClock finding={f} />,
      }));

  const openDetail = (): DetailContent => ({
    title: "Open findings",
    subtitle: `${open.length} open across all centres`,
    rows: findingRows(open),
    emptyText: "No open findings.",
  });

  const overdueDetail = (): DetailContent => ({
    title: "Overdue evidence",
    subtitle: `${overdueCount} finding${overdueCount === 1 ? "" : "s"} past the 14-day evidence clock`,
    rows: findingRows(open.filter((f) => { const d = daysUntilDue(f); return d !== null && d < 0 && f.status === "open"; })),
    emptyText: "Nothing is past the 14-day evidence clock.",
  });

  const dueSoonDetail = (): DetailContent => ({
    title: "Due within 7 days",
    subtitle: `${dueThisWeek} evidence deadline${dueThisWeek === 1 ? "" : "s"} approaching`,
    rows: findingRows(open.filter((f) => { const d = daysUntilDue(f); return d !== null && d >= 0 && d <= 7; })),
    emptyText: "No evidence deadlines within 7 days.",
  });

  const closedDetail = (): DetailContent => ({
    title: "Closed findings",
    subtitle: "Evidence accepted",
    rows: findingRows(findings.filter((f) => f.status === "closed")),
    emptyText: "No findings closed yet.",
  });

  return (
    <PageShell
      icon={FactCheckIcon}
      title="Findings & Actions"
      subtitle="Inspection findings with RAG priority and the 14-day evidence clock"
    >
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Open findings" value={open.length} sub="across all centres" accent={accent.navy} icon={FactCheckIcon} onClick={() => setDetail(openDetail())} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Overdue evidence" value={overdueCount} sub="past the 14-day clock" accent={overdueCount > 0 ? accent.red : accent.green} icon={ErrorOutlineIcon} onClick={() => setDetail(overdueDetail())} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Due within 7 days" value={dueThisWeek} sub="evidence deadlines approaching" accent={accent.orange} icon={ScheduleIcon} onClick={() => setDetail(dueSoonDetail())} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Closed" value={findings.length - open.length} sub="evidence accepted" accent={accent.green} icon={CheckCircleOutlineIcon} onClick={() => setDetail(closedDetail())} />
        </Grid>
      </Grid>

      <DetailDialog content={detail} onClose={() => setDetail(null)} />

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2, alignItems: "center" }}>
        {[{ id: "all", label: "All centres" }, ...centres.map((c) => ({ id: c.id, label: c.shortName }))].map((opt) => {
          const selected = centreFilter === opt.id;
          return (
            <Button
              key={opt.id}
              size="small"
              onClick={() => setCentreFilter(opt.id)}
              sx={{
                borderRadius: 2,
                px: 1.5,
                py: 0.5,
                fontSize: "0.8rem",
                border: "1px solid",
                borderColor: selected ? brand.primary : s.border,
                backgroundColor: selected ? brand.primary : s.pillIdleBg,
                color: selected ? "#fff" : s.pillIdleColor,
                "&:hover": { backgroundColor: selected ? brand.primaryDark : s.hoverBg },
              }}
            >
              {opt.label}
            </Button>
          );
        })}
        <Box sx={{ flexGrow: 1 }} />
        <Button size="small" onClick={() => setShowClosed((v) => !v)} sx={{ color: "text.primary", textDecoration: "underline" }}>
          {showClosed ? "Hide closed" : "Show closed"}
        </Button>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {filtered.map((f) => {
          const sm = STATUS_META[f.status];
          return (
            <Paper key={f.id} sx={{ p: 2 }}>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center", mb: 0.75 }}>
                <RagChip priority={f.priority} />
                <Typography sx={{ fontWeight: 700, color: "text.primary" }}>{f.finding}</Typography>
                <Chip label={centreName(f.centreId)} size="small" sx={{ backgroundColor: s.pillRowBg }} />
                <DueClock finding={f} />
                <Box sx={{ flexGrow: 1 }} />
                <Chip label={sm.label} size="small" sx={{ backgroundColor: sm.bg, color: sm.color, fontWeight: 600 }} />
              </Box>
              <Typography sx={{ fontSize: "0.85rem", color: "text.secondary", mb: 1 }}>{f.actionRequired}</Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
                  Raised {f.raisedOn}
                  {f.dueOn ? ` · evidence due ${f.dueOn}` : ""}
                  {f.evidenceNote ? ` · ${f.evidenceNote}` : ""}
                </Typography>
                <Box sx={{ flexGrow: 1 }} />
                {f.status === "open" && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setFindingStatus(f.id, "evidence_submitted", "Evidence pack submitted to IPAS")}
                  >
                    Mark evidence submitted
                  </Button>
                )}
                {f.status !== "closed" && (
                  <Button
                    size="small"
                    variant="contained"
                    disableElevation
                    onClick={() => setFindingStatus(f.id, "closed", "Evidence accepted — finding closed")}
                  >
                    Close finding
                  </Button>
                )}
                {f.status === "closed" && (
                  <Button size="small" onClick={() => setFindingStatus(f.id, "open")}>
                    Reopen
                  </Button>
                )}
              </Box>
            </Paper>
          );
        })}
        {filtered.length === 0 && (
          <Paper sx={{ p: 3 }}>
            <Typography color="text.secondary">No findings match the current filter.</Typography>
          </Paper>
        )}
      </Box>
    </PageShell>
  );
}

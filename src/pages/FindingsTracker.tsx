import { useState } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import ScheduleIcon from "@mui/icons-material/Schedule";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import ViewAgendaIcon from "@mui/icons-material/ViewAgenda";
import TableRowsIcon from "@mui/icons-material/TableRows";
import PageShell from "../components/PageShell";
import StatCard from "../components/StatCard";
import DetailDialog, { DetailContent, DetailFilter } from "../components/DetailDialog";
import FindingFormDialog from "../components/FindingFormDialog";
import InspectionReportsPanel from "../components/InspectionReportsPanel";
import FindingsSummaryTable from "../components/FindingsSummaryTable";
import ReportDisseminationDialog from "../components/ReportDisseminationDialog";
import { RagChip } from "../components/RagChip";
import { addSourceDocument, daysUntilDue, isOverdue, recordInternalAudit, setFindingStatus, useAppState } from "../data/store";
import { Finding, FindingStatus, SourceDocument } from "../data/types";
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
  // Evidence submitted pauses the clock — it is no longer "overdue" (the
  // operator has responded); show that state rather than a red countdown.
  if (finding.status === "evidence_submitted") {
    return <Chip label="Awaiting confirmation" size="small" sx={{ backgroundColor: rag.amberBg, color: rag.amber, fontWeight: 700 }} />;
  }
  const overdue = isOverdue(finding);
  const dueSoon = days >= 0 && days <= 5;
  const label = overdue ? `${-days}d overdue` : days === 0 ? "Due today" : `${days}d remaining`;
  const c = overdue ? { color: "#fff", bg: rag.red } : dueSoon ? { color: rag.amber, bg: rag.amberBg } : { color: rag.green, bg: rag.greenBg };
  return <Chip label={label} size="small" sx={{ backgroundColor: c.bg, color: c.color, fontWeight: 700 }} />;
}

export default function FindingsTracker() {
  const { centres, findings, documentsByCentre } = useAppState();
  const s = useSurfaces();
  const [centreFilter, setCentreFilter] = useState<string>("all");
  const [showClosed, setShowClosed] = useState(false);
  const [view, setView] = useState<"cards" | "table">("cards");

  const filtered = findings
    .filter((f) => centreFilter === "all" || f.centreId === centreFilter)
    .filter((f) => showClosed || f.status !== "closed")
    .sort((a, b) => {
      const da = daysUntilDue(a) ?? 999;
      const db = daysUntilDue(b) ?? 999;
      return da - db;
    });

  const open = findings.filter((f) => f.status !== "closed");
  const overdueCount = open.filter(isOverdue).length;
  const dueThisWeek = open.filter((f) => {
    const d = daysUntilDue(f);
    return d !== null && d >= 0 && d <= 7;
  }).length;

  const centreName = (id: string) => centres.find((c) => c.id === id)?.shortName ?? id;

  const [detail, setDetail] = useState<DetailContent | null>(null);
  const [dialog, setDialog] = useState<{ open: boolean; existing: Finding | null }>({ open: false, existing: null });
  const [processDoc, setProcessDoc] = useState<SourceDocument | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const statusChip = (f: Finding) => {
    const sm = STATUS_META[f.status];
    return <Chip label={sm.label} size="small" sx={{ backgroundColor: sm.bg, color: sm.color, fontWeight: 700, height: 20, fontSize: "0.68rem" }} />;
  };

  const findingRows = (list: Finding[]) =>
    [...list]
      .sort((a, b) => (daysUntilDue(a) ?? 9999) - (daysUntilDue(b) ?? 9999))
      .map((f) => ({
        id: f.id,
        filterValue: f.centreId,
        leading: <RagChip priority={f.priority} />,
        primary: `${centreName(f.centreId)} · ${f.finding}`,
        secondary: f.actionRequired,
        trailing: f.status === "closed" ? statusChip(f) : <DueClock finding={f} />,
      }));

  // A "filter by facility" dropdown for the drill-down, offered only when the
  // list spans more than one centre and listing only the centres present.
  const centreDetailFilter = (list: Finding[]): DetailFilter | undefined => {
    const present = new Set(list.map((f) => f.centreId));
    if (present.size <= 1) return undefined;
    return {
      allLabel: "All centres",
      options: centres.filter((c) => present.has(c.id)).map((c) => ({ value: c.id, label: c.shortName })),
    };
  };

  const openDetail = (): DetailContent => ({
    title: "Open findings",
    subtitle: `${open.length} open across all centres`,
    rows: findingRows(open),
    emptyText: "No open findings.",
    filter: centreDetailFilter(open),
  });

  const overdueDetail = (): DetailContent => {
    const list = open.filter(isOverdue);
    return {
      title: "Overdue evidence",
      subtitle: `${overdueCount} finding${overdueCount === 1 ? "" : "s"} past the 14-day evidence clock`,
      rows: findingRows(list),
      emptyText: "Nothing is past the 14-day evidence clock.",
      filter: centreDetailFilter(list),
    };
  };

  const dueSoonDetail = (): DetailContent => {
    const list = open.filter((f) => {
      const d = daysUntilDue(f);
      return d !== null && d >= 0 && d <= 7;
    });
    return {
      title: "Due within 7 days",
      subtitle: `${dueThisWeek} evidence deadline${dueThisWeek === 1 ? "" : "s"} approaching`,
      rows: findingRows(list),
      emptyText: "No evidence deadlines within 7 days.",
      filter: centreDetailFilter(list),
    };
  };

  const closedDetail = (): DetailContent => {
    const list = findings.filter((f) => f.status === "closed");
    return {
      title: "Closed findings",
      subtitle: "Evidence on file",
      rows: findingRows(list),
      emptyText: "No findings closed yet.",
      filter: centreDetailFilter(list),
    };
  };

  return (
    <PageShell
      icon={FactCheckIcon}
      title="Findings & Actions"
      subtitle="Inspection findings with RAG priority and the 14-day evidence clock"
      actions={
        <Button variant="contained" disableElevation startIcon={<AddIcon />} onClick={() => setDialog({ open: true, existing: null })}>
          Raise finding
        </Button>
      }
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
          <StatCard label="Closed" value={findings.length - open.length} sub="evidence on file" accent={accent.green} icon={CheckCircleOutlineIcon} onClick={() => setDetail(closedDetail())} />
        </Grid>
      </Grid>

      <DetailDialog content={detail} onClose={() => setDetail(null)} />

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2, alignItems: "center" }}>
        {/* On phones the nine centre pills collapse into one dropdown. */}
        <TextField
          select
          size="small"
          label="Centre"
          value={centreFilter}
          onChange={(e) => setCentreFilter(e.target.value)}
          sx={{ display: { xs: "flex", sm: "none" }, flex: 1, minWidth: 170 }}
        >
          {[{ id: "all", label: "All centres" }, ...centres.map((c) => ({ id: c.id, label: c.shortName }))].map((opt) => (
            <MenuItem key={opt.id} value={opt.id}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>
        <Box sx={{ display: { xs: "none", sm: "flex" }, gap: 1, flexWrap: "wrap", alignItems: "center" }}>
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
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        <ToggleButtonGroup
          size="small"
          exclusive
          value={view}
          onChange={(_, v) => v && setView(v)}
          aria-label="Findings view"
        >
          <ToggleButton value="cards" aria-label="Card view">
            <ViewAgendaIcon sx={{ fontSize: 18 }} />
          </ToggleButton>
          <ToggleButton value="table" aria-label="Table view">
            <TableRowsIcon sx={{ fontSize: 18 }} />
          </ToggleButton>
        </ToggleButtonGroup>
        <Button size="small" onClick={() => setShowClosed((v) => !v)} sx={{ color: "text.primary", textDecoration: "underline" }}>
          {showClosed ? "Hide closed" : "Show closed"}
        </Button>
      </Box>

      <InspectionReportsPanel
        documents={centreFilter === "all" ? Object.values(documentsByCentre).flat() : documentsByCentre[centreFilter] ?? []}
        uploadCentreId={centreFilter === "all" ? null : centreFilter}
        uploadCentreName={centreName(centreFilter)}
        centres={centres}
        centreName={centreName}
        onUpload={(centreId, doc) => {
          addSourceDocument(centreId, doc, centres.find((c) => c.id === centreId)?.manager ?? "Centre Manager");
          setToast(`${doc.name} attached to ${centreName(centreId)} — its findings are summarised below.`);
        }}
        onRecordAudit={(centreId) => {
          recordInternalAudit(centreId, centres.find((c) => c.id === centreId)?.manager ?? "Centre Manager");
          setToast(`Internal audit recorded for ${centreName(centreId)} — raise findings against it and disseminate to the KPIs.`);
        }}
        onProcess={(doc) => setProcessDoc(doc)}
      />

      <ReportDisseminationDialog
        open={!!processDoc}
        doc={processDoc}
        centreName={centreName}
        onClose={() => setProcessDoc(null)}
        onApply={(doc) => {
          setProcessDoc(null);
          setToast(`${centreName(doc.centreId)} inspection disseminated — findings, registers, notices and the room register updated; live KPIs recomputed.`);
        }}
      />

      {view === "table" ? (
        <FindingsSummaryTable findings={filtered} centreName={centreName} documentsByCentre={documentsByCentre} />
      ) : (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {filtered.map((f) => {
          const sm = STATUS_META[f.status];
          return (
            <Paper key={f.id} sx={{ p: 2 }}>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center", mb: 0.75 }}>
                <RagChip priority={f.priority} />
                <Typography sx={{ fontWeight: 700, color: "text.primary" }}>{f.finding}</Typography>
                <Chip label={centreName(f.centreId)} size="small" sx={{ backgroundColor: s.pillRowBg }} />
                {f.hiqaStandard && (
                  <Chip label={`HIQA ${f.hiqaStandard}`} size="small" sx={{ height: 20, fontSize: "0.68rem", fontWeight: 700, backgroundColor: rag.greenBg, color: rag.green }} />
                )}
                <DueClock finding={f} />
                <Box sx={{ flexGrow: 1 }} />
                <Chip label={sm.label} size="small" sx={{ backgroundColor: sm.bg, color: sm.color, fontWeight: 600 }} />
              </Box>
              <Typography sx={{ fontSize: "0.85rem", color: "text.secondary", mb: 1 }}>{f.actionRequired}</Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
                  {f.source ? `${f.source} · ` : ""}
                  {f.section}
                  {" · "}Raised {f.raisedOn}
                  {f.dueOn ? ` · evidence due ${f.dueOn}` : ""}
                  {f.evidenceNote ? ` · ${f.evidenceNote}` : ""}
                </Typography>
                <Box sx={{ flexGrow: 1 }} />
                <Button size="small" startIcon={<EditIcon sx={{ fontSize: 16 }} />} onClick={() => setDialog({ open: true, existing: f })}>
                  Edit
                </Button>
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
                    onClick={() => setFindingStatus(f.id, "closed", "Closed — evidence on file")}
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
      )}

      <FindingFormDialog
        open={dialog.open}
        centres={centres}
        existing={dialog.existing}
        defaultCentreId={centreFilter === "all" ? undefined : centreFilter}
        onClose={() => setDialog({ open: false, existing: null })}
        onSaved={(summary) => {
          setDialog({ open: false, existing: null });
          setToast(summary);
        }}
      />

      <Snackbar
        open={!!toast}
        autoHideDuration={4500}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setToast(null)} severity="success" variant="filled" sx={{ width: "100%" }}>
          {toast}
        </Alert>
      </Snackbar>
    </PageShell>
  );
}

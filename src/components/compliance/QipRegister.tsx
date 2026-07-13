import { useState } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import AddIcon from "@mui/icons-material/Add";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import RateReviewIcon from "@mui/icons-material/RateReview";
import DonutLargeIcon from "@mui/icons-material/DonutLarge";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import StatCard from "../StatCard";
import QipFormDialog from "./QipFormDialog";
import { useAppState } from "../../data/store";
import { Centre, Qip, qipProgress } from "../../data/types";
import { accent, rag } from "../../theme/tokens";

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const STATUS_META: Record<Qip["status"], { label: string; color: string; bg: string }> = {
  active: { label: "Active", color: accent.blue, bg: "#E3F0FB" },
  under_review: { label: "Under review", color: rag.amber, bg: rag.amberBg },
  closed: { label: "Closed", color: rag.green, bg: rag.greenBg },
};

function progressColor(pct: number): string {
  return pct >= 80 ? rag.green : pct >= 40 ? rag.amber : rag.red;
}

export default function QipRegister({ centreFilter, centres, centreName }: { centreFilter: string; centres: Centre[]; centreName: (id: string) => string }) {
  const { qips } = useAppState();
  const [dialog, setDialog] = useState<{ open: boolean; existing: Qip | null }>({ open: false, existing: null });
  const [toast, setToast] = useState<string | null>(null);

  const scoped = qips.filter((q) => centreFilter === "all" || q.centreId === centreFilter || q.centreId === null);
  const today = todayIso();
  const active = scoped.filter((q) => q.status === "active").length;
  const underReview = scoped.filter((q) => q.status === "under_review").length;
  const openQips = scoped.filter((q) => q.status !== "closed");
  const avgProgress = openQips.length === 0 ? 0 : Math.round(openQips.reduce((s, q) => s + qipProgress(q), 0) / openQips.length);
  const overdue = openQips.filter((q) => q.targetOn && q.targetOn < today).length;

  const sorted = [...scoped].sort((a, b) => qipProgress(a) - qipProgress(b));

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
        <Button variant="contained" disableElevation startIcon={<AddIcon />} onClick={() => setDialog({ open: true, existing: null })}>
          New QIP
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6} md={3}>
          <StatCard label="Active QIPs" value={active} sub="in progress" accent={accent.navy} icon={TrendingUpIcon} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label="Under review" value={underReview} sub="awaiting sign-off" accent={accent.orange} icon={RateReviewIcon} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label="Avg progress" value={`${avgProgress}%`} sub="across open plans" accent={accent.purple} icon={DonutLargeIcon} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label="Targets overdue" value={overdue} sub="past target date" accent={overdue > 0 ? accent.red : accent.green} icon={EventBusyIcon} />
        </Grid>
      </Grid>

      <Paper sx={{ overflow: "hidden" }}>
        <Box sx={{ p: 2, pb: 1 }}>
          <Typography sx={{ fontWeight: 700 }}>Quality Improvement Plans</Typography>
          <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
            {scoped.length} plans · click a row to edit · improvement actions tracked to completion
          </Typography>
        </Box>
        <TableContainer sx={{ maxHeight: 520 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Plan</TableCell>
                <TableCell>Facility</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell sx={{ minWidth: 160 }}>Progress</TableCell>
                <TableCell>Target</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sorted.map((q) => {
                const pct = qipProgress(q);
                const sm = STATUS_META[q.status];
                const overdueRow = q.targetOn && q.targetOn < today && q.status !== "closed";
                return (
                  <TableRow key={q.id} hover sx={{ cursor: "pointer" }} onClick={() => setDialog({ open: true, existing: q })}>
                    <TableCell>
                      <Typography sx={{ fontSize: "0.83rem", fontWeight: 600 }}>{q.title}</Typography>
                      <Typography sx={{ fontSize: "0.7rem", color: "text.secondary" }}>{q.theme}</Typography>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap", fontSize: "0.8rem" }}>{q.centreId ? centreName(q.centreId) : "Group"}</TableCell>
                    <TableCell sx={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}>{q.owner}</TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <LinearProgress variant="determinate" value={pct} sx={{ flex: 1, height: 7, borderRadius: 4, "& .MuiLinearProgress-bar": { backgroundColor: progressColor(pct) }, backgroundColor: "action.hover" }} />
                        <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, minWidth: 34 }}>{pct}%</Typography>
                      </Box>
                      <Typography sx={{ fontSize: "0.68rem", color: "text.secondary" }}>{q.actionsDone}/{q.actionsTotal} actions</Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.78rem", whiteSpace: "nowrap", color: overdueRow ? rag.red : "text.primary", fontWeight: overdueRow ? 700 : 400 }}>
                      {q.targetOn ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Chip label={sm.label} size="small" sx={{ height: 20, fontSize: "0.66rem", fontWeight: 700, backgroundColor: sm.bg, color: sm.color }} />
                    </TableCell>
                  </TableRow>
                );
              })}
              {sorted.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography sx={{ color: "text.secondary", p: 1 }}>No quality improvement plans for this facility yet.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <QipFormDialog
        open={dialog.open}
        centres={centres}
        existing={dialog.existing}
        onClose={() => setDialog({ open: false, existing: null })}
        onSaved={(msg) => {
          setDialog({ open: false, existing: null });
          setToast(msg);
        }}
      />
      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={() => setToast(null)} severity="success" variant="filled" sx={{ width: "100%" }}>{toast}</Alert>
      </Snackbar>
    </Box>
  );
}

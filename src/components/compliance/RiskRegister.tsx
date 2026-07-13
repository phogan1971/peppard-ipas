import { useState } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import AddIcon from "@mui/icons-material/Add";
import GppMaybeIcon from "@mui/icons-material/GppMaybe";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import StatCard from "../StatCard";
import RiskFormDialog from "./RiskFormDialog";
import { BAND_COLOR, cellColor } from "./riskColors";
import { useAppState } from "../../data/store";
import { Centre, Risk, RISK_BAND_LABELS, riskBand, riskScore } from "../../data/types";
import { accent, rag } from "../../theme/tokens";
import { useSurfaces } from "../../theme";

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const STATUS_META: Record<Risk["status"], { label: string; color: string; bg: string }> = {
  open: { label: "Open", color: rag.red, bg: rag.redBg },
  monitoring: { label: "Monitoring", color: rag.amber, bg: rag.amberBg },
  closed: { label: "Closed", color: rag.green, bg: rag.greenBg },
};

export default function RiskRegister({ centreFilter, centres, centreName }: { centreFilter: string; centres: Centre[]; centreName: (id: string) => string }) {
  const surf = useSurfaces();
  const { risks } = useAppState();
  const [dialog, setDialog] = useState<{ open: boolean; existing: Risk | null }>({ open: false, existing: null });
  const [toast, setToast] = useState<string | null>(null);

  // Group-level risks (centreId null) show for every facility view.
  const scoped = risks.filter((r) => centreFilter === "all" || r.centreId === centreFilter || r.centreId === null);
  const openRisks = scoped.filter((r) => r.status !== "closed");
  const today = todayIso();
  const extreme = openRisks.filter((r) => riskBand(riskScore(r.likelihood, r.impact)) === "extreme").length;
  const high = openRisks.filter((r) => riskBand(riskScore(r.likelihood, r.impact)) === "high").length;
  const reviewsOverdue = openRisks.filter((r) => r.reviewOn && r.reviewOn < today).length;

  // Heatmap counts (open risks) keyed by `${likelihood}-${impact}`.
  const cellCount = new Map<string, number>();
  for (const r of openRisks) {
    const k = `${r.likelihood}-${r.impact}`;
    cellCount.set(k, (cellCount.get(k) ?? 0) + 1);
  }

  const sorted = [...scoped].sort((a, b) => riskScore(b.likelihood, b.impact) - riskScore(a.likelihood, a.impact));

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
        <Button variant="contained" disableElevation startIcon={<AddIcon />} onClick={() => setDialog({ open: true, existing: null })}>
          Add risk
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6} md={3}>
          <StatCard label="Open risks" value={openRisks.length} sub="on the register" accent={accent.navy} icon={GppMaybeIcon} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label="Extreme" value={extreme} sub="score ≥ 15" accent={extreme > 0 ? accent.red : accent.green} icon={PriorityHighIcon} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label="High" value={high} sub="score 8–12" accent={high > 0 ? accent.orange : accent.green} icon={WarningAmberIcon} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label="Reviews overdue" value={reviewsOverdue} sub="past review date" accent={reviewsOverdue > 0 ? accent.red : accent.green} icon={EventBusyIcon} />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {/* Heatmap */}
        <Grid item xs={12} lg={5}>
          <Paper sx={{ p: 2 }}>
            <Typography sx={{ fontWeight: 700, mb: 1.5 }}>Risk heatmap — likelihood × impact</Typography>
            <Box sx={{ display: "flex", gap: 0.75 }}>
              {/* Y axis label */}
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography sx={{ writingMode: "vertical-rl", transform: "rotate(180deg)", fontSize: "0.68rem", color: "text.secondary", fontWeight: 700 }}>
                  Likelihood →
                </Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                {[5, 4, 3, 2, 1].map((l) => (
                  <Box key={l} sx={{ display: "flex", gap: 0.5, mb: 0.5 }}>
                    {[1, 2, 3, 4, 5].map((i) => {
                      const c = cellColor(l, i);
                      const n = cellCount.get(`${l}-${i}`) ?? 0;
                      return (
                        <Box
                          key={i}
                          sx={{ flex: 1, aspectRatio: "1.6", borderRadius: 1, backgroundColor: c.bg, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${surf.border}` }}
                        >
                          {n > 0 && (
                            <Box sx={{ minWidth: 22, height: 22, borderRadius: "50%", backgroundColor: c.fg, color: "#fff", fontSize: "0.72rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {n}
                            </Box>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                ))}
                <Box sx={{ display: "flex", gap: 0.5, mt: 0.25 }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Typography key={i} sx={{ flex: 1, textAlign: "center", fontSize: "0.68rem", color: "text.secondary" }}>{i}</Typography>
                  ))}
                </Box>
                <Typography sx={{ textAlign: "center", fontSize: "0.68rem", color: "text.secondary", fontWeight: 700, mt: 0.25 }}>Impact →</Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1.5 }}>
              {(["low", "moderate", "high", "extreme"] as const).map((b) => (
                <Box key={b} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: 0.5, backgroundColor: BAND_COLOR[b].fg }} />
                  <Typography sx={{ fontSize: "0.7rem", color: "text.secondary" }}>{RISK_BAND_LABELS[b]}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Register table */}
        <Grid item xs={12} lg={7}>
          <Paper sx={{ overflow: "hidden" }}>
            <Box sx={{ p: 2, pb: 1 }}>
              <Typography sx={{ fontWeight: 700 }}>Risk register</Typography>
              <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>{scoped.length} risks · click a row to edit</Typography>
            </Box>
            <TableContainer sx={{ maxHeight: 460 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Risk</TableCell>
                    <TableCell>Facility</TableCell>
                    <TableCell align="center">Score</TableCell>
                    <TableCell>Owner</TableCell>
                    <TableCell>Review</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sorted.map((r) => {
                    const score = riskScore(r.likelihood, r.impact);
                    const band = riskBand(score);
                    const sm = STATUS_META[r.status];
                    const overdue = r.reviewOn && r.reviewOn < today && r.status !== "closed";
                    return (
                      <TableRow key={r.id} hover sx={{ cursor: "pointer" }} onClick={() => setDialog({ open: true, existing: r })}>
                        <TableCell>
                          <Typography sx={{ fontSize: "0.83rem", fontWeight: 600 }}>{r.title}</Typography>
                          <Typography sx={{ fontSize: "0.7rem", color: "text.secondary" }}>{r.category} · L{r.likelihood} × I{r.impact}</Typography>
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap", fontSize: "0.8rem" }}>{r.centreId ? centreName(r.centreId) : "Group"}</TableCell>
                        <TableCell align="center">
                          <Chip label={`${score} ${RISK_BAND_LABELS[band]}`} size="small" sx={{ height: 20, fontSize: "0.66rem", fontWeight: 700, backgroundColor: BAND_COLOR[band].fg, color: "#fff" }} />
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}>{r.owner}</TableCell>
                        <TableCell sx={{ fontSize: "0.78rem", whiteSpace: "nowrap", color: overdue ? rag.red : "text.primary", fontWeight: overdue ? 700 : 400 }}>
                          {r.reviewOn ?? "—"}
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
                        <Typography sx={{ color: "text.secondary", p: 1 }}>No risks on the register for this facility.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      <RiskFormDialog
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

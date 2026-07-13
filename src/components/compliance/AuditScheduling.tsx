import { useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import AddIcon from "@mui/icons-material/Add";
import IconButton from "@mui/material/IconButton";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { addSchedule, updateSchedule, useAppState } from "../../data/store";
import { AuditSchedule, RECURRENCE_LABELS, SchedulePriority, ScheduleRecurrence } from "../../data/types";
import { rag } from "../../theme/tokens";
import { useSurfaces } from "../../theme";

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const PRIORITY_META: Record<SchedulePriority, { label: string; color: string; bg: string }> = {
  high: { label: "High", color: rag.red, bg: rag.redBg },
  medium: { label: "Medium", color: rag.amber, bg: rag.amberBg },
  low: { label: "Low", color: rag.neutral, bg: rag.neutralBg },
};

interface Props {
  centreFilter: string;
  onConduct: (schedule: AuditSchedule) => void;
}

export default function AuditScheduling({ centreFilter, onConduct }: Props) {
  const surf = useSurfaces();
  const { schedules, auditTypes, centres } = useAppState();
  const [view, setView] = useState<"table" | "calendar">("table");
  const [statusFilter, setStatusFilter] = useState("open");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const now = new Date();
  const [calMonth, setCalMonth] = useState({ y: now.getFullYear(), m: now.getMonth() });

  const today = todayIso();
  const centreName = (id: string) => centres.find((c) => c.id === id)?.shortName ?? id;
  const typeName = (id: string) => auditTypes.find((t) => t.id === id)?.name ?? id;

  const scoped = schedules
    .filter((s) => centreFilter === "all" || s.centreId === centreFilter)
    .filter((s) => (statusFilter === "open" ? s.status === "scheduled" : statusFilter === "all" ? true : s.status === statusFilter))
    .sort((a, b) => (a.dueOn < b.dueOn ? -1 : 1));

  const [form, setForm] = useState({
    centreId: centres[0]?.id ?? "riverside",
    auditTypeId: auditTypes[0]?.id ?? "",
    dueOn: today,
    assignedTo: "",
    priority: "medium" as SchedulePriority,
    recurrence: "one_off" as ScheduleRecurrence,
    notes: "",
  });

  const openDialog = () => {
    const centreId = centreFilter !== "all" ? centreFilter : centres[0]?.id ?? "riverside";
    setForm({
      centreId,
      auditTypeId: auditTypes.find((t) => t.active)?.id ?? "",
      dueOn: today,
      assignedTo: centres.find((c) => c.id === centreId)?.manager ?? "",
      priority: "medium",
      recurrence: "one_off",
      notes: "",
    });
    setDialogOpen(true);
  };
  const save = () => {
    addSchedule({
      centreId: form.centreId,
      auditTypeId: form.auditTypeId,
      dueOn: form.dueOn,
      assignedTo: form.assignedTo.trim() || "Centre manager",
      priority: form.priority,
      recurrence: form.recurrence,
      status: "scheduled",
      notes: form.notes.trim() || null,
    });
    setDialogOpen(false);
    setToast(`Audit scheduled for ${centreName(form.centreId)} on ${form.dueOn}.`);
  };

  // ── Calendar grid (Monday-based) ───────────────────────────────────────
  const monthLabel = new Date(calMonth.y, calMonth.m, 1).toLocaleDateString("en-IE", { month: "long", year: "numeric" });
  const firstDay = new Date(calMonth.y, calMonth.m, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(calMonth.y, calMonth.m + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const isoFor = (day: number) => `${calMonth.y}-${String(calMonth.m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const calSchedules = schedules.filter((s) => centreFilter === "all" || s.centreId === centreFilter);

  const dueLabel = (s: AuditSchedule) => {
    if (s.status === "completed") return { text: "Completed", color: rag.green };
    if (s.status === "cancelled") return { text: "Cancelled", color: rag.neutral };
    const [y, m, d] = s.dueOn.split("-").map(Number);
    const [ty, tm, td] = today.split("-").map(Number);
    const diff = Math.round((new Date(y, m - 1, d).getTime() - new Date(ty, tm - 1, td).getTime()) / 86400000);
    if (diff < 0) return { text: `${-diff}d overdue`, color: rag.red };
    if (diff === 0) return { text: "Due today", color: rag.amber };
    if (diff <= 14) return { text: `due in ${diff}d`, color: rag.amber };
    return { text: `due in ${diff}d`, color: rag.green };
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 1.5 }}>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
          <TextField select size="small" label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ minWidth: 150 }}>
            <MenuItem value="open">Scheduled</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
            <MenuItem value="all">All</MenuItem>
          </TextField>
          <ToggleButtonGroup size="small" value={view} exclusive onChange={(_, v) => v && setView(v)} aria-label="Scheduling view">
            <ToggleButton value="table" sx={{ textTransform: "none", px: 1.5 }}>Table</ToggleButton>
            <ToggleButton value="calendar" sx={{ textTransform: "none", px: 1.5 }}>Calendar</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <Button variant="contained" disableElevation startIcon={<AddIcon />} onClick={openDialog}>
          Schedule audit
        </Button>
      </Box>

      {view === "table" ? (
        <Paper sx={{ overflow: "hidden" }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Audit</TableCell>
                  <TableCell>Facility</TableCell>
                  <TableCell>Due</TableCell>
                  <TableCell>Assigned to</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Recurrence</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {scoped.map((s) => {
                  const due = dueLabel(s);
                  return (
                    <TableRow key={s.id} hover>
                      <TableCell>
                        <Typography sx={{ fontSize: "0.83rem", fontWeight: 600 }}>{typeName(s.auditTypeId)}</Typography>
                        {s.notes && <Typography sx={{ fontSize: "0.7rem", color: "text.secondary" }}>{s.notes}</Typography>}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}>{centreName(s.centreId)}</TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        <Typography sx={{ fontSize: "0.8rem" }}>{s.dueOn}</Typography>
                        <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: due.color }}>{due.text}</Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.8rem" }}>{s.assignedTo}</TableCell>
                      <TableCell>
                        <Chip label={PRIORITY_META[s.priority].label} size="small" sx={{ height: 20, fontSize: "0.66rem", fontWeight: 700, backgroundColor: PRIORITY_META[s.priority].bg, color: PRIORITY_META[s.priority].color }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.8rem" }}>{RECURRENCE_LABELS[s.recurrence]}</TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        {s.status === "scheduled" && (
                          <>
                            <Button size="small" variant="outlined" onClick={() => onConduct(s)} sx={{ mr: 0.5 }}>
                              Conduct
                            </Button>
                            <Button size="small" color="inherit" onClick={() => updateSchedule(s.id, { status: "cancelled" })}>
                              Cancel
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {scoped.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Typography sx={{ color: "text.secondary", p: 1 }}>No audits in this view.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ) : (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Typography sx={{ fontWeight: 700 }}>{monthLabel}</Typography>
            <Box>
              <IconButton size="small" onClick={() => setCalMonth(({ y, m }) => (m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 }))} aria-label="Previous month">
                <ChevronLeftIcon />
              </IconButton>
              <IconButton size="small" onClick={() => setCalMonth(({ y, m }) => (m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }))} aria-label="Next month">
                <ChevronRightIcon />
              </IconButton>
            </Box>
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.5 }}>
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <Typography key={d} sx={{ fontSize: "0.7rem", fontWeight: 700, color: "text.secondary", textAlign: "center", pb: 0.5 }}>
                {d}
              </Typography>
            ))}
            {cells.map((day, i) => {
              const iso = day ? isoFor(day) : null;
              const dayItems = iso ? calSchedules.filter((s) => s.dueOn === iso) : [];
              const isToday = iso === today;
              return (
                <Box
                  key={i}
                  sx={{
                    minHeight: 76,
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: isToday ? "primary.main" : surf.border,
                    backgroundColor: day ? surf.subtleBg : "transparent",
                    p: 0.5,
                  }}
                >
                  {day && (
                    <Typography sx={{ fontSize: "0.7rem", fontWeight: isToday ? 800 : 600, color: isToday ? "primary.main" : "text.secondary" }}>
                      {day}
                    </Typography>
                  )}
                  {dayItems.map((s) => {
                    const overdue = s.status === "scheduled" && s.dueOn < today;
                    const color = s.status === "completed" ? rag.green : overdue ? rag.red : rag.amber;
                    const bg = s.status === "completed" ? rag.greenBg : overdue ? rag.redBg : rag.amberBg;
                    return (
                      <Box key={s.id} title={`${typeName(s.auditTypeId)} — ${centreName(s.centreId)}`} sx={{ fontSize: "0.62rem", fontWeight: 700, color, backgroundColor: bg, borderRadius: 0.75, px: 0.5, py: 0.25, mt: 0.25, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                        {centreName(s.centreId)} · {typeName(s.auditTypeId)}
                      </Box>
                    );
                  })}
                </Box>
              );
            })}
          </Box>
        </Paper>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule an audit</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "8px !important" }}>
          <TextField select label="Facility" value={form.centreId} onChange={(e) => setForm({ ...form, centreId: e.target.value, assignedTo: centres.find((c) => c.id === e.target.value)?.manager ?? form.assignedTo })} size="small" fullWidth>
            {centres.map((c) => (
              <MenuItem key={c.id} value={c.id}>{c.shortName}</MenuItem>
            ))}
          </TextField>
          <TextField select label="Audit type" value={form.auditTypeId} onChange={(e) => setForm({ ...form, auditTypeId: e.target.value })} size="small" fullWidth>
            {auditTypes.filter((t) => t.active).map((t) => (
              <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
            ))}
          </TextField>
          <TextField label="Due date" type="date" value={form.dueOn} onChange={(e) => setForm({ ...form, dueOn: e.target.value })} size="small" fullWidth InputLabelProps={{ shrink: true }} />
          <TextField label="Assigned to" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} size="small" fullWidth />
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField select label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as SchedulePriority })} size="small" sx={{ flex: 1 }}>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </TextField>
            <TextField select label="Recurrence" value={form.recurrence} onChange={(e) => setForm({ ...form, recurrence: e.target.value as ScheduleRecurrence })} size="small" sx={{ flex: 1 }}>
              {Object.entries(RECURRENCE_LABELS).map(([k, label]) => (
                <MenuItem key={k} value={k}>{label}</MenuItem>
              ))}
            </TextField>
          </Box>
          <TextField label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} size="small" fullWidth multiline minRows={2} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" disableElevation onClick={save} disabled={!form.auditTypeId || !form.dueOn}>
            Schedule
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={() => setToast(null)} severity="success" variant="filled" sx={{ width: "100%" }}>{toast}</Alert>
      </Snackbar>
    </Box>
  );
}

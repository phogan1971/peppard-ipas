import { useState } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
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
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import LinearProgress from "@mui/material/LinearProgress";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import AddIcon from "@mui/icons-material/Add";
import GroupsIcon from "@mui/icons-material/Groups";
import ChecklistRtlIcon from "@mui/icons-material/ChecklistRtl";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import EventRepeatIcon from "@mui/icons-material/EventRepeat";
import StatCard from "../StatCard";
import { addMeeting, useAppState } from "../../data/store";
import { MEETING_TYPE_META, MeetingType } from "../../data/types";
import { accent, rag, ragAccent } from "../../theme/tokens";

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function daysBetween(fromIso: string, toIso: string): number {
  const [fy, fm, fd] = fromIso.split("-").map(Number);
  const [ty, tm, td] = toIso.split("-").map(Number);
  return Math.round((new Date(ty, tm - 1, td).getTime() - new Date(fy, fm - 1, fd).getTime()) / 86400000);
}

export default function MeetingsPanel({ centreFilter }: { centreFilter: string }) {
  const { meetings, centres } = useAppState();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const today = todayIso();

  const centreName = (id: string) => centres.find((c) => c.id === id)?.shortName ?? id;
  const scoped = meetings
    .filter((m) => centreFilter === "all" || m.centreId === centreFilter || m.centreId === null)
    .sort((a, b) => (a.heldOn < b.heldOn ? 1 : -1));

  const last90 = scoped.filter((m) => daysBetween(m.heldOn, today) <= 90);
  const actionsTotal = scoped.reduce((s, m) => s + m.actionsTotal, 0);
  const actionsDone = scoped.reduce((s, m) => s + m.actionsDone, 0);
  const followThrough = actionsTotal === 0 ? 100 : Math.round((actionsDone / actionsTotal) * 100);
  const openActions = actionsTotal - actionsDone;

  // Cadence per meeting type: days since the type last met vs its cadence.
  const cadence = (Object.keys(MEETING_TYPE_META) as MeetingType[]).map((type) => {
    const meta = MEETING_TYPE_META[type];
    const ofType = scoped.filter((m) => m.type === type);
    const lastHeld = ofType.reduce<string | null>((acc, m) => (acc && acc > m.heldOn ? acc : m.heldOn), null);
    const age = lastHeld ? daysBetween(lastHeld, today) : null;
    const state: "ok" | "due" | "overdue" =
      age === null || age > meta.cadenceDays ? "overdue" : age > meta.cadenceDays * 0.8 ? "due" : "ok";
    const nextOn = ofType.reduce<string | null>((acc, m) => {
      if (!m.nextOn || m.nextOn < today) return acc;
      return acc && acc < m.nextOn ? acc : m.nextOn;
    }, null);
    return { type, meta, lastHeld, age, state, nextOn, count: ofType.length };
  }).filter((c) => c.count > 0 || centreFilter === "all");
  const cadenceOverdue = cadence.filter((c) => c.state === "overdue").length;

  const [form, setForm] = useState({
    title: "",
    type: "management" as MeetingType,
    centreId: "__group",
    heldOn: today,
    chair: "",
    attendees: "6",
    quorum: true,
    actionsTotal: "4",
    actionsDone: "0",
    nextOn: "",
  });
  const openDialog = () => {
    const centreId = centreFilter !== "all" ? centreFilter : "__group";
    setForm({
      title: "",
      type: centreId === "__group" ? "governance" : "management",
      centreId,
      heldOn: today,
      chair: centreId === "__group" ? "Group Executive" : centres.find((c) => c.id === centreId)?.manager ?? "",
      attendees: "6",
      quorum: true,
      actionsTotal: "4",
      actionsDone: "0",
      nextOn: "",
    });
    setDialogOpen(true);
  };
  const save = () => {
    addMeeting({
      centreId: form.centreId === "__group" ? null : form.centreId,
      title: form.title.trim(),
      type: form.type,
      heldOn: form.heldOn,
      chair: form.chair.trim() || "Chair",
      attendees: Math.max(1, Number(form.attendees) || 1),
      quorum: form.quorum,
      minutesRef: null,
      actionsTotal: Math.max(0, Number(form.actionsTotal) || 0),
      actionsDone: Math.min(Math.max(0, Number(form.actionsTotal) || 0), Math.max(0, Number(form.actionsDone) || 0)),
      nextOn: form.nextOn || null,
    });
    setDialogOpen(false);
    setToast("Meeting recorded — cadence and follow-through updated.");
  };

  const stateColor = { ok: ragAccent.green, due: ragAccent.amber, overdue: ragAccent.red } as const;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
        <Button variant="contained" disableElevation startIcon={<AddIcon />} onClick={openDialog}>
          Record meeting
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6} md={3}>
          <StatCard label="Meetings (90 days)" value={last90.length} sub="governance rhythm" accent={accent.navy} icon={GroupsIcon} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label="Action follow-through" value={`${followThrough}%`} sub={`${actionsDone} of ${actionsTotal} actions closed`} accent={followThrough >= 80 ? accent.green : accent.orange} icon={ChecklistRtlIcon} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label="Open meeting actions" value={openActions} sub="carried between meetings" accent={openActions > 6 ? accent.orange : accent.blue} icon={PendingActionsIcon} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label="Cadence overdue" value={cadenceOverdue} sub="meeting types past their rhythm" accent={cadenceOverdue > 0 ? accent.red : accent.green} icon={EventRepeatIcon} />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {cadence.map((c) => (
          <Grid item xs={12} sm={6} md={2.4} key={c.type}>
            <Paper sx={{ p: 1.5, height: "100%" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}>
                <Box sx={{ width: 9, height: 9, borderRadius: "50%", backgroundColor: stateColor[c.state], flexShrink: 0 }} />
                <Typography sx={{ fontSize: "0.78rem", fontWeight: 700 }}>{c.meta.label}</Typography>
              </Box>
              <Typography sx={{ fontSize: "0.7rem", color: "text.secondary" }}>
                every {c.meta.cadenceDays}d · {c.age === null ? "never held" : `last ${c.age}d ago`}
              </Typography>
              <Typography sx={{ fontSize: "0.7rem", color: c.state === "overdue" ? rag.red : "text.secondary", fontWeight: c.state === "overdue" ? 700 : 400 }}>
                {c.state === "overdue" ? "Overdue" : c.nextOn ? `next ${c.nextOn}` : "next not set"}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ overflow: "hidden" }}>
        <Box sx={{ p: 2, pb: 1 }}>
          <Typography sx={{ fontWeight: 700 }}>Meeting log</Typography>
        </Box>
        <TableContainer sx={{ maxHeight: 480 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Meeting</TableCell>
                <TableCell>Held</TableCell>
                <TableCell>Chair</TableCell>
                <TableCell align="center">Attendance</TableCell>
                <TableCell sx={{ minWidth: 150 }}>Actions</TableCell>
                <TableCell>Next</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {scoped.map((m) => {
                const pct = m.actionsTotal === 0 ? 100 : Math.round((m.actionsDone / m.actionsTotal) * 100);
                return (
                  <TableRow key={m.id} hover>
                    <TableCell>
                      <Typography sx={{ fontSize: "0.83rem", fontWeight: 600 }}>{m.title}</Typography>
                      <Typography sx={{ fontSize: "0.7rem", color: "text.secondary" }}>
                        {MEETING_TYPE_META[m.type].label} · {m.centreId ? centreName(m.centreId) : "Group"}
                        {m.minutesRef ? ` · minutes ${m.minutesRef}` : ""}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}>{m.heldOn}</TableCell>
                    <TableCell sx={{ fontSize: "0.8rem" }}>{m.chair}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={m.quorum ? `${m.attendees} · quorate` : `${m.attendees} · no quorum`}
                        size="small"
                        sx={{ height: 20, fontSize: "0.66rem", fontWeight: 700, backgroundColor: m.quorum ? rag.greenBg : rag.amberBg, color: m.quorum ? rag.green : rag.amber }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <LinearProgress variant="determinate" value={pct} sx={{ flex: 1, height: 6, borderRadius: 4, backgroundColor: "action.hover", "& .MuiLinearProgress-bar": { backgroundColor: pct >= 80 ? ragAccent.green : ragAccent.amber } }} />
                        <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, whiteSpace: "nowrap" }}>{m.actionsDone}/{m.actionsTotal}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.78rem", whiteSpace: "nowrap" }}>{m.nextOn ?? "—"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record a meeting</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "8px !important" }}>
          <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} size="small" fullWidth autoFocus />
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as MeetingType })} size="small" sx={{ flex: 1 }}>
              {(Object.keys(MEETING_TYPE_META) as MeetingType[]).map((t) => (
                <MenuItem key={t} value={t}>{MEETING_TYPE_META[t].label}</MenuItem>
              ))}
            </TextField>
            <TextField select label="Facility" value={form.centreId} onChange={(e) => setForm({ ...form, centreId: e.target.value })} size="small" sx={{ flex: 1 }}>
              <MenuItem value="__group">Group</MenuItem>
              {centres.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.shortName}</MenuItem>
              ))}
            </TextField>
          </Box>
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField label="Held on" type="date" value={form.heldOn} onChange={(e) => setForm({ ...form, heldOn: e.target.value })} size="small" sx={{ flex: 1 }} InputLabelProps={{ shrink: true }} />
            <TextField label="Next meeting" type="date" value={form.nextOn} onChange={(e) => setForm({ ...form, nextOn: e.target.value })} size="small" sx={{ flex: 1 }} InputLabelProps={{ shrink: true }} />
          </Box>
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField label="Chair" value={form.chair} onChange={(e) => setForm({ ...form, chair: e.target.value })} size="small" sx={{ flex: 1.5 }} />
            <TextField label="Attendees" type="number" value={form.attendees} onChange={(e) => setForm({ ...form, attendees: e.target.value })} size="small" sx={{ flex: 1 }} inputProps={{ min: 1 }} />
          </Box>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <TextField label="Actions raised" type="number" value={form.actionsTotal} onChange={(e) => setForm({ ...form, actionsTotal: e.target.value })} size="small" sx={{ flex: 1 }} inputProps={{ min: 0 }} />
            <TextField label="Actions closed" type="number" value={form.actionsDone} onChange={(e) => setForm({ ...form, actionsDone: e.target.value })} size="small" sx={{ flex: 1 }} inputProps={{ min: 0 }} />
            <FormControlLabel control={<Checkbox checked={form.quorum} onChange={(e) => setForm({ ...form, quorum: e.target.checked })} size="small" />} label="Quorate" sx={{ flex: 1, "& .MuiFormControlLabel-label": { fontSize: "0.85rem" } }} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" disableElevation onClick={save} disabled={!form.title.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={() => setToast(null)} severity="success" variant="filled" sx={{ width: "100%" }}>{toast}</Alert>
      </Snackbar>
    </Box>
  );
}

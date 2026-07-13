import { useEffect, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import { addQip, updateQip, QipInput } from "../../data/store";
import { Centre, Qip } from "../../data/types";

const THEMES = [
  "Governance (HIQA 1)",
  "Responsive workforce (HIQA 2)",
  "Fire & environmental safety",
  "Accommodation (HIQA 4)",
  "Food, catering (HIQA 5)",
  "Person-centred care (HIQA 6)",
  "Safeguarding (HIQA 8)",
  "Occupancy & inspection",
];

interface Props {
  open: boolean;
  centres: Centre[];
  existing?: Qip | null;
  onClose: () => void;
  onSaved: (title: string) => void;
}

export default function QipFormDialog({ open, centres, existing, onClose, onSaved }: Props) {
  const isEdit = !!existing;
  const [title, setTitle] = useState("");
  const [theme, setTheme] = useState(THEMES[0]);
  const [objective, setObjective] = useState("");
  const [centreId, setCentreId] = useState("__group");
  const [owner, setOwner] = useState("");
  const [status, setStatus] = useState<Qip["status"]>("active");
  const [targetOn, setTargetOn] = useState("");
  const [actionsTotal, setActionsTotal] = useState("5");
  const [actionsDone, setActionsDone] = useState("0");

  useEffect(() => {
    if (!open) return;
    setTitle(existing?.title ?? "");
    setTheme(existing?.theme ?? THEMES[0]);
    setObjective(existing?.objective ?? "");
    setCentreId(existing?.centreId ?? "__group");
    setOwner(existing?.owner ?? "");
    setStatus(existing?.status ?? "active");
    setTargetOn(existing?.targetOn ?? "");
    setActionsTotal(String(existing?.actionsTotal ?? 5));
    setActionsDone(String(existing?.actionsDone ?? 0));
  }, [open, existing]);

  const total = Math.max(0, parseInt(actionsTotal, 10) || 0);
  const done = Math.min(total, Math.max(0, parseInt(actionsDone, 10) || 0));
  const valid = title.trim() && owner.trim();

  const handleSave = () => {
    if (!valid) return;
    const input: QipInput = {
      centreId: centreId === "__group" ? null : centreId,
      title,
      theme,
      objective,
      owner,
      status,
      targetOn: targetOn || null,
      actionsTotal: total,
      actionsDone: done,
    };
    if (isEdit && existing) {
      updateQip(existing.id, input);
      onSaved(`QIP updated — "${title}".`);
    } else {
      addQip(input);
      onSaved(`QIP added — "${title}".`);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{isEdit ? "Edit QIP" : "New quality improvement plan"}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField label="Plan title" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth size="small" autoFocus placeholder="e.g. Fire safety improvement plan" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select label="Theme / domain" value={theme} onChange={(e) => setTheme(e.target.value)} fullWidth size="small">
              {THEMES.map((t) => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select label="Facility" value={centreId} onChange={(e) => setCentreId(e.target.value)} fullWidth size="small">
              <MenuItem value="__group">Group-level</MenuItem>
              {centres.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.shortName}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField label="Objective" value={objective} onChange={(e) => setObjective(e.target.value)} fullWidth size="small" multiline minRows={2} />
          </Grid>
          <Grid item xs={12} sm={5}>
            <TextField label="Owner" value={owner} onChange={(e) => setOwner(e.target.value)} fullWidth size="small" />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField label="Target date" type="date" value={targetOn} onChange={(e) => setTargetOn(e.target.value)} fullWidth size="small" InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField select label="Status" value={status} onChange={(e) => setStatus(e.target.value as Qip["status"])} fullWidth size="small">
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="under_review">Under review</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField label="Actions total" type="number" value={actionsTotal} onChange={(e) => setActionsTotal(e.target.value)} fullWidth size="small" inputProps={{ min: 0 }} />
          </Grid>
          <Grid item xs={6}>
            <TextField label="Actions complete" type="number" value={actionsDone} onChange={(e) => setActionsDone(e.target.value)} fullWidth size="small" inputProps={{ min: 0, max: total }} helperText={`${total === 0 ? 0 : Math.round((done / total) * 100)}% complete`} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disableElevation disabled={!valid} onClick={handleSave}>
          {isEdit ? "Save changes" : "Add QIP"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

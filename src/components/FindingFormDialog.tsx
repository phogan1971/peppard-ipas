import { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { addFinding } from "../data/store";
import { Centre, FindingPriority } from "../data/types";
import { rag } from "../theme/tokens";

interface Props {
  open: boolean;
  centres: Centre[];
  defaultCentreId?: string;
  onClose: () => void;
  onSaved: (summary: string) => void;
}

const PRIORITIES: { value: FindingPriority; label: string; help: string }[] = [
  { value: "RED", label: "RED — contractual breach / high risk", help: "Escalates to group executives on creation" },
  { value: "AMBER", label: "AMBER — medium risk", help: "14-day evidence clock starts on save" },
  { value: "GREEN", label: "GREEN — low operational concern", help: "Monitored; no evidence deadline" },
];

export default function FindingFormDialog({ open, centres, defaultCentreId, onClose, onSaved }: Props) {
  const [centreId, setCentreId] = useState(defaultCentreId ?? centres[0]?.id ?? "");
  const [finding, setFinding] = useState("");
  const [priority, setPriority] = useState<FindingPriority>("AMBER");
  const [action, setAction] = useState("");

  const valid = centreId && finding.trim() && action.trim();
  const priorityMeta = PRIORITIES.find((p) => p.value === priority)!;

  const handleSave = () => {
    if (!valid) return;
    addFinding({ centreId, finding, priority, actionRequired: action });
    const centre = centres.find((c) => c.id === centreId);
    onSaved(
      priority === "GREEN"
        ? `Finding raised for ${centre?.shortName} — monitored, no evidence deadline.`
        : `${priority} finding raised for ${centre?.shortName} — 14-day evidence clock started${priority === "RED" ? " and escalated to executives" : ""}.`,
    );
    setFinding("");
    setAction("");
    setPriority("AMBER");
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Raise finding</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField select label="Centre" value={centreId} onChange={(e) => setCentreId(e.target.value)} fullWidth size="small">
              {centres.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.shortName}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select label="Priority" value={priority} onChange={(e) => setPriority(e.target.value as FindingPriority)} fullWidth size="small">
              {PRIORITIES.map((p) => (
                <MenuItem key={p.value} value={p.value}>
                  {p.value}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField label="Finding" value={finding} onChange={(e) => setFinding(e.target.value)} fullWidth size="small" autoFocus placeholder="e.g. Fire drill records incomplete" />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Action required" value={action} onChange={(e) => setAction(e.target.value)} fullWidth size="small" multiline minRows={2} placeholder="Corrective action and evidence expected" />
          </Grid>
        </Grid>
        <Box sx={{ mt: 1.5, p: 1, borderRadius: 1, backgroundColor: priority === "RED" ? rag.redBg : rag.amberBg }}>
          <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>{priorityMeta.help}</Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disableElevation disabled={!valid} onClick={handleSave}>
          Raise finding
        </Button>
      </DialogActions>
    </Dialog>
  );
}

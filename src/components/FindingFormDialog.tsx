import { useEffect, useState } from "react";
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
import { addFinding, updateFinding, FindingInput } from "../data/store";
import { STANDARDS } from "../data/seed";
import { Centre, Finding, FindingPriority, FindingSource, FINDING_SOURCES } from "../data/types";
import { rag } from "../theme/tokens";

interface Props {
  open: boolean;
  centres: Centre[];
  existing?: Finding | null;
  defaultCentreId?: string;
  onClose: () => void;
  onSaved: (summary: string) => void;
}

// "UNMARKED" mirrors the real report's unchecked RAG boxes — two Riverside
// findings carry no grade, and editing them must not force one on.
type PriorityChoice = FindingPriority | "UNMARKED";

const PRIORITIES: { value: PriorityChoice; help: string }[] = [
  { value: "RED", help: "Contractual breach / high risk — escalates to executives on creation" },
  { value: "AMBER", help: "Medium risk — 14-day evidence clock applies" },
  { value: "GREEN", help: "Low operational concern — monitored, no evidence deadline" },
  { value: "UNMARKED", help: "No RAG grade recorded — as on the source report; evidence clock still applies if a window is set" },
];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function FindingFormDialog({ open, centres, existing, defaultCentreId, onClose, onSaved }: Props) {
  const isEdit = !!existing;
  const [centreId, setCentreId] = useState("");
  const [source, setSource] = useState<FindingSource>("IPPS inspection");
  const [section, setSection] = useState("6. Summary Details");
  const [hiqaStandard, setHiqaStandard] = useState<string>("");
  const [finding, setFinding] = useState("");
  const [priority, setPriority] = useState<PriorityChoice>("AMBER");
  const [action, setAction] = useState("");
  const [raisedOn, setRaisedOn] = useState(todayIso());
  const [dueDays, setDueDays] = useState("14");

  // Re-sync fields whenever the dialog opens or the target finding changes.
  useEffect(() => {
    if (!open) return;
    setCentreId(existing?.centreId ?? defaultCentreId ?? centres[0]?.id ?? "");
    setSource(existing?.source ?? (existing?.centreId === "riverside" ? "IPPS inspection" : "Internal audit"));
    setSection(existing?.section ?? "6. Summary Details");
    setHiqaStandard(existing?.hiqaStandard ?? "");
    setFinding(existing?.finding ?? "");
    setPriority(existing ? (existing.priority ?? "UNMARKED") : "AMBER");
    setAction(existing?.actionRequired ?? "");
    setRaisedOn(existing?.raisedOn ?? todayIso());
    setDueDays(existing?.evidenceDueDays != null ? String(existing.evidenceDueDays) : "14");
  }, [open, existing, defaultCentreId, centres]);

  const isGreen = priority === "GREEN";
  const valid = centreId && finding.trim() && action.trim() && raisedOn;
  const priorityMeta = PRIORITIES.find((p) => p.value === priority)!;

  const handleSave = () => {
    if (!valid) return;
    const input: FindingInput = {
      centreId,
      source,
      section,
      hiqaStandard: hiqaStandard || null,
      finding,
      priority: priority === "UNMARKED" ? null : priority,
      actionRequired: action,
      raisedOn,
      evidenceDueDays: isGreen ? null : parseInt(dueDays, 10) || 14,
    };
    const centre = centres.find((c) => c.id === centreId);
    if (isEdit && existing) {
      updateFinding(existing.id, input);
      onSaved(`Finding updated for ${centre?.shortName} — evidence clock re-applied.`);
    } else {
      addFinding(input);
      onSaved(
        isGreen
          ? `Finding raised for ${centre?.shortName} — monitored, no evidence deadline.`
          : priority === "UNMARKED"
            ? `Finding raised for ${centre?.shortName} (ungraded) — evidence clock started.`
            : `${priority} finding raised for ${centre?.shortName} — 14-day evidence clock started${priority === "RED" ? " and escalated to executives" : ""}.`,
      );
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{isEdit ? "Edit finding" : "Raise finding"}</DialogTitle>
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
            <TextField select label="Source" value={source} onChange={(e) => setSource(e.target.value as FindingSource)} fullWidth size="small">
              {FINDING_SOURCES.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField label="Finding" value={finding} onChange={(e) => setFinding(e.target.value)} fullWidth size="small" placeholder="e.g. Mould/Damp" />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Action required" value={action} onChange={(e) => setAction(e.target.value)} fullWidth size="small" multiline minRows={2} placeholder="Corrective action and evidence expected" />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField select label="Priority" value={priority} onChange={(e) => setPriority(e.target.value as PriorityChoice)} fullWidth size="small">
              {PRIORITIES.map((p) => (
                <MenuItem key={p.value} value={p.value}>
                  {p.value}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField label="IPPS section" value={section} onChange={(e) => setSection(e.target.value)} fullWidth size="small" />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField select label="HIQA standard" value={hiqaStandard} onChange={(e) => setHiqaStandard(e.target.value)} fullWidth size="small">
              <MenuItem value="">— none —</MenuItem>
              {STANDARDS.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.id} — {s.themeName}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField label="Raised on" type="date" value={raisedOn} onChange={(e) => setRaisedOn(e.target.value)} fullWidth size="small" InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Evidence due (days)"
              type="number"
              value={isGreen ? "" : dueDays}
              onChange={(e) => setDueDays(e.target.value)}
              fullWidth
              size="small"
              disabled={isGreen}
              helperText={isGreen ? "No deadline for GREEN" : undefined}
              inputProps={{ min: 1, step: 1 }}
            />
          </Grid>
        </Grid>
        <Box
          sx={{
            mt: 1.5,
            p: 1,
            borderRadius: 1,
            backgroundColor:
              priority === "RED" ? rag.redBg : priority === "AMBER" ? rag.amberBg : priority === "GREEN" ? rag.greenBg : rag.neutralBg,
          }}
        >
          <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>{priorityMeta.help}</Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disableElevation disabled={!valid} onClick={handleSave}>
          {isEdit ? "Save changes" : "Raise finding"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

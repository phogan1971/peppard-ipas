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
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { addRisk, updateRisk, RiskInput } from "../../data/store";
import {
  Centre,
  Risk,
  RiskScale,
  RISK_IMPACT_LABELS,
  RISK_LIKELIHOOD_LABELS,
  RISK_BAND_LABELS,
  riskBand,
  riskScore,
} from "../../data/types";
import { BAND_COLOR } from "./riskColors";

const CATEGORIES = ["Accommodation", "Fire safety", "Food, catering", "Safeguarding", "Safety & security", "Governance", "Occupancy", "Other"];

interface Props {
  open: boolean;
  centres: Centre[];
  existing?: Risk | null;
  onClose: () => void;
  onSaved: (title: string) => void;
}

export default function RiskFormDialog({ open, centres, existing, onClose, onSaved }: Props) {
  const isEdit = !!existing;
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Accommodation");
  const [centreId, setCentreId] = useState<string>("__group");
  const [likelihood, setLikelihood] = useState<RiskScale>(3);
  const [impact, setImpact] = useState<RiskScale>(3);
  const [controls, setControls] = useState("");
  const [owner, setOwner] = useState("");
  const [reviewOn, setReviewOn] = useState("");
  const [status, setStatus] = useState<Risk["status"]>("open");

  useEffect(() => {
    if (!open) return;
    setTitle(existing?.title ?? "");
    setCategory(existing?.category ?? "Accommodation");
    setCentreId(existing?.centreId ?? "__group");
    setLikelihood((existing?.likelihood as RiskScale) ?? 3);
    setImpact((existing?.impact as RiskScale) ?? 3);
    setControls(existing?.controls ?? "");
    setOwner(existing?.owner ?? "");
    setReviewOn(existing?.reviewOn ?? "");
    setStatus(existing?.status ?? "open");
  }, [open, existing]);

  const score = riskScore(likelihood, impact);
  const band = riskBand(score);
  const valid = title.trim() && owner.trim();

  const handleSave = () => {
    if (!valid) return;
    const input: RiskInput = {
      centreId: centreId === "__group" ? null : centreId,
      title,
      category,
      likelihood,
      impact,
      controls,
      owner,
      reviewOn: reviewOn || null,
      status,
    };
    if (isEdit && existing) {
      updateRisk(existing.id, input);
      onSaved(`Risk updated — "${title}".`);
    } else {
      addRisk(input);
      onSaved(`Risk added — "${title}" (${RISK_BAND_LABELS[band]}).`);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{isEdit ? "Edit risk" : "Add risk"}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField label="Risk" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth size="small" autoFocus placeholder="e.g. Over-occupancy against the 4.65 m² standard" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select label="Category" value={category} onChange={(e) => setCategory(e.target.value)} fullWidth size="small">
              {CATEGORIES.map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
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
          <Grid item xs={6}>
            <TextField select label="Likelihood" value={likelihood} onChange={(e) => setLikelihood(Number(e.target.value) as RiskScale)} fullWidth size="small">
              {[1, 2, 3, 4, 5].map((n) => (
                <MenuItem key={n} value={n}>{n} — {RISK_LIKELIHOOD_LABELS[n]}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField select label="Impact" value={impact} onChange={(e) => setImpact(Number(e.target.value) as RiskScale)} fullWidth size="small">
              {[1, 2, 3, 4, 5].map((n) => (
                <MenuItem key={n} value={n}>{n} — {RISK_IMPACT_LABELS[n]}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField label="Existing controls" value={controls} onChange={(e) => setControls(e.target.value)} fullWidth size="small" multiline minRows={2} />
          </Grid>
          <Grid item xs={12} sm={5}>
            <TextField label="Owner" value={owner} onChange={(e) => setOwner(e.target.value)} fullWidth size="small" />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField label="Review date" type="date" value={reviewOn} onChange={(e) => setReviewOn(e.target.value)} fullWidth size="small" InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField select label="Status" value={status} onChange={(e) => setStatus(e.target.value as Risk["status"])} fullWidth size="small">
              <MenuItem value="open">Open</MenuItem>
              <MenuItem value="monitoring">Monitoring</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
            </TextField>
          </Grid>
        </Grid>
        <Box sx={{ mt: 2, p: 1.25, borderRadius: 1, backgroundColor: BAND_COLOR[band].bg, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>Risk score</Typography>
          <Typography sx={{ fontSize: "1.4rem", fontWeight: 800, color: BAND_COLOR[band].fg }}>{score}</Typography>
          <Chip label={RISK_BAND_LABELS[band]} size="small" sx={{ fontWeight: 700, backgroundColor: BAND_COLOR[band].fg, color: "#fff" }} />
          <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>likelihood {likelihood} × impact {impact}</Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disableElevation disabled={!valid} onClick={handleSave}>
          {isEdit ? "Save changes" : "Add risk"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

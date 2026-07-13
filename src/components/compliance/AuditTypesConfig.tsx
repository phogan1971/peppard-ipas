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
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import AddIcon from "@mui/icons-material/Add";
import { saveAuditType, setAuditTypeActive, useAppState } from "../../data/store";
import { AuditType } from "../../data/types";
import { rag } from "../../theme/tokens";

const CATEGORIES = [
  "Department returns",
  "Fire safety",
  "Food & catering",
  "Safeguarding",
  "Accommodation",
  "Resident services",
  "Health & safety",
  "Governance",
];

interface FormState {
  name: string;
  description: string;
  category: string;
  sourceStandard: string;
  targetPct: string;
}

const emptyForm: FormState = { name: "", description: "", category: CATEGORIES[0], sourceStandard: "", targetPct: "90" };

export default function AuditTypesConfig({ onOpenTab }: { onOpenTab: (tab: string) => void }) {
  const { auditTypes } = useAppState();
  const [dialog, setDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [form, setForm] = useState<FormState>(emptyForm);
  const [toast, setToast] = useState<string | null>(null);

  const openAdd = () => {
    setForm(emptyForm);
    setDialog({ open: true, id: null });
  };
  const openEdit = (t: AuditType) => {
    setForm({ name: t.name, description: t.description, category: t.category, sourceStandard: t.sourceStandard, targetPct: String(t.targetPct) });
    setDialog({ open: true, id: t.id });
  };
  const save = () => {
    const existing = dialog.id ? auditTypes.find((t) => t.id === dialog.id) : null;
    saveAuditType(
      {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category,
        sourceStandard: form.sourceStandard.trim(),
        targetPct: Math.min(100, Math.max(0, Number(form.targetPct) || 90)),
        active: existing?.active ?? true,
      },
      dialog.id ?? undefined,
    );
    setDialog({ open: false, id: null });
    setToast(dialog.id ? "Audit type updated." : "Audit type added — build its checklist in the Checklists tab.");
  };

  const sorted = [...auditTypes].sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name));

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1, flexWrap: "wrap", mb: 1 }}>
        <Typography sx={{ fontSize: "0.85rem", color: "text.secondary", maxWidth: 640 }}>
          The audit programme's configuration — each type carries its dual-axis reference (IPPS § · HIQA standard), a
          target compliance score and a published checklist run in the Conduct tab.
        </Typography>
        <Button variant="contained" disableElevation startIcon={<AddIcon />} onClick={openAdd}>
          New audit type
        </Button>
      </Box>

      <Paper sx={{ overflow: "hidden" }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Audit type</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Regulatory reference</TableCell>
                <TableCell align="right">Target</TableCell>
                <TableCell align="right">Checklist</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {sorted.map((t) => (
                <TableRow key={t.id} hover sx={{ opacity: t.active ? 1 : 0.55 }}>
                  <TableCell sx={{ cursor: "pointer" }} onClick={() => openEdit(t)}>
                    <Typography sx={{ fontSize: "0.83rem", fontWeight: 600 }}>{t.name}</Typography>
                    <Typography sx={{ fontSize: "0.7rem", color: "text.secondary" }}>{t.description}</Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}>{t.category}</TableCell>
                  <TableCell sx={{ fontSize: "0.78rem", whiteSpace: "nowrap" }}>{t.sourceStandard}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>{t.targetPct}%</TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => onOpenTab("checklists")} sx={{ px: 0.5, textTransform: "none" }}>
                      {t.checklist.length} items · v{t.checklistVersion}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={t.active ? "Active" : "Archived"}
                      size="small"
                      sx={{ height: 20, fontSize: "0.66rem", fontWeight: 700, backgroundColor: t.active ? rag.greenBg : "action.hover", color: t.active ? rag.green : "text.secondary" }}
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    <Button size="small" onClick={() => setAuditTypeActive(t.id, !t.active)}>
                      {t.active ? "Archive" : "Restore"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={dialog.open} onClose={() => setDialog({ open: false, id: null })} maxWidth="sm" fullWidth>
        <DialogTitle>{dialog.id ? "Edit audit type" : "New audit type"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "8px !important" }}>
          <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} size="small" fullWidth autoFocus />
          <TextField label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} size="small" fullWidth multiline minRows={2} />
          <TextField select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} size="small" fullWidth>
            {CATEGORIES.map((c) => (
              <MenuItem key={c} value={c}>{c}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Regulatory reference"
            value={form.sourceStandard}
            onChange={(e) => setForm({ ...form, sourceStandard: e.target.value })}
            size="small"
            fullWidth
            placeholder="e.g. IPPS §2.3 · HIQA 3.1"
            helperText="Dual-axis reference: the IPPS report section and HIQA National Standard this audit evidences"
          />
          <TextField label="Target compliance %" value={form.targetPct} onChange={(e) => setForm({ ...form, targetPct: e.target.value })} size="small" type="number" inputProps={{ min: 0, max: 100 }} sx={{ maxWidth: 200 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog({ open: false, id: null })}>Cancel</Button>
          <Button variant="contained" disableElevation onClick={save} disabled={!form.name.trim()}>
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

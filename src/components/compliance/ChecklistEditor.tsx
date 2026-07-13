import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Checkbox from "@mui/material/Checkbox";
import IconButton from "@mui/material/IconButton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import { saveChecklist, useAppState } from "../../data/store";
import { ChecklistItem } from "../../data/types";
import { rag } from "../../theme/tokens";

export default function ChecklistEditor() {
  const { auditTypes } = useAppState();
  const active = auditTypes.filter((t) => t.active);
  const [typeId, setTypeId] = useState(active[0]?.id ?? "");
  const type = auditTypes.find((t) => t.id === typeId) ?? active[0];

  const [items, setItems] = useState<ChecklistItem[]>(type?.checklist ?? []);
  const [dirty, setDirty] = useState(false);
  const [newItem, setNewItem] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  // Re-sync the working copy when the selected type (or its stored
  // checklist) changes underneath the editor.
  useEffect(() => {
    setItems(type?.checklist ?? []);
    setDirty(false);
    setNewItem("");
  }, [type?.id, type?.checklistVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!type) {
    return <Typography sx={{ color: "text.secondary" }}>No active audit types — add one in the Audit types tab.</Typography>;
  }

  const update = (next: ChecklistItem[]) => {
    setItems(next);
    setDirty(true);
  };
  const addItem = () => {
    const text = newItem.trim();
    if (!text) return;
    update([...items, { id: `${type.id}-q${Date.now()}`, text, critical: false }]);
    setNewItem("");
  };
  const publish = () => {
    saveChecklist(type.id, items);
    setDirty(false);
    setToast(`Checklist published as v${type.checklistVersion + 1} — Conduct now runs this version.`);
  };

  const criticalCount = items.filter((i) => i.critical).length;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 2, flexWrap: "wrap", mb: 2 }}>
        <TextField select label="Audit type" value={type.id} onChange={(e) => setTypeId(e.target.value)} size="small" sx={{ minWidth: 320 }}>
          {active.map((t) => (
            <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
          ))}
        </TextField>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Chip label={`v${type.checklistVersion} published`} size="small" sx={{ height: 22, fontSize: "0.7rem", fontWeight: 700, backgroundColor: rag.greenBg, color: rag.green }} />
          {dirty && <Chip label="Unsaved changes" size="small" sx={{ height: 22, fontSize: "0.7rem", fontWeight: 700, backgroundColor: rag.amberBg, color: rag.amber }} />}
          <Button variant="contained" disableElevation onClick={publish} disabled={!dirty || items.length === 0}>
            Publish v{type.checklistVersion + 1}
          </Button>
        </Box>
      </Box>

      <Paper sx={{ overflow: "hidden" }}>
        <Box sx={{ p: 2, pb: 1 }}>
          <Typography sx={{ fontWeight: 700 }}>{type.name}</Typography>
          <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
            {items.length} items · {criticalCount} critical · {type.sourceStandard} — a critical item marked "Not compliant"
            during Conduct auto-raises an AMBER finding on the 14-day clock.
          </Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 40 }}>#</TableCell>
                <TableCell>Checklist item</TableCell>
                <TableCell align="center" sx={{ width: 90 }}>Critical</TableCell>
                <TableCell align="right" sx={{ width: 60 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item, idx) => (
                <TableRow key={item.id} hover>
                  <TableCell sx={{ color: "text.secondary" }}>{idx + 1}</TableCell>
                  <TableCell>
                    <TextField
                      value={item.text}
                      onChange={(e) => update(items.map((i) => (i.id === item.id ? { ...i, text: e.target.value } : i)))}
                      size="small"
                      fullWidth
                      variant="standard"
                      InputProps={{ disableUnderline: true, sx: { fontSize: "0.85rem" } }}
                      aria-label={`Checklist item ${idx + 1}`}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Checkbox
                      checked={item.critical}
                      onChange={(e) => update(items.map((i) => (i.id === item.id ? { ...i, critical: e.target.checked } : i)))}
                      size="small"
                      inputProps={{ "aria-label": `Mark item ${idx + 1} critical` }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => update(items.filter((i) => i.id !== item.id))} aria-label={`Remove item ${idx + 1}`}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell />
                <TableCell colSpan={3}>
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                    <TextField
                      value={newItem}
                      onChange={(e) => setNewItem(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addItem();
                      }}
                      size="small"
                      fullWidth
                      placeholder="Add a checklist item…"
                    />
                    <Button startIcon={<AddIcon />} onClick={addItem} disabled={!newItem.trim()}>
                      Add
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Snackbar open={!!toast} autoHideDuration={4500} onClose={() => setToast(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={() => setToast(null)} severity="success" variant="filled" sx={{ width: "100%" }}>{toast}</Alert>
      </Snackbar>
    </Box>
  );
}

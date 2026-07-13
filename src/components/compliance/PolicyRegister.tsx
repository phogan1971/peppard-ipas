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
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import AddIcon from "@mui/icons-material/Add";
import PolicyIcon from "@mui/icons-material/Policy";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import UpdateIcon from "@mui/icons-material/Update";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import StatCard from "../StatCard";
import { addPolicy, markPolicyReviewed, updatePolicy, useAppState } from "../../data/store";
import { Policy, PolicyStatus, policyStatusFor } from "../../data/types";
import { accent, rag } from "../../theme/tokens";

const CATEGORIES = ["Safeguarding", "Fire & safety", "Operations", "HR", "Governance"];

const STATUS_META: Record<PolicyStatus, { label: string; color: string; bg: string }> = {
  current: { label: "Current", color: rag.green, bg: rag.greenBg },
  due_soon: { label: "Due soon", color: rag.amber, bg: rag.amberBg },
  overdue: { label: "Overdue", color: rag.red, bg: rag.redBg },
};

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function PolicyRegister() {
  const { policies } = useAppState();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialog, setDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [form, setForm] = useState({ name: "", category: CATEGORIES[0], owner: "", version: "v1.0", lastReviewed: todayIso(), docRef: "" });
  const [toast, setToast] = useState<string | null>(null);

  const today = todayIso();
  const withStatus = policies.map((p) => ({ policy: p, status: policyStatusFor(p, today) }));
  const overdue = withStatus.filter((x) => x.status === "overdue").length;
  const dueSoon = withStatus.filter((x) => x.status === "due_soon").length;
  const current = withStatus.filter((x) => x.status === "current").length;

  const rows = withStatus
    .filter((x) => categoryFilter === "all" || x.policy.category === categoryFilter)
    .filter((x) => statusFilter === "all" || x.status === statusFilter)
    .filter((x) => !search.trim() || x.policy.name.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => (a.policy.nextReviewDue < b.policy.nextReviewDue ? -1 : 1));

  const openAdd = () => {
    setForm({ name: "", category: CATEGORIES[0], owner: "", version: "v1.0", lastReviewed: today, docRef: "" });
    setDialog({ open: true, id: null });
  };
  const openEdit = (p: Policy) => {
    setForm({ name: p.name, category: p.category, owner: p.owner, version: p.version, lastReviewed: p.lastReviewed, docRef: p.docRef ?? "" });
    setDialog({ open: true, id: p.id });
  };
  const save = () => {
    const input = {
      name: form.name.trim(),
      category: form.category,
      owner: form.owner.trim() || "Group Operations",
      version: form.version.trim() || "v1.0",
      reviewCycleDays: 365,
      lastReviewed: form.lastReviewed,
      docRef: form.docRef.trim() || null,
    };
    if (dialog.id) updatePolicy(dialog.id, input);
    else addPolicy(input);
    setDialog({ open: false, id: null });
    setToast(dialog.id ? "Policy updated." : "Policy added to the group suite.");
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1, flexWrap: "wrap", mb: 1 }}>
        <Typography sx={{ fontSize: "0.85rem", color: "text.secondary", maxWidth: 620 }}>
          The uniform group policy suite — one set of policies applied across all eight centres on an annual review
          cycle. "Mark reviewed" stamps today, restarts the cycle and bumps the version.
        </Typography>
        <Button variant="contained" disableElevation startIcon={<AddIcon />} onClick={openAdd}>
          Add policy
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6} md={3}>
          <StatCard label="Policies" value={policies.length} sub="group suite" accent={accent.navy} icon={PolicyIcon} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label="Current" value={current} sub="inside review cycle" accent={accent.green} icon={TaskAltIcon} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label="Due soon" value={dueSoon} sub="review due within 90 days" accent={dueSoon > 0 ? accent.orange : accent.green} icon={UpdateIcon} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label="Overdue" value={overdue} sub="past review date" accent={overdue > 0 ? accent.red : accent.green} icon={EventBusyIcon} />
        </Grid>
      </Grid>

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1.5 }}>
        <TextField size="small" label="Search" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 200 }} />
        <TextField select size="small" label="Category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} sx={{ minWidth: 150 }}>
          <MenuItem value="all">All</MenuItem>
          {CATEGORIES.map((c) => (
            <MenuItem key={c} value={c}>{c}</MenuItem>
          ))}
        </TextField>
        <TextField select size="small" label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ minWidth: 140 }}>
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="overdue">Overdue</MenuItem>
          <MenuItem value="due_soon">Due soon</MenuItem>
          <MenuItem value="current">Current</MenuItem>
        </TextField>
      </Box>

      <Paper sx={{ overflow: "hidden" }}>
        <TableContainer sx={{ maxHeight: 520 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Policy</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell>Version</TableCell>
                <TableCell>Last reviewed</TableCell>
                <TableCell>Next review</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(({ policy: p, status }) => {
                const sm = STATUS_META[status];
                return (
                  <TableRow key={p.id} hover>
                    <TableCell sx={{ cursor: "pointer" }} onClick={() => openEdit(p)}>
                      <Typography sx={{ fontSize: "0.83rem", fontWeight: 600 }}>{p.name}</Typography>
                      {p.docRef && <Typography sx={{ fontSize: "0.68rem", color: "text.secondary" }}>{p.docRef}</Typography>}
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}>{p.category}</TableCell>
                    <TableCell sx={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}>{p.owner}</TableCell>
                    <TableCell sx={{ fontSize: "0.8rem" }}>{p.version}</TableCell>
                    <TableCell sx={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}>{p.lastReviewed}</TableCell>
                    <TableCell sx={{ fontSize: "0.8rem", whiteSpace: "nowrap", color: status === "overdue" ? rag.red : "text.primary", fontWeight: status === "overdue" ? 700 : 400 }}>
                      {p.nextReviewDue}
                    </TableCell>
                    <TableCell>
                      <Chip label={sm.label} size="small" sx={{ height: 20, fontSize: "0.66rem", fontWeight: 700, backgroundColor: sm.bg, color: sm.color }} />
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                      <Button
                        size="small"
                        variant={status === "current" ? "text" : "outlined"}
                        onClick={() => {
                          markPolicyReviewed(p.id);
                          setToast(`${p.name} marked reviewed — next review in 12 months.`);
                        }}
                      >
                        Mark reviewed
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Typography sx={{ color: "text.secondary", p: 1 }}>No policies match this view.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={dialog.open} onClose={() => setDialog({ open: false, id: null })} maxWidth="sm" fullWidth>
        <DialogTitle>{dialog.id ? "Edit policy" : "Add policy"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "8px !important" }}>
          <TextField label="Policy name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} size="small" fullWidth autoFocus />
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} size="small" sx={{ flex: 1 }}>
              {CATEGORIES.map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </TextField>
            <TextField label="Owner" value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} size="small" sx={{ flex: 1 }} />
          </Box>
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField label="Version" value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} size="small" sx={{ flex: 1 }} />
            <TextField label="Last reviewed" type="date" value={form.lastReviewed} onChange={(e) => setForm({ ...form, lastReviewed: e.target.value })} size="small" sx={{ flex: 1 }} InputLabelProps={{ shrink: true }} />
          </Box>
          <TextField label="Document reference" value={form.docRef} onChange={(e) => setForm({ ...form, docRef: e.target.value })} size="small" fullWidth placeholder="e.g. POL-013" />
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

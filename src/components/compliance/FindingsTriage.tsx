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
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { daysUntilDue, isOverdue, triageFinding, useAppState } from "../../data/store";
import { Finding, TRIAGE_PATHWAY_LABELS, TriagePathway } from "../../data/types";
import { rag } from "../../theme/tokens";

const PRIORITY_META: Record<string, { color: string; bg: string }> = {
  RED: { color: rag.red, bg: rag.redBg },
  AMBER: { color: rag.amber, bg: rag.amberBg },
  GREEN: { color: rag.green, bg: rag.greenBg },
  UNMARKED: { color: rag.neutral, bg: rag.neutralBg },
};

const STATUS_LABELS: Record<Finding["status"], string> = {
  open: "Open",
  evidence_submitted: "Evidence submitted",
  closed: "Closed",
};

export default function FindingsTriage({ centreFilter }: { centreFilter: string }) {
  const { findings, centres } = useAppState();
  const [statusFilter, setStatusFilter] = useState("open");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [triage, setTriage] = useState<Finding | null>(null);
  const [pathway, setPathway] = useState<TriagePathway>("corrective_action");
  const [rationale, setRationale] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const centreName = (id: string) => centres.find((c) => c.id === id)?.shortName ?? id;

  const scoped = findings
    .filter((f) => centreFilter === "all" || f.centreId === centreFilter)
    .filter((f) => (statusFilter === "open" ? f.status !== "closed" : statusFilter === "all" ? true : f.status === statusFilter))
    .filter((f) => priorityFilter === "all" || (f.priority ?? "UNMARKED") === priorityFilter)
    .filter((f) => {
      const q = search.trim().toLowerCase();
      return !q || f.finding.toLowerCase().includes(q) || f.actionRequired.toLowerCase().includes(q);
    })
    .sort((a, b) => (a.raisedOn < b.raisedOn ? 1 : -1));

  const openTriage = (f: Finding) => {
    setPathway(f.triagePathway ?? "corrective_action");
    setRationale(f.triageNote ?? "");
    setTriage(f);
  };
  const applyTriage = () => {
    if (!triage) return;
    const { linkedTo } = triageFinding(triage.id, pathway, rationale);
    setTriage(null);
    setToast(
      linkedTo
        ? `Finding routed to the ${linkedTo} — a linked entry was created and the cockpit updated.`
        : `Triage recorded — ${TRIAGE_PATHWAY_LABELS[pathway]}.`,
    );
  };

  return (
    <Box>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1.5 }}>
        <TextField select size="small" label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ minWidth: 150 }}>
          <MenuItem value="open">Open (incl. evidence submitted)</MenuItem>
          <MenuItem value="evidence_submitted">Evidence submitted</MenuItem>
          <MenuItem value="closed">Closed</MenuItem>
          <MenuItem value="all">All</MenuItem>
        </TextField>
        <TextField select size="small" label="Priority" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} sx={{ minWidth: 130 }}>
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="RED">RED</MenuItem>
          <MenuItem value="AMBER">AMBER</MenuItem>
          <MenuItem value="GREEN">GREEN</MenuItem>
          <MenuItem value="UNMARKED">Ungraded</MenuItem>
        </TextField>
        <TextField size="small" label="Search" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 200 }} />
      </Box>

      <Paper sx={{ overflow: "hidden" }}>
        <Box sx={{ p: 2, pb: 1 }}>
          <Typography sx={{ fontWeight: 700 }}>Findings register</Typography>
          <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
            {scoped.length} findings · triage routes each down a governance pathway — CAPA, risk register, QIP or monitor.
            Raise and edit findings in Findings &amp; Actions.
          </Typography>
        </Box>
        <TableContainer sx={{ maxHeight: 560 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Finding</TableCell>
                <TableCell>Facility</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Evidence clock</TableCell>
                <TableCell>Pathway</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {scoped.map((f) => {
                const pm = PRIORITY_META[f.priority ?? "UNMARKED"];
                const days = daysUntilDue(f);
                const overdue = isOverdue(f);
                return (
                  <TableRow key={f.id} hover>
                    <TableCell>
                      <Typography sx={{ fontSize: "0.83rem", fontWeight: 600 }}>{f.finding}</Typography>
                      <Typography sx={{ fontSize: "0.7rem", color: "text.secondary" }}>
                        {f.source ?? "—"} · §{f.section}{f.hiqaStandard ? ` · HIQA ${f.hiqaStandard}` : ""} · raised {f.raisedOn}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}>{centreName(f.centreId)}</TableCell>
                    <TableCell>
                      <Chip label={f.priority ?? "UNMARKED"} size="small" sx={{ height: 20, fontSize: "0.66rem", fontWeight: 700, backgroundColor: pm.bg, color: pm.color }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.78rem", whiteSpace: "nowrap" }}>{STATUS_LABELS[f.status]}</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {f.status === "closed" || days === null ? (
                        <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>—</Typography>
                      ) : (
                        <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: overdue ? rag.red : days <= 3 ? rag.amber : rag.green }}>
                          {overdue ? `${-days}d overdue` : `${days}d remaining`}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {f.triagePathway ? (
                        <Chip
                          label={TRIAGE_PATHWAY_LABELS[f.triagePathway]}
                          size="small"
                          sx={{ height: 20, fontSize: "0.64rem", fontWeight: 700, backgroundColor: "action.hover", color: "text.secondary" }}
                        />
                      ) : (
                        <Typography sx={{ fontSize: "0.74rem", color: "text.secondary" }}>Not triaged</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" variant={f.triagePathway ? "text" : "outlined"} onClick={() => openTriage(f)}>
                        {f.triagePathway ? "Re-triage" : "Triage"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {scoped.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Typography sx={{ color: "text.secondary", p: 1 }}>No findings in this view.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={!!triage} onClose={() => setTriage(null)} maxWidth="sm" fullWidth>
        {triage && (
          <>
            <DialogTitle>
              Triage — {triage.finding}
              <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
                {centreName(triage.centreId)} · {triage.priority ?? "Ungraded"} · raised {triage.raisedOn}
              </Typography>
            </DialogTitle>
            <DialogContent sx={{ pt: "8px !important" }}>
              <RadioGroup value={pathway} onChange={(e) => setPathway(e.target.value as TriagePathway)}>
                <FormControlLabel value="corrective_action" control={<Radio size="small" />} label={
                  <Box>
                    <Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>Corrective action (CAPA)</Typography>
                    <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>Handled in the 14-day evidence loop — no escalation needed.</Typography>
                  </Box>
                } sx={{ mb: 0.75, alignItems: "flex-start" }} />
                <FormControlLabel value="risk_register" control={<Radio size="small" />} label={
                  <Box>
                    <Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>Escalate to risk register</Typography>
                    <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>Creates a linked risk owned by the centre manager, reviewed in 30 days.</Typography>
                  </Box>
                } sx={{ mb: 0.75, alignItems: "flex-start" }} />
                <FormControlLabel value="qip_candidate" control={<Radio size="small" />} label={
                  <Box>
                    <Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>QIP candidate</Typography>
                    <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>Creates a linked quality improvement plan with a 30-day target.</Typography>
                  </Box>
                } sx={{ mb: 0.75, alignItems: "flex-start" }} />
                <FormControlLabel value="monitor" control={<Radio size="small" />} label={
                  <Box>
                    <Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>Monitor — no action</Typography>
                    <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>Noted for the next internal audit; no corrective loop.</Typography>
                  </Box>
                } sx={{ alignItems: "flex-start" }} />
              </RadioGroup>
              <TextField
                label="Rationale"
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                size="small"
                fullWidth
                multiline
                minRows={2}
                sx={{ mt: 2 }}
                helperText="Why this pathway — recorded on the finding for the governance trail"
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setTriage(null)}>Cancel</Button>
              <Button variant="contained" disableElevation onClick={applyTriage} disabled={!rationale.trim()}>
                Apply triage
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={5000} onClose={() => setToast(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={() => setToast(null)} severity="success" variant="filled" sx={{ width: "100%" }}>{toast}</Alert>
      </Snackbar>
    </Box>
  );
}

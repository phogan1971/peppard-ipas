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
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { useAppState } from "../../data/store";
import { AuditRecord } from "../../data/types";
import { rag } from "../../theme/tokens";

export default function AuditResults({ centreFilter }: { centreFilter: string }) {
  const { auditRecords, centres } = useAppState();
  const [view, setView] = useState<AuditRecord | null>(null);

  const centreName = (id: string) => centres.find((c) => c.id === id)?.shortName ?? id;
  const scoped = auditRecords
    .filter((r) => centreFilter === "all" || r.centreId === centreFilter)
    .sort((a, b) => (a.conductedOn < b.conductedOn ? 1 : -1));

  const pctColor = (pct: number, target: number) => (pct >= target ? rag.green : pct >= target - 10 ? rag.amber : rag.red);

  return (
    <Box>
      <Paper sx={{ overflow: "hidden" }}>
        <Box sx={{ p: 2, pb: 1 }}>
          <Typography sx={{ fontWeight: 700 }}>Audit results register</Typography>
          <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
            {scoped.length} audits · scores against each type's target · audits conducted in-app carry their item-level responses
          </Typography>
        </Box>
        <TableContainer sx={{ maxHeight: 560 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Ref</TableCell>
                <TableCell>Audit</TableCell>
                <TableCell>Facility</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Conducted by</TableCell>
                <TableCell align="right">Score</TableCell>
                <TableCell align="right">Findings</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {scoped.map((r, i) => (
                <TableRow key={r.id} hover>
                  <TableCell sx={{ fontSize: "0.75rem", color: "text.secondary", whiteSpace: "nowrap" }}>AUD-{String(scoped.length - i).padStart(3, "0")}</TableCell>
                  <TableCell sx={{ fontSize: "0.83rem", fontWeight: 600 }}>{r.auditName}</TableCell>
                  <TableCell sx={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}>{centreName(r.centreId)}</TableCell>
                  <TableCell sx={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}>{r.conductedOn}</TableCell>
                  <TableCell sx={{ fontSize: "0.8rem" }}>{r.conductedBy}</TableCell>
                  <TableCell align="right">
                    <Typography component="span" sx={{ fontWeight: 800, color: pctColor(r.compliancePct, r.targetPct) }}>
                      {r.compliancePct}%
                    </Typography>
                    <Typography component="span" sx={{ fontSize: "0.7rem", color: "text.secondary" }}> / {r.targetPct}%</Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: "0.82rem", fontWeight: r.findingsRaised > 0 ? 700 : 400, color: r.findingsRaised > 0 ? rag.amber : "text.secondary" }}>
                    {r.findingsRaised}
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => setView(r)}>View</Button>
                  </TableCell>
                </TableRow>
              ))}
              {scoped.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Typography sx={{ color: "text.secondary", p: 1 }}>No audits recorded for this facility yet — run one from the Conduct tab.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={!!view} onClose={() => setView(null)} maxWidth="md" fullWidth>
        {view && (
          <>
            <DialogTitle>
              {view.auditName} — {centreName(view.centreId)}
              <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
                {view.conductedOn} · {view.conductedBy} ·{" "}
                <Typography component="span" sx={{ fontWeight: 800, color: pctColor(view.compliancePct, view.targetPct) }}>
                  {view.compliancePct}%
                </Typography>{" "}
                against a {view.targetPct}% target · {view.findingsRaised} finding{view.findingsRaised === 1 ? "" : "s"} raised
              </Typography>
            </DialogTitle>
            <DialogContent>
              {view.responses.length === 0 ? (
                <Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>
                  Summary record — item-level responses are captured for audits conducted in-app (Conduct tab).
                </Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Checklist item</TableCell>
                      <TableCell>Answer</TableCell>
                      <TableCell>Note</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {view.responses.map((r) => {
                      const meta =
                        r.answer === "compliant"
                          ? { label: "Compliant", color: rag.green, bg: rag.greenBg }
                          : r.answer === "not_compliant"
                            ? { label: "Not compliant", color: rag.red, bg: rag.redBg }
                            : { label: "N/A", color: rag.neutral, bg: rag.neutralBg };
                      return (
                        <TableRow key={r.itemId}>
                          <TableCell sx={{ fontSize: "0.82rem" }}>
                            {r.text}
                            {r.critical && (
                              <Chip label="Critical" size="small" sx={{ ml: 0.75, height: 18, fontSize: "0.6rem", fontWeight: 700, backgroundColor: rag.redBg, color: rag.red }} />
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip label={meta.label} size="small" sx={{ height: 20, fontSize: "0.66rem", fontWeight: 700, backgroundColor: meta.bg, color: meta.color }} />
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.78rem", color: "text.secondary" }}>{r.note ?? "—"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setView(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Chip from "@mui/material/Chip";
import Link from "@mui/material/Link";
import { RagChip } from "./RagChip";
import { daysUntilDue } from "../data/store";
import { Finding, FindingStatus, SourceDocument } from "../data/types";
import { rag } from "../theme/tokens";

const STATUS_LABEL: Record<FindingStatus, { label: string; color: string; bg: string }> = {
  open: { label: "Open", color: rag.red, bg: rag.redBg },
  evidence_submitted: { label: "Evidence submitted", color: rag.amber, bg: rag.amberBg },
  closed: { label: "Closed", color: rag.green, bg: rag.greenBg },
};

interface Props {
  findings: Finding[];
  centreName: (id: string) => string;
  documentsByCentre: Record<string, SourceDocument[]>;
}

// A readable, print-friendly summary of the findings — the "table" an
// inspection report is converted into, with a link back to the source doc.
export default function FindingsSummaryTable({ findings, centreName, documentsByCentre }: Props) {
  const sorted = [...findings].sort((a, b) => (daysUntilDue(a) ?? 9999) - (daysUntilDue(b) ?? 9999));
  return (
    <Paper sx={{ overflow: "hidden" }}>
      <Box sx={{ p: 2, pb: 1 }}>
        <Typography variant="h6" sx={{ fontSize: "1.05rem", color: "text.primary" }}>
          Findings summary
        </Typography>
        <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
          {sorted.length} finding{sorted.length === 1 ? "" : "s"} — each linked to its source inspection report where attached.
        </Typography>
      </Box>
      <TableContainer sx={{ maxHeight: 560 }}>
        <Table stickyHeader size="small" aria-label="Findings summary">
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Centre</TableCell>
              <TableCell>Finding</TableCell>
              <TableCell>Regulatory</TableCell>
              <TableCell>Action required</TableCell>
              <TableCell>Evidence due</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Source</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.map((f, i) => {
              const d = daysUntilDue(f);
              const overdue = d !== null && d < 0 && f.status === "open";
              const sm = STATUS_LABEL[f.status];
              const docs = documentsByCentre[f.centreId] ?? [];
              // Link a finding to a matching source: an external inspection for
              // IPPS/HIQA findings, the internal audit otherwise.
              const doc =
                f.source === "IPPS inspection" || f.source === "HIQA monitoring"
                  ? docs.find((x) => x.kind !== "internal") ?? docs[0]
                  : docs.find((x) => x.kind === "internal") ?? docs[0];
              const isReportSourced = !!doc && !!doc.url;
              return (
                <TableRow key={f.id} hover>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>
                    <RagChip priority={f.priority} />
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>{centreName(f.centreId)}</TableCell>
                  <TableCell sx={{ fontWeight: 600, minWidth: 150 }}>{f.finding}</TableCell>
                  <TableCell sx={{ fontSize: "0.72rem", color: "text.secondary", whiteSpace: "nowrap" }}>
                    {f.section?.replace(/^\d+\.\s*/, "") || "—"}
                    {f.hiqaStandard ? ` · HIQA ${f.hiqaStandard}` : ""}
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.78rem", minWidth: 220 }}>{f.actionRequired}</TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap", color: overdue ? rag.red : "text.primary", fontWeight: overdue ? 700 : 400 }}>
                    {f.dueOn ?? "—"}
                    {overdue ? ` (${-d!}d)` : ""}
                  </TableCell>
                  <TableCell>
                    <Chip label={sm.label} size="small" sx={{ backgroundColor: sm.bg, color: sm.color, fontWeight: 700, height: 20, fontSize: "0.66rem" }} />
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {isReportSourced ? (
                      <Link href={doc.url} target="_blank" rel="noopener" sx={{ fontSize: "0.75rem", fontWeight: 600 }}>
                        View report
                      </Link>
                    ) : (
                      <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>{f.source ?? "—"}</Typography>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {sorted.length === 0 && (
              <TableRow>
                <TableCell colSpan={9}>
                  <Typography sx={{ color: "text.secondary", p: 1 }}>No findings match the current filter.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

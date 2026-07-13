import { useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/PageShell";
import GovernanceCockpit from "../components/compliance/GovernanceCockpit";
import RiskRegister from "../components/compliance/RiskRegister";
import QipRegister from "../components/compliance/QipRegister";
import FindingsSummaryTable from "../components/FindingsSummaryTable";
import { useAppState } from "../data/store";
import { SourceDocument } from "../data/types";
import { rag } from "../theme/tokens";

const AUDIT_CYCLE_DAYS = 90;
const KIND_LABEL: Record<SourceDocument["kind"], string> = {
  internal: "Internal audit",
  sample: "Department inspection",
  uploaded: "Uploaded inspection",
};

function daysSince(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return Math.round((t.getTime() - new Date(y, m - 1, d).getTime()) / 86400000);
}

const TABS = [
  { key: "cockpit", label: "Cockpit" },
  { key: "audit", label: "Audit programme" },
  { key: "actions", label: "Actions / CAPA" },
  { key: "qip", label: "QIP register" },
  { key: "risk", label: "Risk register" },
];

export default function Compliance() {
  const navigate = useNavigate();
  const { centres, findings, documentsByCentre } = useAppState();
  const [tab, setTab] = useState("cockpit");
  const [centreFilter, setCentreFilter] = useState("all");

  const centreName = (id: string) => centres.find((c) => c.id === id)?.shortName ?? id;
  const scope = centreFilter === "all" ? centres.map((c) => c.id) : [centreFilter];
  const scopedFindings = findings.filter((f) => scope.includes(f.centreId));
  const audits = scope
    .flatMap((id) => documentsByCentre[id] ?? [])
    .sort((a, b) => (a.uploadedOn < b.uploadedOn ? 1 : -1));

  return (
    <PageShell
      icon={VerifiedUserIcon}
      title="Compliance Audit"
      subtitle="Internal governance — audits, findings, CAPA actions, QIP and risk register"
      actions={
        <Select
          size="small"
          value={centreFilter}
          onChange={(e) => setCentreFilter(e.target.value)}
          aria-label="Facility"
          sx={{ minWidth: 220, backgroundColor: "background.paper" }}
        >
          <MenuItem value="all">All facilities</MenuItem>
          {centres.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.shortName}
            </MenuItem>
          ))}
        </Select>
      }
    >
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" aria-label="Compliance sections">
          {TABS.map((t) => (
            <Tab key={t.key} value={t.key} label={t.label} sx={{ textTransform: "none", fontWeight: 600 }} />
          ))}
        </Tabs>
      </Box>

      {tab === "cockpit" && <GovernanceCockpit centreFilter={centreFilter} onOpenTab={setTab} />}

      {tab === "audit" && (
        <Paper sx={{ overflow: "hidden" }}>
          <Box sx={{ p: 2, pb: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1, flexWrap: "wrap" }}>
            <Box>
              <Typography variant="h6" sx={{ fontSize: "1.05rem", color: "text.primary" }}>
                Audit programme
              </Typography>
              <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
                Internal self-audits on a {AUDIT_CYCLE_DAYS}-day cycle, plus external inspections. Record and disseminate
                from Findings &amp; Actions.
              </Typography>
            </Box>
            <Button variant="outlined" size="small" onClick={() => navigate("/findings")}>
              Go to audits &amp; inspections
            </Button>
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Audit / inspection</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Facility</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Currency</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {audits.map((d) => {
                const age = daysSince(d.uploadedOn);
                const next = d.kind === "internal" ? AUDIT_CYCLE_DAYS - age : null;
                const label = next === null ? `${age}d ago` : next < 0 ? `${-next}d overdue` : `next due ${next}d`;
                const color = next !== null && next < 0 ? rag.red : next !== null && next <= 14 ? rag.amber : rag.green;
                return (
                  <TableRow key={d.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{d.name}</TableCell>
                    <TableCell>
                      <Chip label={KIND_LABEL[d.kind]} size="small" sx={{ height: 20, fontSize: "0.66rem", fontWeight: 700, backgroundColor: d.kind === "internal" ? rag.greenBg : "action.hover", color: d.kind === "internal" ? rag.green : "text.secondary" }} />
                    </TableCell>
                    <TableCell>{centreName(d.centreId)}</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{d.uploadedOn}</TableCell>
                    <TableCell sx={{ color, fontWeight: 700, whiteSpace: "nowrap" }}>{label}</TableCell>
                  </TableRow>
                );
              })}
              {audits.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography sx={{ color: "text.secondary", p: 1 }}>No audits recorded for this facility yet.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      )}

      {tab === "actions" && (
        <Box>
          <Typography sx={{ fontSize: "0.85rem", color: "text.secondary", mb: 1.5 }}>
            Corrective &amp; preventive actions (CAPA) are the findings and their 14-day evidence loop —{" "}
            <Link component="button" onClick={() => navigate("/findings")} sx={{ fontWeight: 600 }}>
              raise or edit them in Findings &amp; Actions
            </Link>
            .
          </Typography>
          <FindingsSummaryTable findings={scopedFindings} centreName={centreName} documentsByCentre={documentsByCentre} />
        </Box>
      )}

      {tab === "qip" && <QipRegister centreFilter={centreFilter} centres={centres} centreName={centreName} />}

      {tab === "risk" && <RiskRegister centreFilter={centreFilter} centres={centres} centreName={centreName} />}
    </PageShell>
  );
}

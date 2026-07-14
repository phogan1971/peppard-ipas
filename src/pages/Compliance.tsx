import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Badge from "@mui/material/Badge";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Link from "@mui/material/Link";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/PageShell";
import GovernanceCockpit from "../components/compliance/GovernanceCockpit";
import AuditDashboard from "../components/compliance/AuditDashboard";
import AuditTypesConfig from "../components/compliance/AuditTypesConfig";
import ChecklistEditor from "../components/compliance/ChecklistEditor";
import AuditScheduling from "../components/compliance/AuditScheduling";
import ConductAudit from "../components/compliance/ConductAudit";
import AuditResults from "../components/compliance/AuditResults";
import FindingsTriage from "../components/compliance/FindingsTriage";
import QipReview from "../components/compliance/QipReview";
import MeetingsPanel from "../components/compliance/MeetingsPanel";
import PolicyRegister from "../components/compliance/PolicyRegister";
import EvidencePanel from "../components/compliance/EvidencePanel";
import AlertsPanel from "../components/compliance/AlertsPanel";
import MyQueue from "../components/compliance/MyQueue";
import ComplianceSettings from "../components/compliance/ComplianceSettings";
import RiskRegister from "../components/compliance/RiskRegister";
import QipRegister from "../components/compliance/QipRegister";
import FindingsSummaryTable from "../components/FindingsSummaryTable";
import { computeAlerts } from "../data/alerts";
import { useAppState } from "../data/store";
import { AuditSchedule } from "../data/types";

// The full Genesis compliance IA, rebuilt IPAS-native: audits are the
// facility's own governance programme (types → checklists → schedule →
// conduct → results), findings triage into CAPA/risk/QIP, and the
// registers, meetings, policies, evidence and alerts hang off the same
// store — no separate compliance dataset.
const TABS = [
  { key: "cockpit", label: "Cockpit" },
  { key: "dashboard", label: "Dashboard" },
  { key: "types", label: "Audit types" },
  { key: "checklists", label: "Checklists" },
  { key: "scheduling", label: "Scheduling" },
  { key: "conduct", label: "Conduct" },
  { key: "results", label: "Results" },
  { key: "findings", label: "Findings" },
  { key: "actions", label: "Actions / CAPA" },
  { key: "qip", label: "QIP register" },
  { key: "risk", label: "Risk register" },
  { key: "qipreview", label: "QIP review" },
  { key: "meetings", label: "Meetings" },
  { key: "policies", label: "Policies" },
  { key: "evidence", label: "Evidence" },
  { key: "alerts", label: "Alerts" },
  { key: "queue", label: "My queue" },
  { key: "settings", label: "Settings" },
];

export default function Compliance() {
  const navigate = useNavigate();
  const theme = useTheme();
  // 18 tabs don't scroll comfortably on a phone — below "sm" the tab strip
  // becomes a section dropdown.
  const phone = useMediaQuery(theme.breakpoints.down("sm"));
  const state = useAppState();
  const { centres, findings, documentsByCentre } = state;
  const [tab, setTab] = useState("cockpit");
  const [centreFilter, setCentreFilter] = useState("all");
  // Set when "Conduct" is clicked on a scheduled audit — prefills the wizard.
  const [conductPrefill, setConductPrefill] = useState<AuditSchedule | null>(null);

  const centreName = (id: string) => centres.find((c) => c.id === id)?.shortName ?? id;
  const scope = centreFilter === "all" ? centres.map((c) => c.id) : [centreFilter];
  const scopedFindings = findings.filter((f) => scope.includes(f.centreId));

  const read = new Set(state.alertsRead);
  const unreadAlerts = computeAlerts(state).filter(
    (a) => (centreFilter === "all" || a.centreId === centreFilter || a.centreId === null) && !read.has(a.id),
  ).length;

  const startConduct = (schedule: AuditSchedule) => {
    setConductPrefill(schedule);
    setTab("conduct");
  };

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
          sx={{ minWidth: 220, width: { xs: "100%", sm: "auto" }, backgroundColor: "background.paper" }}
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
      {phone ? (
        <TextField
          select
          fullWidth
          size="small"
          label="Section"
          value={tab}
          onChange={(e) => setTab(e.target.value)}
          sx={{ mb: 2 }}
          SelectProps={{ MenuProps: { PaperProps: { sx: { maxHeight: 420 } } } }}
        >
          {TABS.map((t) => (
            <MenuItem key={t.key} value={t.key}>
              {t.key === "alerts" && unreadAlerts > 0 ? `${t.label} (${unreadAlerts} unread)` : t.label}
            </MenuItem>
          ))}
        </TextField>
      ) : (
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" aria-label="Compliance sections">
            {TABS.map((t) => (
              <Tab
                key={t.key}
                value={t.key}
                label={
                  t.key === "alerts" && unreadAlerts > 0 ? (
                    <Badge badgeContent={unreadAlerts} color="error" sx={{ "& .MuiBadge-badge": { right: -12, fontSize: "0.62rem", height: 16, minWidth: 16 } }}>
                      {t.label}
                    </Badge>
                  ) : (
                    t.label
                  )
                }
                sx={{ textTransform: "none", fontWeight: 600, minWidth: "auto", px: 1.75 }}
              />
            ))}
          </Tabs>
        </Box>
      )}

      {tab === "cockpit" && <GovernanceCockpit centreFilter={centreFilter} onOpenTab={setTab} />}
      {tab === "dashboard" && <AuditDashboard centreFilter={centreFilter} onOpenTab={setTab} />}
      {tab === "types" && <AuditTypesConfig onOpenTab={setTab} />}
      {tab === "checklists" && <ChecklistEditor />}
      {tab === "scheduling" && <AuditScheduling centreFilter={centreFilter} onConduct={startConduct} />}
      {tab === "conduct" && <ConductAudit centreFilter={centreFilter} prefill={conductPrefill} onDone={setTab} />}
      {tab === "results" && <AuditResults centreFilter={centreFilter} />}
      {tab === "findings" && <FindingsTriage centreFilter={centreFilter} />}

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
      {tab === "qipreview" && <QipReview centreFilter={centreFilter} centres={centres} centreName={centreName} />}
      {tab === "meetings" && <MeetingsPanel centreFilter={centreFilter} />}
      {tab === "policies" && <PolicyRegister />}
      {tab === "evidence" && <EvidencePanel centreFilter={centreFilter} />}
      {tab === "alerts" && <AlertsPanel centreFilter={centreFilter} onOpenTab={setTab} />}
      {tab === "queue" && <MyQueue centreFilter={centreFilter} onOpenTab={setTab} />}
      {tab === "settings" && <ComplianceSettings />}
    </PageShell>
  );
}

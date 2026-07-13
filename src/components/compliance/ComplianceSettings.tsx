import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Switch from "@mui/material/Switch";
import { setAlertRuleEnabled, useAppState } from "../../data/store";
import { AlertSeverity } from "../../data/types";
import { rag } from "../../theme/tokens";

const SEVERITY_META: Record<AlertSeverity, { label: string; color: string; bg: string }> = {
  critical: { label: "Critical", color: rag.red, bg: rag.redBg },
  warning: { label: "Warning", color: rag.amber, bg: rag.amberBg },
  info: { label: "Info", color: rag.neutral, bg: rag.neutralBg },
};

export default function ComplianceSettings() {
  const { alertRules } = useAppState();

  return (
    <Box>
      <Typography sx={{ fontSize: "0.85rem", color: "text.secondary", mb: 2, maxWidth: 680 }}>
        Alert rules for the compliance module. In-app alerts are always computed live from the registers; switching a
        rule off hides its alerts everywhere. Email and Teams delivery, recipients and per-facility thresholds are part
        of the full build.
      </Typography>

      <Grid container spacing={2}>
        {alertRules.map((rule) => {
          const meta = SEVERITY_META[rule.severity];
          return (
            <Grid item xs={12} sm={6} lg={4} key={rule.key}>
              <Paper sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column", gap: 0.5 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>{rule.label}</Typography>
                    <Chip label={meta.label} size="small" sx={{ height: 18, fontSize: "0.6rem", fontWeight: 700, backgroundColor: meta.bg, color: meta.color }} />
                  </Box>
                  <Switch
                    checked={rule.enabled}
                    onChange={(e) => setAlertRuleEnabled(rule.key, e.target.checked)}
                    size="small"
                    inputProps={{ "aria-label": `${rule.label} alert rule` }}
                  />
                </Box>
                <Typography sx={{ fontSize: "0.76rem", color: "text.secondary" }}>{rule.description}</Typography>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}

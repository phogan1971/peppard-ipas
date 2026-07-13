import { useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import { computeAlerts } from "../../data/alerts";
import { markAlertsRead, useAppState } from "../../data/store";
import { AlertSeverity } from "../../data/types";
import { rag } from "../../theme/tokens";
import { useSurfaces } from "../../theme";

const SEVERITY_META: Record<AlertSeverity, { label: string; color: string; bg: string; icon: typeof ErrorOutlineIcon }> = {
  critical: { label: "Critical", color: rag.red, bg: rag.redBg, icon: ErrorOutlineIcon },
  warning: { label: "Warning", color: rag.amber, bg: rag.amberBg, icon: WarningAmberIcon },
  info: { label: "Info", color: rag.neutral, bg: rag.neutralBg, icon: InfoOutlinedIcon },
};

interface Props {
  centreFilter: string;
  onOpenTab: (tab: string) => void;
}

export default function AlertsPanel({ centreFilter, onOpenTab }: Props) {
  const surf = useSurfaces();
  const state = useAppState();
  const [severityFilter, setSeverityFilter] = useState("all");
  const [showRead, setShowRead] = useState("unread");

  const read = new Set(state.alertsRead);
  const all = computeAlerts(state).filter(
    (a) => centreFilter === "all" || a.centreId === centreFilter || a.centreId === null,
  );
  const alerts = all
    .filter((a) => severityFilter === "all" || a.severity === severityFilter)
    .filter((a) => (showRead === "unread" ? !read.has(a.id) : true));
  const unreadCount = all.filter((a) => !read.has(a.id)).length;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 1.5 }}>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <TextField select size="small" label="Severity" value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} sx={{ minWidth: 130 }}>
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="critical">Critical</MenuItem>
            <MenuItem value="warning">Warning</MenuItem>
            <MenuItem value="info">Info</MenuItem>
          </TextField>
          <TextField select size="small" label="Show" value={showRead} onChange={(e) => setShowRead(e.target.value)} sx={{ minWidth: 130 }}>
            <MenuItem value="unread">Unread</MenuItem>
            <MenuItem value="all">All</MenuItem>
          </TextField>
        </Box>
        <Button variant="outlined" size="small" onClick={() => markAlertsRead(all.map((a) => a.id))} disabled={unreadCount === 0}>
          Mark all read ({unreadCount})
        </Button>
      </Box>

      <Typography sx={{ fontSize: "0.78rem", color: "text.secondary", mb: 1.5 }}>
        Alerts are computed live from the registers — clearing the underlying issue clears the alert. Rules and
        thresholds are configured in Settings; in-app notifications are always on (email/Teams are part of the full
        build).
      </Typography>

      {alerts.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <NotificationsNoneIcon sx={{ fontSize: 36, color: rag.green, mb: 1 }} />
          <Typography sx={{ fontWeight: 700 }}>No {showRead === "unread" ? "unread " : ""}alerts</Typography>
          <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>Nothing needs attention in this view.</Typography>
        </Paper>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {alerts.map((a) => {
            const meta = SEVERITY_META[a.severity];
            const Icon = meta.icon;
            const isRead = read.has(a.id);
            return (
              <Paper key={a.id} sx={{ p: 1.5, display: "flex", alignItems: "center", gap: 1.5, opacity: isRead ? 0.65 : 1, backgroundColor: isRead ? surf.subtleBg : undefined }}>
                <Box sx={{ width: 36, height: 36, borderRadius: 1.5, backgroundColor: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon sx={{ fontSize: 20, color: meta.color }} />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography sx={{ fontSize: "0.85rem", fontWeight: 700 }}>{a.title}</Typography>
                  <Typography sx={{ fontSize: "0.74rem", color: "text.secondary" }}>{a.body}</Typography>
                </Box>
                <Chip label={meta.label} size="small" sx={{ height: 20, fontSize: "0.64rem", fontWeight: 700, backgroundColor: meta.bg, color: meta.color, flexShrink: 0 }} />
                <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
                  {a.tab && (
                    <Button size="small" onClick={() => onOpenTab(a.tab as string)}>
                      Open
                    </Button>
                  )}
                  {!isRead && (
                    <Button size="small" color="inherit" onClick={() => markAlertsRead([a.id])}>
                      Mark read
                    </Button>
                  )}
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

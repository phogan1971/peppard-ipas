import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import ButtonBase from "@mui/material/ButtonBase";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Divider from "@mui/material/Divider";
import DashboardIcon from "@mui/icons-material/Dashboard";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import GroupsIcon from "@mui/icons-material/Groups";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import InsightsIcon from "@mui/icons-material/Insights";
import RuleIcon from "@mui/icons-material/Rule";
import ApartmentIcon from "@mui/icons-material/Apartment";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useNavigate } from "react-router-dom";
import StatCard from "../components/StatCard";
import { RagChip } from "../components/RagChip";
import { useAppState, centreCompliance, daysUntilDue } from "../data/store";
import { KPI_DOMAINS, domainRollup } from "../data/kpis";
import { brand, rag, accent, text as textTokens } from "../theme/tokens";
import { useSurfaces } from "../theme";
import { useColorMode } from "../theme/ColorModeContext";
import ErrorBoundary from "../components/ErrorBoundary";

const GROUP_STATUS = {
  RED: { color: rag.red, bg: rag.redBg, label: "ACTION REQUIRED" },
  AMBER: { color: rag.amber, bg: rag.amberBg, label: "MONITOR" },
  GREEN: { color: rag.green, bg: rag.greenBg, label: "ON TRACK" },
} as const;

const WORST_COLOR: Record<string, string> = {
  RED: rag.red,
  AMBER: rag.amber,
  GREEN: rag.green,
  NONE: rag.green,
};

// Phone-first digest of the group governance position for directors:
// one thumb-scroll from group status to the items needing escalation.
// Standalone route (no desktop shell) so it opens clean on a mobile screen.
export default function ExecView() {
  const navigate = useNavigate();
  const s = useSurfaces();
  const { mode, toggleMode } = useColorMode();
  const state = useAppState();
  const { centres, findings, assessments, roomsByCentre } = state;

  const totalCapacity = centres.reduce((sum, c) => sum + c.contractCapacity, 0);
  const totalOccupancy = centres.reduce((sum, c) => sum + c.occupancy, 0);
  const occPct = Math.round((totalOccupancy / totalCapacity) * 100);

  const open = findings.filter((f) => f.status !== "closed");
  const openRed = open.filter((f) => f.priority === "RED").length;
  const openAmber = open.filter((f) => f.priority === "AMBER").length;
  const overdue = open.filter((f) => {
    const d = daysUntilDue(f);
    return d !== null && d < 0 && f.status === "open";
  }).length;

  const kpiTotals = KPI_DOMAINS.reduce(
    (acc, domain) => {
      const r = domainRollup(domain, state);
      return { meets: acc.meets + r.meets, total: acc.total + domain.kpis.length };
    },
    { meets: 0, total: 0 },
  );
  const kpiPct = Math.round((kpiTotals.meets / kpiTotals.total) * 100);

  const assessed = assessments.filter((a) => a.judgement !== "notAssessed");
  const hiqaGood = assessed.filter(
    (a) => a.judgement === "compliant" || a.judgement === "substantiallyCompliant",
  ).length;
  const hiqaPct = assessed.length === 0 ? 0 : Math.round((hiqaGood / assessed.length) * 100);

  const allRooms = Object.values(roomsByCentre).flat();
  const assessableRooms = allRooms.filter((r) => r.currentOccupancy !== null && r.suitableOccupancy !== null);
  const roomsWithin = assessableRooms.filter((r) => r.currentOccupancy! <= r.suitableOccupancy!).length;
  const roomsPct = Math.round((roomsWithin / assessableRooms.length) * 100);

  const groupWorst: keyof typeof GROUP_STATUS = openRed > 0 || overdue > 0 ? "RED" : openAmber > 0 ? "AMBER" : "GREEN";
  const gs = GROUP_STATUS[groupWorst];
  const statusLine =
    groupWorst === "RED"
      ? `${openRed} RED finding${openRed === 1 ? "" : "s"} open · ${overdue} past the 14-day evidence clock`
      : groupWorst === "AMBER"
        ? `No RED findings or overdue evidence · ${openAmber} AMBER item${openAmber === 1 ? "" : "s"} in the 14-day loop`
        : "No RED or AMBER findings open · nothing past the 14-day evidence clock";

  const attention = open
    .filter((f) => {
      const d = daysUntilDue(f);
      return f.priority === "RED" || (d !== null && d < 0 && f.status === "open");
    })
    .sort((a, b) => (daysUntilDue(a) ?? 99) - (daysUntilDue(b) ?? 99))
    .slice(0, 5);

  const today = new Date().toLocaleDateString("en-IE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: s.pageBg }}>
      <Box
        component="header"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          backgroundColor: brand.topBar,
          color: "#fff",
          px: 2,
          py: 1.25,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Box sx={{ backgroundColor: "#fff", borderRadius: "8px", px: 0.75, py: 0.4, display: "flex", alignItems: "center" }}>
          <Box component="img" src="/peppard-logo.jpg" alt="Peppard Investments" sx={{ height: 32, width: "auto" }} />
        </Box>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "1.05rem", lineHeight: 1.2 }}>Executive View</Typography>
          <Typography sx={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.7)" }}>
            IPAS governance · 8 centres
          </Typography>
        </Box>
        <Tooltip title={mode === "light" ? "Dark mode" : "Light mode"}>
          <IconButton
            aria-label={mode === "light" ? "Switch to dark mode" : "Switch to light mode"}
            onClick={toggleMode}
            size="small"
            sx={{ color: "rgba(255,255,255,0.85)" }}
          >
            {mode === "light" ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Open full dashboard">
          <IconButton
            aria-label="Open full dashboard"
            onClick={() => navigate("/overview")}
            size="small"
            sx={{ color: "rgba(255,255,255,0.85)" }}
          >
            <DashboardIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <ErrorBoundary>
        <Box sx={{ maxWidth: 560, mx: "auto", px: 2, py: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <Paper sx={{ p: 2, borderLeft: `6px solid ${gs.color}`, backgroundColor: gs.bg }}>
            <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", color: gs.color }}>
              GROUP STATUS
            </Typography>
            <Typography sx={{ fontSize: "1.6rem", fontWeight: 800, color: gs.color, lineHeight: 1.2 }}>
              {gs.label}
            </Typography>
            {/* banner keeps its light RAG tint in dark mode, so the copy keeps its light-mode ink */}
            <Typography sx={{ fontSize: "0.85rem", color: textTokens.primary, mt: 0.5 }}>{statusLine}</Typography>
          </Paper>

          <Grid container spacing={1.5}>
            <Grid item xs={6}>
              <StatCard label="Occupancy" value={`${occPct}%`} sub={`${totalOccupancy} of ${totalCapacity} beds`} accent={accent.blue} icon={GroupsIcon} />
            </Grid>
            <Grid item xs={6}>
              <StatCard
                label="Open findings"
                value={open.length}
                sub={`${openRed} red · ${openAmber} amber`}
                accent={openRed > 0 ? accent.red : accent.orange}
                icon={FactCheckIcon}
              />
            </Grid>
            <Grid item xs={6}>
              <StatCard
                label="Overdue evidence"
                value={overdue}
                sub="past the 14-day clock"
                accent={overdue > 0 ? accent.red : accent.green}
                icon={WarningAmberIcon}
              />
            </Grid>
            <Grid item xs={6}>
              <StatCard label="KPIs on target" value={`${kpiPct}%`} sub={`${kpiTotals.meets} of ${kpiTotals.total} KPIs`} accent={accent.purple} icon={InsightsIcon} />
            </Grid>
            <Grid item xs={6}>
              <StatCard
                label="HIQA position"
                value={`${hiqaPct}%`}
                sub="at or above substantial compliance"
                accent={accent.green}
                icon={RuleIcon}
              />
            </Grid>
            <Grid item xs={6}>
              <StatCard
                label="Space standard"
                value={`${roomsPct}%`}
                sub="rooms within 4.65 m² per person"
                accent={accent.navy}
                icon={ApartmentIcon}
              />
            </Grid>
          </Grid>

          <Box>
            <Typography variant="overline" sx={{ color: "text.secondary" }}>
              Needs attention
            </Typography>
            {attention.length === 0 ? (
              <Paper sx={{ p: 2 }}>
                <Typography sx={{ fontSize: "0.9rem", fontWeight: 600, color: rag.green }}>
                  Nothing needs escalation
                </Typography>
                <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
                  No open RED findings and no evidence past the 14-day clock across the group.
                </Typography>
              </Paper>
            ) : (
              <Paper>
                {attention.map((f, i) => {
                  const centre = centres.find((c) => c.id === f.centreId);
                  const d = daysUntilDue(f);
                  return (
                    <Box key={f.id}>
                      {i > 0 && <Divider />}
                      <ButtonBase
                        onClick={() => navigate("/findings")}
                        aria-label={`Open findings tracker — ${centre?.shortName ?? f.centreId}, ${f.section}`}
                        sx={{ width: "100%", textAlign: "left", p: 1.75, display: "block" }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5, flexWrap: "wrap" }}>
                          <RagChip priority={f.priority} />
                          <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "text.primary" }}>
                            {centre?.shortName ?? f.centreId} · {f.section}
                          </Typography>
                          {d !== null && (
                            <Chip
                              label={d < 0 ? `${-d}d overdue` : `due in ${d}d`}
                              size="small"
                              sx={{
                                ml: "auto",
                                height: 20,
                                fontSize: "0.68rem",
                                fontWeight: 700,
                                color: d < 0 ? rag.red : rag.amber,
                                backgroundColor: d < 0 ? rag.redBg : rag.amberBg,
                              }}
                            />
                          )}
                        </Box>
                        <Typography
                          sx={{
                            fontSize: "0.82rem",
                            color: "text.secondary",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {f.finding}
                        </Typography>
                      </ButtonBase>
                    </Box>
                  );
                })}
              </Paper>
            )}
          </Box>

          <Box>
            <Typography variant="overline" sx={{ color: "text.secondary" }}>
              Centres
            </Typography>
            <Paper>
              {centres.map((centre, i) => {
                const cc = centreCompliance(centre.id, findings);
                const pct = Math.round((centre.occupancy / centre.contractCapacity) * 100);
                return (
                  <Box key={centre.id}>
                    {i > 0 && <Divider />}
                    <ButtonBase
                      onClick={() => navigate(`/centres/${centre.id}`)}
                      aria-label={`Open ${centre.name}`}
                      sx={{ width: "100%", textAlign: "left", px: 1.75, py: 1.5, display: "flex", alignItems: "center", gap: 1.25 }}
                    >
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, backgroundColor: WORST_COLOR[cc.worst] }} />
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: "0.9rem", fontWeight: 600, color: "text.primary", lineHeight: 1.3 }} noWrap>
                          {centre.shortName}
                        </Typography>
                        <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }} noWrap>
                          {centre.location}, Co. {centre.county} · {pct}% occupied
                        </Typography>
                      </Box>
                      {cc.overdue > 0 && (
                        <Chip
                          label={`${cc.overdue} overdue`}
                          size="small"
                          sx={{ height: 20, fontSize: "0.68rem", fontWeight: 700, color: rag.red, backgroundColor: rag.redBg }}
                        />
                      )}
                      <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: WORST_COLOR[cc.worst], flexShrink: 0 }}>
                        {cc.worst === "NONE" ? "CLEAR" : cc.worst}
                      </Typography>
                      <ChevronRightIcon sx={{ fontSize: 18, color: "text.secondary", flexShrink: 0 }} />
                    </ButtonBase>
                  </Box>
                );
              })}
            </Paper>
          </Box>

          <Typography sx={{ textAlign: "center", fontSize: "0.72rem", color: "text.secondary", pb: 2 }}>
            Computed live from the group registers · {today}
          </Typography>
        </Box>
      </ErrorBoundary>
    </Box>
  );
}

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import ButtonBase from "@mui/material/ButtonBase";
import Button from "@mui/material/Button";
import DashboardIcon from "@mui/icons-material/Dashboard";
import SummarizeIcon from "@mui/icons-material/Summarize";
import ApartmentIcon from "@mui/icons-material/Apartment";
import GroupsIcon from "@mui/icons-material/Groups";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/PageShell";
import StatCard from "../components/StatCard";
import { useAppState, centreCompliance } from "../data/store";
import { brand, rag, accent } from "../theme/tokens";

const WORST_ACCENT: Record<string, string> = {
  RED: rag.red,
  AMBER: rag.amber,
  GREEN: rag.green,
  NONE: rag.green,
};

const WORST_LABEL: Record<string, string> = {
  RED: "RED items open",
  AMBER: "AMBER items open",
  GREEN: "GREEN items only",
  NONE: "No open findings",
};

export default function GroupOverview() {
  const { centres, findings } = useAppState();
  const navigate = useNavigate();

  const totalCapacity = centres.reduce((s, c) => s + c.contractCapacity, 0);
  const totalOccupancy = centres.reduce((s, c) => s + c.occupancy, 0);
  const open = findings.filter((f) => f.status !== "closed");
  const overdue = centres.reduce((s, c) => s + centreCompliance(c.id, findings).overdue, 0);

  return (
    <PageShell
      icon={DashboardIcon}
      title="Group Overview"
      subtitle="Compliance position across all 8 Peppard accommodation centres"
      actions={
        <Button variant="contained" disableElevation startIcon={<SummarizeIcon />} onClick={() => navigate("/board-pack")}>
          Board pack
        </Button>
      }
    >
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Contracted capacity" value={totalCapacity} sub="beds across 8 centres" accent={accent.navy} icon={ApartmentIcon} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Current occupancy"
            value={totalOccupancy}
            sub={`${Math.round((totalOccupancy / totalCapacity) * 100)}% of contracted capacity`}
            accent={accent.blue}
            icon={GroupsIcon}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Open findings"
            value={open.length}
            sub={`${open.filter((f) => f.priority === "RED").length} red · ${open.filter((f) => f.priority === "AMBER").length} amber`}
            accent={accent.orange}
            icon={FactCheckIcon}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Overdue evidence"
            value={overdue}
            sub="past the 14-day clock"
            accent={overdue > 0 ? accent.red : accent.green}
            icon={WarningAmberIcon}
          />
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ mb: 1.5, color: "text.primary" }}>
        Centres
      </Typography>
      <Grid container spacing={2}>
        {centres.map((centre) => {
          const cc = centreCompliance(centre.id, findings);
          const occPct = Math.round((centre.occupancy / centre.contractCapacity) * 100);
          return (
            <Grid item xs={12} sm={6} lg={3} key={centre.id}>
              <ButtonBase
                onClick={() => navigate(`/centres/${centre.id}`)}
                sx={{ width: "100%", textAlign: "left", borderRadius: 2 }}
                aria-label={`Open ${centre.name}`}
              >
                <Paper
                  sx={{
                    p: 2,
                    width: "100%",
                    borderTop: `4px solid ${WORST_ACCENT[cc.worst]}`,
                    transition: "box-shadow 0.2s ease",
                    "&:hover": { boxShadow: "0 3px 12px rgba(0,0,0,0.12)" },
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
                    <Box>
                      <Typography sx={{ fontWeight: 700, color: "text.primary", lineHeight: 1.25 }}>
                        {centre.shortName}
                      </Typography>
                      <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
                        {centre.location}, Co. {centre.county}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ mt: 1.5, mb: 0.5, display: "flex", justifyContent: "space-between" }}>
                    <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>Occupancy</Typography>
                    <Typography sx={{ fontSize: "0.8rem", fontWeight: 600 }}>
                      {centre.occupancy} / {centre.contractCapacity} ({occPct}%)
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(occPct, 100)}
                    aria-label={`${centre.shortName} occupancy ${occPct}%`}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: brand.border,
                      "& .MuiLinearProgress-bar": { backgroundColor: "primary.main" },
                    }}
                  />

                  <Box sx={{ mt: 1.5, display: "flex", gap: 0.75, flexWrap: "wrap", alignItems: "center" }}>
                    <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: WORST_ACCENT[cc.worst] }}>
                      {WORST_LABEL[cc.worst]}
                    </Typography>
                    {cc.overdue > 0 && (
                      <Chip
                        label={`${cc.overdue} overdue`}
                        size="small"
                        sx={{ backgroundColor: rag.redBg, color: rag.red, fontWeight: 700, height: 20, fontSize: "0.68rem" }}
                      />
                    )}
                  </Box>
                </Paper>
              </ButtonBase>
            </Grid>
          );
        })}
      </Grid>
    </PageShell>
  );
}

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
import { brand, rag, ragAccent, accent } from "../theme/tokens";
import { useSurfaces } from "../theme";

const WORST_ACCENT: Record<string, string> = {
  RED: ragAccent.red,
  AMBER: ragAccent.amber,
  GREEN: ragAccent.green,
  NONE: ragAccent.green,
};

const WORST_TEXT: Record<string, { color: string; bg: string }> = {
  RED: { color: rag.red, bg: rag.redBg },
  AMBER: { color: rag.amber, bg: rag.amberBg },
  GREEN: { color: rag.green, bg: rag.greenBg },
  NONE: { color: rag.green, bg: rag.greenBg },
};

// Occupancy bar: tapered brand gradient while within contract, warming
// to amber near the ceiling and RAG red once over it.
function occupancyGradient(occPct: number): string {
  if (occPct > 100) return `linear-gradient(90deg, ${ragAccent.amber}, ${ragAccent.red})`;
  if (occPct >= 95) return `linear-gradient(90deg, ${brand.teal}, ${ragAccent.amber})`;
  return `linear-gradient(90deg, ${brand.teal}, ${ragAccent.green})`;
}

const WORST_LABEL: Record<string, string> = {
  RED: "RED items open",
  AMBER: "AMBER items open",
  GREEN: "GREEN items only",
  NONE: "No open findings",
};

export default function GroupOverview() {
  const { centres, findings } = useAppState();
  const navigate = useNavigate();
  const s = useSurfaces();

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
                    position: "relative",
                    overflow: "hidden",
                    transition: "box-shadow 0.2s ease",
                    "&:hover": { boxShadow: "0 3px 12px rgba(0,0,0,0.12)" },
                    // RAG top edge: full-width colour band fading into the card
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 7,
                      background: `linear-gradient(90deg, ${WORST_ACCENT[cc.worst]}, ${WORST_ACCENT[cc.worst]}99)`,
                    },
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
                      height: 9,
                      borderRadius: 4.5,
                      backgroundColor: s.pillRowBg,
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 4.5,
                        background: occupancyGradient(occPct),
                      },
                    }}
                  />

                  <Box sx={{ mt: 1.5, display: "flex", gap: 0.75, flexWrap: "wrap", alignItems: "center" }}>
                    <Chip
                      label={WORST_LABEL[cc.worst]}
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        color: WORST_TEXT[cc.worst].color,
                        backgroundColor: WORST_TEXT[cc.worst].bg,
                      }}
                    />
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

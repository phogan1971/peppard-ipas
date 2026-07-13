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
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/PageShell";
import StatCard from "../components/StatCard";
import DetailDialog, { DetailContent, DetailFilter } from "../components/DetailDialog";
import { RagChip } from "../components/RagChip";
import { useAppState, centreCompliance, centreStatusLabel, daysUntilDue, isOverdue } from "../data/store";
import { rag, ragAccent, accent, occupancyColor } from "../theme/tokens";
import { useSurfaces } from "../theme";

const WORST_ACCENT: Record<string, string> = {
  RED: ragAccent.red,
  AMBER: ragAccent.amber,
  GREEN: ragAccent.green,
  UNMARKED: ragAccent.amber,
  NONE: ragAccent.green,
};

const WORST_TEXT: Record<string, { color: string; bg: string }> = {
  RED: { color: rag.red, bg: rag.redBg },
  AMBER: { color: rag.amber, bg: rag.amberBg },
  GREEN: { color: rag.green, bg: rag.greenBg },
  UNMARKED: { color: rag.amber, bg: rag.amberBg },
  NONE: { color: rag.green, bg: rag.greenBg },
};

// Occupancy bar: colour reflects how full the centre is — red when beds
// sit empty (lost contract revenue), greening as it climbs toward 100%.
// Same occupancyColor scale used everywhere occupancy is shown. Subtle
// left-to-right taper keeps the polished look.
function occupancyGradient(occPct: number): string {
  const c = occupancyColor(occPct);
  return `linear-gradient(90deg, ${c}66, ${c})`;
}

export default function GroupOverview() {
  const { centres, findings } = useAppState();
  const navigate = useNavigate();
  const s = useSurfaces();

  const totalCapacity = centres.reduce((sum, c) => sum + c.contractCapacity, 0);
  const totalOccupancy = centres.reduce((sum, c) => sum + c.occupancy, 0);
  const overallPct = Math.round((totalOccupancy / totalCapacity) * 100);
  const open = findings.filter((f) => f.status !== "closed");
  const openRed = open.filter((f) => f.priority === "RED").length;
  const openAmber = open.filter((f) => f.priority === "AMBER").length;
  const overdue = centres.reduce((sum, c) => sum + centreCompliance(c.id, findings).overdue, 0);

  const [detail, setDetail] = useState<DetailContent | null>(null);
  const centreName = (centreId: string) => centres.find((c) => c.id === centreId)?.shortName ?? centreId;

  const dueChip = (f: (typeof open)[number]) => {
    const d = daysUntilDue(f);
    if (d === null) return null;
    const late = isOverdue(f);
    return (
      <Chip
        label={late ? `${-d}d overdue` : f.status === "evidence_submitted" ? "evidence in" : `due in ${d}d`}
        size="small"
        sx={{
          height: 20,
          fontSize: "0.68rem",
          fontWeight: 700,
          color: late ? rag.red : rag.amber,
          backgroundColor: late ? rag.redBg : rag.amberBg,
        }}
      />
    );
  };

  const capacityDetail = (): DetailContent => ({
    title: "Contracted capacity",
    subtitle: `${totalCapacity} beds contracted across ${centres.length} centres`,
    rows: centres.map((c) => ({
      id: c.id,
      primary: c.shortName,
      secondary: `${c.location}, Co. ${c.county}`,
      trailing: <Typography sx={{ fontSize: "0.85rem", fontWeight: 700 }}>{c.contractCapacity} beds</Typography>,
    })),
  });

  const occupancyDetail = (): DetailContent => ({
    title: "Current occupancy",
    subtitle: `${totalOccupancy} of ${totalCapacity} beds filled — ${overallPct}% of contracted capacity`,
    rows: [...centres]
      .map((c) => ({ c, pct: Math.round((c.occupancy / c.contractCapacity) * 100) }))
      .sort((a, b) => a.pct - b.pct)
      .map(({ c, pct }) => ({
        id: c.id,
        leading: <Box sx={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: occupancyColor(pct) }} />,
        primary: c.shortName,
        secondary: `${c.occupancy} / ${c.contractCapacity} beds`,
        trailing: <Typography sx={{ fontSize: "0.9rem", fontWeight: 700, color: occupancyColor(pct) }}>{pct}%</Typography>,
      })),
  });

  const findingRows = (list: typeof open) =>
    [...list]
      .sort((a, b) => (daysUntilDue(a) ?? 9999) - (daysUntilDue(b) ?? 9999))
      .map((f) => ({
        id: f.id,
        filterValue: f.centreId,
        leading: <RagChip priority={f.priority} />,
        primary: `${centreName(f.centreId)} · ${f.section}`,
        secondary: f.finding,
        trailing: dueChip(f),
      }));

  // "Filter by facility" dropdown for a findings drill-down — only when the
  // list spans more than one centre, listing only the centres present.
  const centreDetailFilter = (list: typeof open): DetailFilter | undefined => {
    const present = new Set(list.map((f) => f.centreId));
    if (present.size <= 1) return undefined;
    return {
      allLabel: "All centres",
      options: centres.filter((c) => present.has(c.id)).map((c) => ({ value: c.id, label: c.shortName })),
    };
  };

  const openFindingsDetail = (): DetailContent => ({
    title: "Open findings",
    subtitle: `${open.length} open · ${openRed} red · ${openAmber} amber`,
    rows: findingRows(open),
    emptyText: "No open findings across the group.",
    filter: centreDetailFilter(open),
  });

  const overdueDetail = (): DetailContent => {
    const list = open.filter(isOverdue);
    return {
      title: "Overdue evidence",
      subtitle: `${list.length} finding${list.length === 1 ? "" : "s"} past the 14-day evidence clock`,
      rows: findingRows(list),
      emptyText: "Nothing is past the 14-day evidence clock.",
      filter: centreDetailFilter(list),
    };
  };

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
      <Paper sx={{ p: 2, mb: 3, borderLeft: `4px solid ${accent.navy}` }}>
        <Typography sx={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: 0.7, color: "text.secondary", mb: 0.5 }}>
          Group profile
        </Typography>
        <Typography sx={{ fontSize: "0.9rem", color: "text.primary", lineHeight: 1.5 }}>
          Over 15 years operating IPAS accommodation. Each centre is led by a dedicated on-site General Manager, supported
          from head offices in Cork and Dublin, applying one uniform policy suite across all locations. Compliance is
          monitored through internal audits and centre inspections by senior management, with corrective actions tracked
          centrally to completion. Fire risk assessments and safety audits are delivered by <strong>Mackin EHS</strong>{" "}
          under the 2026 Health &amp; Safety audit programme.
        </Typography>
      </Paper>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Contracted capacity" value={totalCapacity} sub="beds across 8 centres" accent={accent.navy} icon={ApartmentIcon} onClick={() => setDetail(capacityDetail())} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Current occupancy"
            value={totalOccupancy}
            sub={`${overallPct}% of contracted capacity`}
            accent={accent.blue}
            icon={GroupsIcon}
            onClick={() => setDetail(occupancyDetail())}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Open findings"
            value={open.length}
            sub={`${openRed} red · ${openAmber} amber`}
            accent={accent.orange}
            icon={FactCheckIcon}
            onClick={() => setDetail(openFindingsDetail())}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Overdue evidence"
            value={overdue}
            sub="past the 14-day clock"
            accent={overdue > 0 ? accent.red : accent.green}
            icon={WarningAmberIcon}
            onClick={() => setDetail(overdueDetail())}
          />
        </Grid>
      </Grid>

      <DetailDialog content={detail} onClose={() => setDetail(null)} />

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
                      background: `linear-gradient(90deg, ${WORST_ACCENT[cc.status]}, ${WORST_ACCENT[cc.status]}99)`,
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
                      label={centreStatusLabel(cc)}
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        color: WORST_TEXT[cc.status].color,
                        backgroundColor: WORST_TEXT[cc.status].bg,
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

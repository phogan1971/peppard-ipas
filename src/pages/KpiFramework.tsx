import { useState } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import InsightsIcon from "@mui/icons-material/Insights";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import BoltIcon from "@mui/icons-material/Bolt";
import PageShell from "../components/PageShell";
import StatCard from "../components/StatCard";
import AccordionBlock from "../components/AccordionBlock";
import DetailDialog, { DetailContent } from "../components/DetailDialog";
import { useAppState } from "../data/store";
import { KPI_DOMAINS, KpiStatus, KpiValue, KpiDef, domainRollup, kpiValue } from "../data/kpis";
import { rag, accent } from "../theme/tokens";
import { useSurfaces } from "../theme";

const STATUS_META: Record<KpiStatus, { label: string; color: string; bg: string }> = {
  meets: { label: "On target", color: rag.green, bg: rag.greenBg },
  near: { label: "Near target", color: rag.amber, bg: rag.amberBg },
  breach: { label: "Off target", color: rag.red, bg: rag.redBg },
};

export default function KpiFramework() {
  const state = useAppState();
  const s = useSurfaces();

  const allValues = KPI_DOMAINS.flatMap((d) => d.kpis.map((k) => kpiValue(k, state)));
  const meets = allValues.filter((v) => v.status === "meets").length;
  const near = allValues.filter((v) => v.status === "near").length;
  const breach = allValues.filter((v) => v.status === "breach").length;
  const liveCount = allValues.filter((v) => v.live).length;

  const allKpis: { kpi: KpiDef; domain: string; v: KpiValue }[] = KPI_DOMAINS.flatMap((d) =>
    d.kpis.map((k) => ({ kpi: k, domain: d.name, v: kpiValue(k, state) })),
  );

  const [detail, setDetail] = useState<DetailContent | null>(null);

  const kpiRows = (list: typeof allKpis) =>
    list.map(({ kpi, domain, v }) => {
      const sm = STATUS_META[v.status];
      return {
        id: kpi.id,
        leading: <Box sx={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: sm.color, flexShrink: 0 }} />,
        primary: (
          <>
            {kpi.name}
            {v.live && (
              <Chip label="LIVE" size="small" sx={{ ml: 0.75, height: 15, fontSize: "0.58rem", fontWeight: 700, backgroundColor: "primary.main", color: "#fff" }} />
            )}
          </>
        ),
        secondary: `${domain} · target ${kpi.target}`,
        trailing: <Chip label={v.display} size="small" sx={{ backgroundColor: sm.bg, color: sm.color, fontWeight: 700, height: 22, fontSize: "0.68rem" }} />,
      };
    });

  const statusDetail = (status: KpiStatus, title: string, subtitle: string): DetailContent => ({
    title,
    subtitle,
    rows: kpiRows(allKpis.filter((x) => x.v.status === status)),
  });

  const liveDetail = (): DetailContent => ({
    title: "Computed live",
    subtitle: "Calculated in real time direct from the registers",
    rows: kpiRows(allKpis.filter((x) => x.v.live)),
    emptyText: "No live KPIs.",
  });

  return (
    <PageShell
      icon={InsightsIcon}
      title="KPI Framework"
      subtitle="13 domains, 74 KPIs — every KPI computes from a register, nothing manually keyed"
    >
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="KPIs on target" value={meets} sub={`of ${allValues.length} KPIs`} accent={accent.green} icon={CheckCircleOutlineIcon} onClick={() => setDetail(statusDetail("meets", "KPIs on target", `${meets} of ${allValues.length} KPIs meeting target`))} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Near target" value={near} sub="watch list" accent={accent.orange} icon={InfoOutlinedIcon} onClick={() => setDetail(statusDetail("near", "Near target", "On the watch list — close to target"))} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Off target" value={breach} sub="require action" accent={accent.red} icon={ErrorOutlineIcon} onClick={() => setDetail(statusDetail("breach", "Off target", "Require action"))} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Computed live" value={liveCount} sub="direct from the registers" accent={accent.navy} icon={BoltIcon} onClick={() => setDetail(liveDetail())} />
        </Grid>
      </Grid>

      <DetailDialog content={detail} onClose={() => setDetail(null)} />

      <Paper sx={{ p: 2, mb: 3, backgroundColor: s.subtleBg }}>
        <Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>
          KPIs marked <Chip label="LIVE" size="small" sx={{ height: 18, fontSize: "0.62rem", fontWeight: 700, backgroundColor: "primary.main", color: "#fff", mx: 0.5 }} component="span" />
          are computed in real time from the underlying registers (room register, findings register, occupancy).
          The remainder carry indicative values pending their assurance registers coming online in Phase 2.
        </Typography>
      </Paper>

      {KPI_DOMAINS.map((domain, idx) => {
        const roll = domainRollup(domain, state);
        const worst = STATUS_META[roll.worst];
        return (
          <AccordionBlock
            key={domain.id}
            title={`Domain ${idx + 1}: ${domain.name}`}
            subtitle={domain.description.replace(/^Objective: /, "")}
            defaultExpanded={idx === 0}
            headerExtra={
              <Chip
                label={`${roll.meets} on target · ${roll.near} near · ${roll.breach} off`}
                size="small"
                sx={{ backgroundColor: worst.bg, color: worst.color, fontWeight: 600 }}
              />
            }
          >
            <TableContainer sx={{ overflowX: "auto" }}>
              <Table size="small" aria-label={`KPIs for ${domain.name}`}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: 180 }}>KPI</TableCell>
                    <TableCell sx={{ minWidth: 220 }}>Measure</TableCell>
                    <TableCell>Assurance source</TableCell>
                    <TableCell>Frequency</TableCell>
                    <TableCell>Target</TableCell>
                    <TableCell sx={{ minWidth: 150 }}>Current</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {domain.kpis.map((kpi) => {
                    const v = kpiValue(kpi, state);
                    const s = STATUS_META[v.status];
                    return (
                      <TableRow key={kpi.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {kpi.name}
                          {v.live && (
                            <Chip
                              label="LIVE"
                              size="small"
                              sx={{ ml: 0.75, height: 16, fontSize: "0.6rem", fontWeight: 700, backgroundColor: "primary.main", color: "#fff" }}
                            />
                          )}
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.8rem", color: "text.secondary" }}>{kpi.definition}</TableCell>
                        <TableCell sx={{ fontSize: "0.8rem" }}>{kpi.sourceRegister}</TableCell>
                        <TableCell sx={{ fontSize: "0.8rem" }}>{kpi.frequency}</TableCell>
                        <TableCell sx={{ fontSize: "0.8rem", fontWeight: 600 }}>{kpi.target}</TableCell>
                        <TableCell>
                          <Chip label={`${v.display} — ${s.label}`} size="small" sx={{ backgroundColor: s.bg, color: s.color, fontWeight: 600 }} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionBlock>
        );
      })}
    </PageShell>
  );
}

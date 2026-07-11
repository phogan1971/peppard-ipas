import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Tooltip from "@mui/material/Tooltip";
import RuleIcon from "@mui/icons-material/Rule";
import PageShell from "../components/PageShell";
import StatCard from "../components/StatCard";
import { setAssessment, useAppState } from "../data/store";
import { sectorDistributionFor, STANDARDS } from "../data/seed";
import { Judgement, JUDGEMENT_LABELS } from "../data/types";
import { brand, compliance, surface } from "../theme/tokens";

const EDITABLE_JUDGEMENTS: Judgement[] = ["compliant", "substantiallyCompliant", "partiallyCompliant", "notCompliant"];

const SEGMENTS: { key: Exclude<Judgement, "notAssessed">; color: string }[] = [
  { key: "compliant", color: compliance.compliant },
  { key: "substantiallyCompliant", color: compliance.substantially },
  { key: "partiallyCompliant", color: compliance.partially },
  { key: "notCompliant", color: compliance.notCompliant },
];

// Stacked distribution of published HIQA judgements for this standard
// across the sector (69 inspections) — colour + tooltip text, and an
// accessible summary label.
function BenchmarkBar({ standardId }: { standardId: string }) {
  const dist = useMemo(() => sectorDistributionFor(standardId), [standardId]);
  if (dist.totalAssessed === 0) {
    return <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>No sector data</Typography>;
  }
  const summary = SEGMENTS.map((s) => `${JUDGEMENT_LABELS[s.key]}: ${dist[s.key]}`).join(", ");
  return (
    <Tooltip title={`Sector (${dist.totalAssessed} inspections) — ${summary}`}>
      <Box
        role="img"
        aria-label={`Sector benchmark for standard ${standardId}: ${summary}`}
        sx={{ display: "flex", height: 10, borderRadius: 5, overflow: "hidden", minWidth: 120, border: `1px solid ${brand.border}` }}
      >
        {SEGMENTS.filter((s) => dist[s.key] > 0).map((s) => (
          <Box key={s.key} sx={{ width: `${(dist[s.key] / dist.totalAssessed) * 100}%`, backgroundColor: s.color }} />
        ))}
      </Box>
    </Tooltip>
  );
}

export default function StandardsRegister() {
  const { centres, assessments } = useAppState();
  const [centreId, setCentreId] = useState(centres[0].id);

  const centre = centres.find((c) => c.id === centreId) ?? centres[0];
  const forCentre = new Map(
    assessments.filter((a) => a.centreId === centreId).map((a) => [a.standardId, a]),
  );

  const counts = { compliant: 0, substantiallyCompliant: 0, partiallyCompliant: 0, notCompliant: 0, notAssessed: 0 };
  for (const std of STANDARDS) {
    const j = forCentre.get(std.id)?.judgement ?? "notAssessed";
    counts[j] += 1;
  }

  const themes = useMemo(() => {
    const byTheme = new Map<number, { name: string; standards: typeof STANDARDS }>();
    for (const std of STANDARDS) {
      if (!byTheme.has(std.themeNumber)) byTheme.set(std.themeNumber, { name: std.themeName, standards: [] });
      byTheme.get(std.themeNumber)!.standards.push(std);
    }
    return [...byTheme.entries()].sort((a, b) => a[0] - b[0]);
  }, []);

  return (
    <PageShell
      icon={RuleIcon}
      title="HIQA Standards"
      subtitle="Self-assessment against the 40 National Standards, benchmarked against published HIQA sector inspections"
      actions={
        <Select
          size="small"
          value={centreId}
          onChange={(e) => setCentreId(e.target.value)}
          aria-label="Select centre"
          sx={{ minWidth: 240, backgroundColor: "#fff" }}
        >
          {centres.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.shortName}
            </MenuItem>
          ))}
        </Select>
      }
    >
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <StatCard label="Compliant" value={counts.compliant} sub={`of ${STANDARDS.length} standards`} accent={compliance.compliant} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label="Substantially" value={counts.substantiallyCompliant} sub="minor gaps identified" accent={compliance.substantially} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label="Partially" value={counts.partiallyCompliant} sub="improvement plans required" accent={compliance.partially} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label="Not compliant" value={counts.notCompliant} sub="priority remediation" accent={compliance.notCompliant} />
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mb: 2, backgroundColor: surface.subtleBg }}>
        <Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>
          {centre.shortName} has not yet been inspected by HIQA — judgements below are internal self-assessments.
          The sector bar shows how the 69 published HIQA IPAS inspections judged each standard, recomputed from the
          raw judgement matrix; n varies per standard as not every inspection assesses every standard.
        </Typography>
      </Paper>

      {themes.map(([themeNo, theme]) => (
        <Paper key={themeNo} sx={{ mb: 2, overflow: "hidden" }}>
          <Box sx={{ px: 2, py: 1.25, backgroundColor: surface.pillRowBg, borderBottom: `1px solid ${brand.border}` }}>
            <Typography sx={{ fontWeight: 700, color: brand.charcoal }}>
              Theme {themeNo}: {theme.name}
            </Typography>
          </Box>
          {theme.standards.map((std) => {
            const assessment = forCentre.get(std.id);
            const judgement = assessment?.judgement ?? "notAssessed";
            return (
              <Box
                key={std.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  px: 2,
                  py: 1.25,
                  borderBottom: `1px solid ${brand.border}`,
                  "&:last-child": { borderBottom: "none" },
                  flexWrap: { xs: "wrap", md: "nowrap" },
                }}
              >
                <Typography sx={{ fontWeight: 700, color: brand.red, width: 40, flexShrink: 0 }}>{std.id}</Typography>
                <Typography sx={{ fontSize: "0.85rem", flexGrow: 1, minWidth: 240 }}>{std.text}</Typography>
                <Box sx={{ width: 150, flexShrink: 0 }}>
                  <Typography sx={{ fontSize: "0.68rem", color: "text.secondary", mb: 0.25 }}>Sector benchmark</Typography>
                  <BenchmarkBar standardId={std.id} />
                </Box>
                <Select
                  size="small"
                  value={judgement}
                  onChange={(e) => setAssessment(centreId, std.id, e.target.value as Judgement)}
                  aria-label={`Judgement for standard ${std.id}`}
                  sx={{
                    minWidth: 200,
                    flexShrink: 0,
                    fontSize: "0.82rem",
                    backgroundColor: {
                      compliant: compliance.compliantBg,
                      substantiallyCompliant: compliance.substantiallyBg,
                      partiallyCompliant: compliance.partiallyBg,
                      notCompliant: compliance.notCompliantBg,
                      notAssessed: compliance.notAssessedBg,
                    }[judgement],
                  }}
                >
                  {(judgement === "notAssessed" ? [...EDITABLE_JUDGEMENTS, "notAssessed" as Judgement] : EDITABLE_JUDGEMENTS).map(
                    (j) => (
                      <MenuItem key={j} value={j} sx={{ fontSize: "0.82rem" }}>
                        {JUDGEMENT_LABELS[j]}
                      </MenuItem>
                    ),
                  )}
                </Select>
              </Box>
            );
          })}
        </Paper>
      ))}
    </PageShell>
  );
}

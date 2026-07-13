import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import Select from "@mui/material/Select";
import Tooltip from "@mui/material/Tooltip";
import RuleIcon from "@mui/icons-material/Rule";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import Chip from "@mui/material/Chip";
import PageShell from "../components/PageShell";
import StatCard from "../components/StatCard";
import AccordionBlock from "../components/AccordionBlock";
import DetailDialog, { DetailContent, DetailRow } from "../components/DetailDialog";
import { setAssessment, useAppState } from "../data/store";
import { sectorDistributionFor, STANDARDS } from "../data/seed";
import { Judgement, JUDGEMENT_LABELS, StandardAssessment } from "../data/types";
import { brand, compliance, accent } from "../theme/tokens";
import { useSurfaces } from "../theme";

const GROUP = "__group__"; // sentinel: the all-centres roll-up

const EDITABLE_JUDGEMENTS: Judgement[] = ["compliant", "substantiallyCompliant", "partiallyCompliant", "notCompliant"];

type ScoredJudgement = Exclude<Judgement, "notAssessed">;

const SEGMENTS: { key: ScoredJudgement; color: string }[] = [
  { key: "compliant", color: compliance.compliant },
  { key: "substantiallyCompliant", color: compliance.substantially },
  { key: "partiallyCompliant", color: compliance.partially },
  { key: "notCompliant", color: compliance.notCompliant },
];

// Judgement → chip colours (the token keys don't mirror the Judgement names)
const JUDGEMENT_COLORS: Record<ScoredJudgement, { color: string; bg: string }> = {
  compliant: { color: compliance.compliant, bg: compliance.compliantBg },
  substantiallyCompliant: { color: compliance.substantially, bg: compliance.substantiallyBg },
  partiallyCompliant: { color: compliance.partially, bg: compliance.partiallyBg },
  notCompliant: { color: compliance.notCompliant, bg: compliance.notCompliantBg },
};

interface Distribution {
  compliant: number;
  substantiallyCompliant: number;
  partiallyCompliant: number;
  notCompliant: number;
  total: number;
}

// A stacked distribution bar (Peppard group or published sector) — colour +
// tooltip + accessible summary, shared shape for both so they read alike.
function DistributionBar({ dist, label }: { dist: Distribution; label: string }) {
  if (dist.total === 0) {
    return <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>No data</Typography>;
  }
  const summary = SEGMENTS.map((s) => `${JUDGEMENT_LABELS[s.key]}: ${dist[s.key]}`).join(", ");
  return (
    <Tooltip title={`${label} (${dist.total}) — ${summary}`}>
      <Box
        role="img"
        aria-label={`${label} for this standard: ${summary}`}
        sx={{ display: "flex", height: 10, borderRadius: 5, overflow: "hidden", minWidth: 120, border: `1px solid ${brand.border}` }}
      >
        {SEGMENTS.filter((s) => dist[s.key] > 0).map((s) => (
          <Box key={s.key} sx={{ width: `${(dist[s.key] / dist.total) * 100}%`, backgroundColor: s.color }} />
        ))}
      </Box>
    </Tooltip>
  );
}

// Published-sector distribution for a standard (69 HIQA inspections).
function SectorBar({ standardId }: { standardId: string }) {
  const d = useMemo(() => sectorDistributionFor(standardId), [standardId]);
  const dist: Distribution = {
    compliant: d.compliant,
    substantiallyCompliant: d.substantiallyCompliant,
    partiallyCompliant: d.partiallyCompliant,
    notCompliant: d.notCompliant,
    total: d.totalAssessed,
  };
  return <DistributionBar dist={dist} label={`Sector, ${d.totalAssessed} inspections`} />;
}

export default function StandardsRegister() {
  const { centres, assessments } = useAppState();
  const s = useSurfaces();
  // Open on the group position — the page is about the whole portfolio, not
  // one centre; a specific centre is a drill-in from here.
  const [centreId, setCentreId] = useState<string>(GROUP);
  const isGroup = centreId === GROUP;

  const centre = centres.find((c) => c.id === centreId) ?? centres[0];

  // centreId → (standardId → assessment), for both the single and group views.
  const byCentre = useMemo(() => {
    const m = new Map<string, Map<string, StandardAssessment>>();
    for (const a of assessments) {
      if (!m.has(a.centreId)) m.set(a.centreId, new Map());
      m.get(a.centreId)!.set(a.standardId, a);
    }
    return m;
  }, [assessments]);

  const forCentre = byCentre.get(centreId) ?? new Map<string, StandardAssessment>();

  // Peppard's own spread for a standard across all centres (group view).
  const groupDistributionFor = (standardId: string): Distribution => {
    const d: Distribution = { compliant: 0, substantiallyCompliant: 0, partiallyCompliant: 0, notCompliant: 0, total: 0 };
    for (const c of centres) {
      const j = byCentre.get(c.id)?.get(standardId)?.judgement;
      if (j && j !== "notAssessed") {
        d[j] += 1;
        d.total += 1;
      }
    }
    return d;
  };

  // Stat-card totals: 40 standards for one centre, 40 × 8 for the group.
  const counts = { compliant: 0, substantiallyCompliant: 0, partiallyCompliant: 0, notCompliant: 0, notAssessed: 0 };
  const scope = isGroup ? centres : [centre];
  for (const c of scope) {
    const m = byCentre.get(c.id);
    for (const std of STANDARDS) counts[m?.get(std.id)?.judgement ?? "notAssessed"] += 1;
  }
  const denom = STANDARDS.length * scope.length;
  const scopeLabel = isGroup ? "all 8 centres" : centre.shortName;

  const [detail, setDetail] = useState<DetailContent | null>(null);

  const judgementDetail = (judgement: ScoredJudgement, sub: string): DetailContent => {
    const rows: DetailRow[] = isGroup
      ? centres.flatMap((c) =>
          STANDARDS.filter((std) => (byCentre.get(c.id)?.get(std.id)?.judgement ?? "notAssessed") === judgement).map((std) => ({
            id: `${c.id}-${std.id}`,
            filterValue: c.id,
            leading: (
              <Chip label={std.id} size="small" sx={{ height: 22, minWidth: 44, fontWeight: 700, fontSize: "0.72rem", color: JUDGEMENT_COLORS[judgement].color, backgroundColor: JUDGEMENT_COLORS[judgement].bg }} />
            ),
            primary: `${c.shortName} · ${std.text}`,
            secondary: `Theme ${std.themeNumber}: ${std.themeName}`,
          })),
        )
      : STANDARDS.filter((std) => (forCentre.get(std.id)?.judgement ?? "notAssessed") === judgement).map((std) => ({
          id: std.id,
          leading: (
            <Chip label={std.id} size="small" sx={{ height: 22, minWidth: 44, fontWeight: 700, fontSize: "0.72rem", color: JUDGEMENT_COLORS[judgement].color, backgroundColor: JUDGEMENT_COLORS[judgement].bg }} />
          ),
          primary: std.text,
          secondary: `Theme ${std.themeNumber}: ${std.themeName}`,
        }));
    // In group mode, offer a facility filter — only for centres that actually
    // have a standard at this judgement, so no option lands on an empty list.
    const centresPresent = new Set(rows.map((r) => r.filterValue).filter(Boolean));
    return {
      title: `${JUDGEMENT_LABELS[judgement]} — ${isGroup ? "All centres" : centre.shortName}`,
      subtitle: sub,
      rows,
      emptyText: `No standards judged ${JUDGEMENT_LABELS[judgement].toLowerCase()} at ${scopeLabel}.`,
      filter: isGroup
        ? {
            allLabel: "All centres",
            options: centres.filter((c) => centresPresent.has(c.id)).map((c) => ({ value: c.id, label: c.shortName })),
          }
        : undefined,
    };
  };

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
          aria-label="Select centre or the group roll-up"
          sx={{ minWidth: 240, backgroundColor: "background.paper" }}
        >
          <MenuItem value={GROUP}>All centres (group position)</MenuItem>
          <Divider component="li" />
          {centres.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.shortName}
            </MenuItem>
          ))}
        </Select>
      }
    >
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Compliant" value={counts.compliant} sub={`of ${denom} assessments`} accent={accent.green} icon={CheckCircleOutlineIcon} onClick={() => setDetail(judgementDetail("compliant", `${counts.compliant} of ${denom} fully compliant across ${scopeLabel}`))} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Substantially compliant" value={counts.substantiallyCompliant} sub="minor gaps identified" accent={accent.blue} icon={TaskAltIcon} onClick={() => setDetail(judgementDetail("substantiallyCompliant", "Minor gaps identified"))} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Partially compliant" value={counts.partiallyCompliant} sub="improvement plans required" accent={accent.orange} icon={InfoOutlinedIcon} onClick={() => setDetail(judgementDetail("partiallyCompliant", "Improvement plans required"))} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Not compliant" value={counts.notCompliant} sub="priority remediation" accent={accent.red} icon={ErrorOutlineIcon} onClick={() => setDetail(judgementDetail("notCompliant", "Priority remediation"))} />
        </Grid>
      </Grid>

      <DetailDialog content={detail} onClose={() => setDetail(null)} />

      <Paper sx={{ p: 2, mb: 2, backgroundColor: s.subtleBg }}>
        <Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>
          {isGroup
            ? "Peppard has not yet been inspected by HIQA — judgements are internal self-assessments across all 8 centres. Each standard shows how the group's own centres self-assess (Peppard bar) beside how the 69 published HIQA IPAS inspections judged it (sector bar). Pick a centre above to view and edit its individual return."
            : `${centre.shortName} has not yet been inspected by HIQA — judgements below are internal self-assessments. The sector bar shows how the 69 published HIQA IPAS inspections judged each standard, recomputed from the raw judgement matrix; n varies per standard as not every inspection assesses every standard.`}
        </Typography>
      </Paper>

      {themes.map(([themeNo, theme]) => {
        const belowSubstantial = isGroup
          ? centres.reduce(
              (sum, c) =>
                sum +
                theme.standards.filter((std) => {
                  const j = byCentre.get(c.id)?.get(std.id)?.judgement;
                  return j === "partiallyCompliant" || j === "notCompliant";
                }).length,
              0,
            )
          : theme.standards.filter((std) => {
              const j = forCentre.get(std.id)?.judgement;
              return j === "partiallyCompliant" || j === "notCompliant";
            }).length;
        return (
          <AccordionBlock
            key={themeNo}
            title={`Theme ${themeNo}: ${theme.name}`}
            subtitle={`${theme.standards.length} standards`}
            defaultExpanded={themeNo === 1}
            headerExtra={
              belowSubstantial > 0 ? (
                <Chip
                  label={`${belowSubstantial} below substantial`}
                  size="small"
                  sx={{ backgroundColor: compliance.partiallyBg, color: compliance.partially, fontWeight: 600 }}
                />
              ) : (
                <Chip
                  label="On track"
                  size="small"
                  sx={{ backgroundColor: compliance.compliantBg, color: compliance.compliant, fontWeight: 600 }}
                />
              )
            }
          >
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
                  <Typography sx={{ fontWeight: 700, color: s.heading, width: 40, flexShrink: 0 }}>{std.id}</Typography>
                  <Typography sx={{ fontSize: "0.85rem", flexGrow: 1, minWidth: 240 }}>{std.text}</Typography>
                  <Box sx={{ width: 150, flexShrink: 0 }}>
                    <Typography sx={{ fontSize: "0.68rem", color: "text.secondary", mb: 0.25 }}>Sector benchmark</Typography>
                    <SectorBar standardId={std.id} />
                  </Box>
                  {isGroup ? (
                    <Box sx={{ width: 200, flexShrink: 0 }}>
                      <Typography sx={{ fontSize: "0.68rem", color: "text.secondary", mb: 0.25 }}>Peppard (8 centres)</Typography>
                      <DistributionBar dist={groupDistributionFor(std.id)} label="Peppard, 8 centres" />
                    </Box>
                  ) : (
                    <Select
                      size="small"
                      value={judgement}
                      onChange={(e) => setAssessment(centreId, std.id, e.target.value as Judgement)}
                      aria-label={`Judgement for standard ${std.id}`}
                      sx={{
                        minWidth: 200,
                        flexShrink: 0,
                        fontSize: "0.82rem",
                        "& .MuiSelect-select": { color: brand.charcoal },
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
                  )}
                </Box>
              );
            })}
          </AccordionBlock>
        );
      })}
    </PageShell>
  );
}

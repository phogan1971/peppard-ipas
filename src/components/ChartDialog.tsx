import { Suspense, lazy, useEffect, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";
import CloseIcon from "@mui/icons-material/Close";
import BarChartIcon from "@mui/icons-material/BarChart";
import PieChartOutlineIcon from "@mui/icons-material/PieChartOutline";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import { useTheme } from "@mui/material/styles";
import { useSurfaces } from "../theme";
import ErrorBoundary from "./ErrorBoundary";

// recharts (and its d3 deps) live in ChartCanvas so they load as a lazy
// chunk only when a chart is actually opened, keeping them out of the
// main bundle.
const ChartCanvas = lazy(() => import("./ChartCanvas"));

export type ChartType = "bar" | "pie" | "line";

export interface ChartDatum {
  name: string;
  value: number;
  color?: string;
}

export interface ChartContent {
  title: string;
  subtitle?: string;
  data: ChartDatum[];
  types?: ChartType[]; // toggles to offer (default: bar, pie, line)
  defaultType?: ChartType;
  valueLabel?: string; // series / tooltip label
  emptyText?: string;
}

// Animate the chart in on mount, unless the viewer prefers reduced motion.
// (recharts animation is driven by requestAnimationFrame, so it only runs
// in a visible tab — a backgrounded/headless tab renders the final frame.)
const ANIMATE = typeof window !== "undefined" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const TYPE_ICON = { bar: BarChartIcon, pie: PieChartOutlineIcon, line: ShowChartIcon };
const TYPE_LABEL = { bar: "Bar", pie: "Pie", line: "Line" };

// Drill-down for a summary stat card whose figure is best read as a
// distribution or comparison: an animated chart with a bar/pie/line
// toggle. Content (the dataset + sensible default type) is supplied by the
// caller so the dialog stays reusable.
export default function ChartDialog({ content, onClose }: { content: ChartContent | null; onClose: () => void }) {
  const s = useSurfaces();
  const theme = useTheme();
  const types = content?.types ?? ["bar", "pie", "line"];
  const [type, setType] = useState<ChartType>(content?.defaultType ?? types[0]);
  // recharts' ResponsiveContainer measures its parent on mount; if that
  // happens while the dialog is still mid-open-transition (width 0) an
  // animated pie computes its geometry at size 0 and never redraws. Gate
  // the chart on the dialog's onEntered so it mounts at final size.
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (content) setType(content.defaultType ?? (content.types ?? ["bar", "pie", "line"])[0]);
  }, [content]);

  const valueLabel = content?.valueLabel ?? "Value";
  const tooltipStyle = { backgroundColor: s.cardBg, border: `1px solid ${s.border}`, borderRadius: 8, color: theme.palette.text.primary };
  const data = content?.data ?? [];

  return (
    <Dialog
      open={content !== null}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { maxHeight: "min(640px, 90vh)" } }}
      TransitionProps={{ onEntered: () => setEntered(true), onExited: () => setEntered(false) }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", px: 2.5, py: 1.5, borderBottom: `1px solid ${s.border}` }}>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="h6">{content?.title}</Typography>
          {content?.subtitle && <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>{content.subtitle}</Typography>}
        </Box>
        <IconButton aria-label="Close chart" onClick={onClose} size="small" sx={{ ml: 1 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 2.5 }}>
        {types.length > 1 && (
          <ToggleButtonGroup
            size="small"
            exclusive
            value={type}
            onChange={(_, v) => v && setType(v)}
            aria-label="Chart type"
            sx={{ mb: 2 }}
          >
            {types.map((t) => {
              const Icon = TYPE_ICON[t];
              return (
                <ToggleButton key={t} value={t} aria-label={`${TYPE_LABEL[t]} chart`} sx={{ textTransform: "none", px: 1.5 }}>
                  <Tooltip title={`${TYPE_LABEL[t]} chart`}>
                    <Icon fontSize="small" />
                  </Tooltip>
                </ToggleButton>
              );
            })}
          </ToggleButtonGroup>
        )}

        {data.length === 0 ? (
          <Typography sx={{ py: 4, textAlign: "center", fontSize: "0.9rem", color: "text.secondary" }}>
            {content?.emptyText ?? "No data to chart."}
          </Typography>
        ) : (
          <Box sx={{ width: "100%", height: 320 }}>
            {/* only mount once the dialog has finished opening (see `entered`);
                Suspense covers the lazy recharts chunk on first open */}
            {entered && (
              // A failed chunk load (e.g. the site was redeployed while this
              // tab was open) must stay contained in the dialog, not crash the
              // whole page — the boundary offers a retry and resets per open.
              <ErrorBoundary
                resetKey={type}
                fallback={(_e, reset) => (
                  <Box sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1 }}>
                    <Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>The chart couldn't load.</Typography>
                    <Button size="small" variant="outlined" onClick={reset}>Try again</Button>
                  </Box>
                )}
              >
                <Suspense fallback={<Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><CircularProgress size={28} /></Box>}>
                  <ChartCanvas
                    type={type}
                    data={data}
                    valueLabel={valueLabel}
                    animate={ANIMATE}
                    axisFill={theme.palette.text.secondary}
                    tooltipStyle={tooltipStyle}
                    gridStroke={s.border}
                    cursorFill={s.hoverBg}
                  />
                </Suspense>
              </ErrorBoundary>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

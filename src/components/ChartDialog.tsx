import { useEffect, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import CloseIcon from "@mui/icons-material/Close";
import BarChartIcon from "@mui/icons-material/BarChart";
import PieChartOutlineIcon from "@mui/icons-material/PieChartOutline";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import { useTheme } from "@mui/material/styles";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  Legend,
  Tooltip as RTooltip,
} from "recharts";
import { accent } from "../theme/tokens";
import { useSurfaces } from "../theme";

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

const PALETTE = [accent.navy, accent.blue, accent.green, accent.orange, accent.purple, accent.red];
// Animate the chart in on mount, unless the viewer prefers reduced motion.
// (recharts animation is driven by requestAnimationFrame, so it only runs
// in a visible tab — a backgrounded/headless tab renders the final frame.)
const ANIMATE = typeof window !== "undefined" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const TYPE_ICON = { bar: BarChartIcon, pie: PieChartOutlineIcon, line: ShowChartIcon };
const TYPE_LABEL = { bar: "Bar", pie: "Pie", line: "Line" };

// Drill-down for a summary stat card whose figure is best read as a
// distribution or comparison: an animated recharts chart with a
// bar/pie/line toggle. Content (the dataset + sensible default type) is
// supplied by the caller so the dialog stays reusable.
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

  const colorAt = (i: number, d: ChartDatum) => d.color ?? PALETTE[i % PALETTE.length];
  const axisTick = { fontSize: 11, fill: theme.palette.text.secondary };
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
            {/* key by type so switching remounts and re-runs the entry animation;
                only render once the dialog has finished opening (see `entered`) */}
            {entered && (
            <ResponsiveContainer key={type} width="100%" height="100%">
              {type === "pie" ? (
                <PieChart>
                  <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} innerRadius={45} paddingAngle={2} isAnimationActive={ANIMATE} animationDuration={700}>
                    {data.map((d, i) => (
                      <Cell key={i} fill={colorAt(i, d)} />
                    ))}
                  </Pie>
                  <RTooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              ) : type === "line" ? (
                <LineChart data={data} margin={{ top: 8, right: 12, bottom: 8, left: -12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={s.border} />
                  <XAxis dataKey="name" tick={axisTick} interval={0} />
                  <YAxis allowDecimals={false} tick={axisTick} />
                  <RTooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="value" name={valueLabel} stroke={accent.navy} strokeWidth={2} isAnimationActive={ANIMATE} animationDuration={700} />
                </LineChart>
              ) : (
                <BarChart data={data} margin={{ top: 8, right: 12, bottom: 8, left: -12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={s.border} vertical={false} />
                  <XAxis dataKey="name" tick={axisTick} interval={0} />
                  <YAxis allowDecimals={false} tick={axisTick} />
                  <RTooltip contentStyle={tooltipStyle} cursor={{ fill: s.hoverBg }} />
                  <Bar dataKey="value" name={valueLabel} radius={[4, 4, 0, 0]} isAnimationActive={ANIMATE} animationDuration={700}>
                    {data.map((d, i) => (
                      <Cell key={i} fill={colorAt(i, d)} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

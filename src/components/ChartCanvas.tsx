import { useLayoutEffect, useRef, useState } from "react";
import {
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
import type { ChartType, ChartDatum } from "./ChartDialog";

const PALETTE = [accent.navy, accent.blue, accent.green, accent.orange, accent.purple, accent.red];
const HEIGHT = 300;

export interface ChartCanvasProps {
  type: ChartType;
  data: ChartDatum[];
  valueLabel: string;
  animate: boolean;
  axisFill: string;
  tooltipStyle: React.CSSProperties;
  gridStroke: string;
  cursorFill: string;
}

// The recharts rendering, split out so the whole recharts/d3 bundle is a
// lazy chunk that only loads when a chart is actually opened. Width is
// measured synchronously (useLayoutEffect) and passed explicitly rather
// than via ResponsiveContainer, so the chart draws deterministically even
// when mounted from the lazy commit (ResponsiveContainer's async resize
// measurement can miss in that path).
export default function ChartCanvas({ type, data, valueLabel, animate, axisFill, tooltipStyle, gridStroke, cursorFill }: ChartCanvasProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const measure = () => ref.current && setWidth(ref.current.offsetWidth);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const colorAt = (i: number, d: ChartDatum) => d.color ?? PALETTE[i % PALETTE.length];
  const axisTick = { fontSize: 11, fill: axisFill };
  const dims = { width, height: HEIGHT };

  return (
    <div ref={ref} style={{ width: "100%", height: HEIGHT }}>
      {width > 0 &&
        (type === "pie" ? (
          <PieChart {...dims}>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={105} innerRadius={45} paddingAngle={2} isAnimationActive={animate} animationDuration={700}>
              {data.map((d, i) => (
                <Cell key={i} fill={colorAt(i, d)} />
              ))}
            </Pie>
            <RTooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        ) : type === "line" ? (
          <LineChart {...dims} data={data} margin={{ top: 8, right: 16, bottom: 8, left: -12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="name" tick={axisTick} interval={0} />
            <YAxis allowDecimals={false} tick={axisTick} />
            <RTooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="value" name={valueLabel} stroke={accent.navy} strokeWidth={2} isAnimationActive={animate} animationDuration={700} />
          </LineChart>
        ) : (
          <BarChart {...dims} data={data} margin={{ top: 8, right: 16, bottom: 8, left: -12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
            <XAxis dataKey="name" tick={axisTick} interval={0} />
            <YAxis allowDecimals={false} tick={axisTick} />
            <RTooltip contentStyle={tooltipStyle} cursor={{ fill: cursorFill }} />
            <Bar dataKey="value" name={valueLabel} radius={[4, 4, 0, 0]} isAnimationActive={animate} animationDuration={700}>
              {data.map((d, i) => (
                <Cell key={i} fill={colorAt(i, d)} />
              ))}
            </Bar>
          </BarChart>
        ))}
    </div>
  );
}

import { ReactNode } from "react";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { brand } from "../theme/tokens";

interface StatCardProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: string; // left border accent — defaults to brand red
}

export default function StatCard({ label, value, sub, accent = brand.red }: StatCardProps) {
  return (
    <Paper sx={{ p: 2, borderLeft: `4px solid ${accent}`, height: "100%" }}>
      <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: "1.9rem", fontWeight: 700, color: brand.charcoal, lineHeight: 1.2, my: 0.5 }}>
        {value}
      </Typography>
      {sub && (
        <Box component="span" sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
          {sub}
        </Box>
      )}
    </Paper>
  );
}

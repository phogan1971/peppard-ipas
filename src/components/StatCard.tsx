import { ReactNode } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { SvgIconComponent } from "@mui/icons-material";
import { accent } from "../theme/tokens";

interface StatCardProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: string; // Genesis accent palette (tokens.accent)
  icon?: SvgIconComponent;
}

// Genisis3 "Alert Summary" statistic card: large coloured value top-left,
// label below, tinted icon chip top-right, lift on hover.
export default function StatCard({ label, value, sub, accent: accentColor = accent.navy, icon: Icon }: StatCardProps) {
  return (
    <Card
      sx={{
        height: "100%",
        backgroundColor: "#fff",
        transition: "all 0.2s ease",
        "&:hover": { transform: "translateY(-2px)", boxShadow: 6 },
      }}
    >
      <CardContent
        sx={{
          position: "relative",
          padding: "14px",
          minHeight: "100px",
          "&:last-child": { paddingBottom: "14px" },
        }}
      >
        {Icon && (
          <Box
            sx={{
              position: "absolute",
              top: 10,
              right: 10,
              backgroundColor: accentColor + "15",
              borderRadius: 2,
              width: 48,
              height: 48,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon sx={{ fontSize: 26, color: accentColor }} />
          </Box>
        )}
        <Typography sx={{ fontSize: "1.9rem", fontWeight: 700, color: accentColor, lineHeight: 1.2, pr: 6 }}>
          {value}
        </Typography>
        <Typography sx={{ fontSize: "0.95rem", fontWeight: 500, color: "text.secondary", mt: 0.5, pr: 4 }}>
          {label}
        </Typography>
        {sub && (
          <Typography component="div" sx={{ fontSize: "0.75rem", color: "text.secondary", mt: 0.25 }}>
            {sub}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

import { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import PrintIcon from "@mui/icons-material/Print";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import { brand } from "../theme/tokens";

export function SectionTitle({ n, children }: { n: number | string; children: string }) {
  return (
    <Typography
      variant="h6"
      sx={{ color: brand.charcoal, borderBottom: `2px solid ${brand.primary}`, pb: 0.5, mb: 1.5, mt: 3, fontSize: "1.05rem" }}
    >
      {n}. {children}
    </Typography>
  );
}

interface PrintDocShellProps {
  backTo: string;
  backLabel: string;
  title: string;
  subtitle: string;
  footer: string;
  children: ReactNode;
}

// Shared frame for the generated documents (readiness pack, board pack,
// Department return): screen toolbar hidden in print, logo header,
// A4-ish column, sourcing footer.
export default function PrintDocShell({ backTo, backLabel, title, subtitle, footer, children }: PrintDocShellProps) {
  const navigate = useNavigate();
  return (
    <Box sx={{ backgroundColor: "#fff", minHeight: "calc(100vh - 64px)" }}>
      <Box
        sx={{
          displayPrint: "none",
          px: 3,
          py: 1.5,
          borderBottom: `1px solid ${brand.border}`,
          display: "flex",
          gap: 1,
          alignItems: "center",
        }}
      >
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(backTo)} sx={{ color: brand.charcoal }}>
          {backLabel}
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button variant="contained" disableElevation startIcon={<PrintIcon />} onClick={() => window.print()}>
          Print / save as PDF
        </Button>
      </Box>

      <Box sx={{ maxWidth: 900, mx: "auto", px: 4, py: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
          <Box component="img" src="/peppard-logo.jpg" alt="Peppard Investments" sx={{ height: 56 }} />
          <Box>
            <Typography variant="h5" sx={{ color: brand.charcoal, fontSize: "1.5rem" }}>
              {title}
            </Typography>
            <Typography sx={{ fontSize: "0.9rem", color: "text.secondary" }}>{subtitle}</Typography>
          </Box>
        </Box>

        {children}

        <Typography
          sx={{ fontSize: "0.75rem", color: "text.secondary", mt: 4, borderTop: `1px solid ${brand.border}`, pt: 1 }}
        >
          {footer}
        </Typography>
      </Box>
    </Box>
  );
}

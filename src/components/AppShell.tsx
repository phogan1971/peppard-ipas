import { ReactNode } from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { brand, surface } from "../theme/tokens";

// White top bar carrying the Peppard logo — brand red is reserved for
// accents so it never competes with RAG status colours below it.
export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: surface.pageBg }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          backgroundColor: "#fff",
          borderBottom: `1px solid ${brand.border}`,
          color: brand.charcoal,
        }}
      >
        <Toolbar sx={{ minHeight: 64, gap: 1.5 }}>
          <Box
            component="img"
            src="/peppard-logo.jpg"
            alt="Peppard Investments"
            sx={{ height: 44, width: "auto" }}
          />
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <Typography
              variant="h6"
              sx={{ fontSize: "1.05rem", lineHeight: 1.2, color: brand.charcoal }}
            >
              IPAS Operator Dashboard
            </Typography>
            <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
              Peppard Investments — 8 accommodation centres
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>
      {/* offset for the fixed 64px AppBar */}
      <Box sx={{ pt: "64px" }}>{children}</Box>
    </Box>
  );
}

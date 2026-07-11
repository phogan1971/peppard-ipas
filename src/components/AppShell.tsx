import { ReactNode } from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { useNavigate } from "react-router-dom";
import { brand, surface, fonts } from "../theme/tokens";
import { resetDemoData } from "../data/store";
import ErrorBoundary from "./ErrorBoundary";

// Origin Care Group lockup: donut mark + wordmark, composed in code so it
// scales and recolours cleanly (the site only serves the mark as an image).
export function OriginLogo({ height = 36, dark = false }: { height?: number; dark?: boolean }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Box component="img" src="/origin-mark.png" alt="" sx={{ height, width: height }} />
      <Box sx={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <Typography
          component="span"
          sx={{
            fontFamily: fonts.body,
            fontWeight: 800,
            fontSize: `${height * 0.52}px`,
            color: dark ? "#fff" : brand.primary,
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}
        >
          origin.
        </Typography>
        <Typography
          component="span"
          sx={{
            fontFamily: fonts.body,
            fontWeight: 700,
            fontSize: `${height * 0.22}px`,
            color: brand.green,
            letterSpacing: "0.28em",
            lineHeight: 1.4,
          }}
        >
          CARE GROUP
        </Typography>
      </Box>
    </Box>
  );
}

// White banner: Origin (the platform provider) top-left, Peppard (the
// operator) centred, utilities right. Brand navy is structural; alert red
// now only ever means a RED finding.
export default function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: surface.pageBg }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          backgroundColor: "#fff",
          borderBottom: `1px solid ${brand.border}`,
          color: brand.charcoal,
          displayPrint: "none",
        }}
      >
        <Toolbar sx={{ minHeight: 64, position: "relative" }}>
          <Box
            onClick={() => navigate("/")}
            role="link"
            aria-label="Back to platform home"
            sx={{ cursor: "pointer", display: "flex", alignItems: "center" }}
          >
            <OriginLogo height={34} />
          </Box>

          <Box
            sx={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              alignItems: "center",
              gap: 1.25,
            }}
          >
            <Box component="img" src="/peppard-logo.jpg" alt="Peppard Investments" sx={{ height: 46, width: "auto" }} />
            <Box sx={{ display: { xs: "none", md: "flex" }, flexDirection: "column" }}>
              <Typography variant="h6" sx={{ fontSize: "1rem", lineHeight: 1.2, color: brand.primary }}>
                IPAS Operator Dashboard
              </Typography>
              <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
                8 accommodation centres
              </Typography>
            </Box>
          </Box>

          <Box sx={{ flexGrow: 1 }} />
          <Button
            size="small"
            startIcon={<RestartAltIcon />}
            onClick={() => {
              resetDemoData();
              window.location.assign("/overview");
            }}
            sx={{ color: "text.secondary", fontSize: "0.75rem" }}
          >
            Reset demo
          </Button>
        </Toolbar>
      </AppBar>
      {/* offset for the fixed 64px AppBar */}
      <Box sx={{ pt: "64px", "@media print": { pt: 0 } }}>
        <ErrorBoundary>{children}</ErrorBoundary>
      </Box>
    </Box>
  );
}

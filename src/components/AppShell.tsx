import { ReactNode, useState } from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import SettingsIcon from "@mui/icons-material/Settings";
import { useNavigate } from "react-router-dom";
import { brand, surface, fonts } from "../theme/tokens";
import ErrorBoundary from "./ErrorBoundary";
import SettingsDialog from "./SettingsDialog";

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

// Genesis-style navy top bar (Genisis3 AppHeader: hsl(199,57%,23%)):
// Origin lockup (white variant) top-left, Peppard identity centred in a
// white chip so the logo's white background reads as intentional.
export default function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: surface.pageBg }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          backgroundColor: brand.topBar,
          color: "#fff",
          displayPrint: "none",
        }}
      >
        <Toolbar sx={{ minHeight: 64, position: "relative", backgroundColor: brand.topBar }}>
          <Box
            onClick={() => navigate("/")}
            role="link"
            aria-label="Back to platform home"
            sx={{ cursor: "pointer", display: "flex", alignItems: "center" }}
          >
            {/* Official white lockup — supplied asset, used verbatim */}
            <Box
              component="img"
              src="/origin-logo-white.png"
              alt="Origin Care Group"
              sx={{ height: 42, width: "auto" }}
            />
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
            <Box
              sx={{
                backgroundColor: "#fff",
                borderRadius: "8px",
                px: 1,
                py: 0.4,
                display: "flex",
                alignItems: "center",
              }}
            >
              <Box component="img" src="/peppard-logo.jpg" alt="Peppard Investments" sx={{ height: 40, width: "auto" }} />
            </Box>
            <Box sx={{ display: { xs: "none", md: "flex" }, flexDirection: "column" }}>
              <Typography sx={{ fontSize: "1rem", fontWeight: 600, lineHeight: 1.2, color: "#fff" }}>
                IPAS Operator Dashboard
              </Typography>
              <Typography sx={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.7)" }}>
                8 accommodation centres
              </Typography>
            </Box>
          </Box>

          <Box sx={{ flexGrow: 1 }} />
          <IconButton
            aria-label="Settings"
            onClick={() => setSettingsOpen(true)}
            sx={{ color: "rgba(255,255,255,0.85)", "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" } }}
          >
            <SettingsIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      {/* offset for the fixed 64px AppBar */}
      <Box sx={{ pt: "64px", "@media print": { pt: 0 } }}>
        <ErrorBoundary>{children}</ErrorBoundary>
      </Box>
    </Box>
  );
}

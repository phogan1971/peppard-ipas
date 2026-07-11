import { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import { SvgIconComponent } from "@mui/icons-material";
import PortalSubNav from "./PortalSubNav";
import { useSurfaces } from "../theme";

interface PageShellProps {
  icon: SvgIconComponent;
  title: string;
  subtitle: string;
  actions?: ReactNode;
  children: ReactNode;
}

// Genesis standard page shell: sticky sub-nav under the 64px AppBar,
// icon + h5 title block, divider, then content.
export default function PageShell({ icon: Icon, title, subtitle, actions, children }: PageShellProps) {
  const s = useSurfaces();
  return (
    <Box sx={{ px: 2, pb: 2, backgroundColor: s.pageBg, minHeight: "calc(100vh - 64px)" }}>
      <Box
        sx={{
          position: "sticky",
          top: 64,
          zIndex: 100,
          backgroundColor: s.subNavBg,
          mx: -2,
          px: 2,
          py: 1,
          mb: 2,
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          borderBottom: `1px solid ${s.border}`,
        }}
      >
        <PortalSubNav />
      </Box>

      <Box sx={{ mb: 2, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <Icon sx={{ color: s.heading, fontSize: 28 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, fontSize: "1.75rem" }}>
              {title}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: "14px" }}>
            {subtitle}
          </Typography>
        </Box>
        {actions}
      </Box>

      <Divider sx={{ mb: 3 }} />

      {children}
    </Box>
  );
}

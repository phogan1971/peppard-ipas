import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ApartmentIcon from "@mui/icons-material/Apartment";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import RuleIcon from "@mui/icons-material/Rule";
import InsightsIcon from "@mui/icons-material/Insights";
import { SvgIconComponent } from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import { brand } from "../theme/tokens";
import { useSurfaces } from "../theme";

interface NavItem {
  label: string;
  path: string;
  Icon: SvgIconComponent;
  isActive: (pathname: string) => boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Group Overview", path: "/overview", Icon: DashboardIcon, isActive: (p) => p === "/overview" },
  {
    label: "Centre Operations",
    path: "/centres/riverside",
    Icon: ApartmentIcon,
    isActive: (p) => p.startsWith("/centres"),
  },
  {
    label: "Findings & Actions",
    path: "/findings",
    Icon: FactCheckIcon,
    isActive: (p) => p.startsWith("/findings"),
  },
  {
    label: "Compliance",
    path: "/compliance",
    Icon: VerifiedUserIcon,
    isActive: (p) => p.startsWith("/compliance"),
  },
  {
    label: "HIQA Standards",
    path: "/standards",
    Icon: RuleIcon,
    isActive: (p) => p.startsWith("/standards"),
  },
  {
    label: "KPI Framework",
    path: "/kpis",
    Icon: InsightsIcon,
    isActive: (p) => p.startsWith("/kpis"),
  },
];

// Genisis3 PortalSubNav pattern verbatim on desktop: pills inside a
// #f0f2f5 rounded container. On phones the six pills would wrap into
// three sticky rows, so the nav collapses to a burger + section label
// opening a navigation drawer.
export default function PortalSubNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const s = useSurfaces();
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (compact) {
    const current = NAV_ITEMS.find((i) => i.isActive(pathname));
    const CurrentIcon = current?.Icon ?? DashboardIcon;
    return (
      <>
        <Box
          component="nav"
          aria-label="Dashboard sections"
          sx={{
            backgroundColor: s.pillRowBg,
            borderRadius: "8px",
            padding: "4px 8px 4px 4px",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <IconButton aria-label="Open section menu" onClick={() => setDrawerOpen(true)} sx={{ color: s.pillIdleColor }}>
            <MenuIcon />
          </IconButton>
          <CurrentIcon sx={{ color: s.pillIdleColor, fontSize: 20 }} />
          <Typography sx={{ fontWeight: 600, fontSize: "0.95rem", color: s.pillIdleColor }}>
            {current?.label ?? "Dashboard"}
          </Typography>
        </Box>
        <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          <Box sx={{ width: 264, pt: 1 }} role="presentation">
            <Typography sx={{ px: 2, py: 1, fontSize: "0.72rem", fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: "text.secondary" }}>
              Dashboard sections
            </Typography>
            <List>
              {NAV_ITEMS.map((item) => {
                const selected = item.isActive(pathname);
                return (
                  <ListItemButton
                    key={item.path}
                    selected={selected}
                    onClick={() => {
                      setDrawerOpen(false);
                      navigate(item.path);
                    }}
                    aria-current={selected ? "page" : undefined}
                    sx={{
                      mx: 1,
                      borderRadius: 2,
                      "&.Mui-selected": {
                        backgroundColor: brand.primary,
                        color: "#fff",
                        "&:hover": { backgroundColor: brand.primaryDark },
                        "& .MuiListItemIcon-root": { color: "#fff" },
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 38 }}>
                      <item.Icon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: "0.92rem", fontWeight: selected ? 600 : 500 }} />
                  </ListItemButton>
                );
              })}
            </List>
          </Box>
        </Drawer>
      </>
    );
  }

  return (
    <Box
      component="nav"
      aria-label="Dashboard sections"
      sx={{
        backgroundColor: s.pillRowBg,
        borderRadius: "8px",
        padding: "4px",
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        flexShrink: 0,
      }}
    >
      {NAV_ITEMS.map((item) => {
        const selected = item.isActive(pathname);
        return (
          <Button
            key={item.path}
            onClick={() => navigate(item.path)}
            startIcon={<item.Icon />}
            aria-current={selected ? "page" : undefined}
            sx={{
              borderRadius: "8px",
              py: "8px",
              px: { md: "14px", lg: "20px" },
              textTransform: "none",
              fontSize: { md: "0.85rem", lg: "0.95rem" },
              fontWeight: selected ? 600 : 500,
              lineHeight: 1.4,
              transition: "all 0.2s ease",
              border: "none",
              flex: "0 0 auto",
              alignSelf: "center",
              backgroundColor: selected ? brand.primary : s.pillIdleBg,
              color: selected ? "#fff" : s.pillIdleColor,
              boxShadow: selected ? "0 2px 4px rgba(0,0,0,0.1)" : "none",
              "&:hover": {
                backgroundColor: selected ? brand.primaryDark : brand.primaryHover,
              },
            }}
          >
            {item.label}
          </Button>
        );
      })}
    </Box>
  );
}

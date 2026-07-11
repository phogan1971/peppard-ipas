import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ApartmentIcon from "@mui/icons-material/Apartment";
import FactCheckIcon from "@mui/icons-material/FactCheck";
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

// Genisis3 PortalSubNav pattern verbatim: pills inside a #f0f2f5 rounded
// container, borderless, navy-on-select with a soft shadow.
export default function PortalSubNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const s = useSurfaces();

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
        flexWrap: { xs: "wrap", md: "nowrap" },
        width: { xs: "100%", sm: "auto" },
        justifyContent: { xs: "center", sm: "flex-start" },
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
              px: { xs: "14px", sm: "20px" },
              textTransform: "none",
              fontSize: { xs: "0.85rem", sm: "0.95rem" },
              fontWeight: selected ? 600 : 500,
              lineHeight: 1.4,
              transition: "all 0.2s ease",
              border: "none",
              flex: { xs: 1, sm: "0 0 auto" },
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

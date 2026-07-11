import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useLocation, useNavigate } from "react-router-dom";
import { brand, surface } from "../theme/tokens";

interface NavItem {
  label: string;
  path: string;
  isActive: (pathname: string) => boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Group Overview", path: "/", isActive: (p) => p === "/" },
  {
    label: "Centre Operations",
    path: "/centres/riverside",
    isActive: (p) => p.startsWith("/centres"),
  },
  {
    label: "Findings & Actions",
    path: "/findings",
    isActive: (p) => p.startsWith("/findings"),
  },
  {
    label: "HIQA Standards",
    path: "/standards",
    isActive: (p) => p.startsWith("/standards"),
  },
  {
    label: "KPI Framework",
    path: "/kpis",
    isActive: (p) => p.startsWith("/kpis"),
  },
];

// Genesis pill-button sub-nav pattern, Peppard-toned: selected pill is
// brand red instead of Connects navy.
export default function PortalSubNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <Box component="nav" aria-label="Dashboard sections" sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
      {NAV_ITEMS.map((item) => {
        const selected = item.isActive(pathname);
        return (
          <Button
            key={item.path}
            size="small"
            onClick={() => navigate(item.path)}
            aria-current={selected ? "page" : undefined}
            sx={{
              borderRadius: 2,
              padding: { xs: "6px 14px", sm: "8px 20px" },
              fontSize: "0.875rem",
              fontWeight: 500,
              textTransform: "none",
              transition: "all 0.2s ease",
              border: "1px solid",
              borderColor: selected ? brand.red : brand.border,
              backgroundColor: selected ? brand.red : "#fff",
              color: selected ? "#fff" : "#666",
              "&:hover": {
                backgroundColor: selected ? brand.redDark : surface.hoverBg,
                borderColor: brand.red,
                color: selected ? "#fff" : brand.red,
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

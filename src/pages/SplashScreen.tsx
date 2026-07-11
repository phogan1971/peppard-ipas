import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useNavigate } from "react-router-dom";
import { OriginLogo } from "../components/AppShell";
import { brand } from "../theme/tokens";

const GENESIS_URL = "https://genesishealthcarenew.netlify.app/";

interface PlatformCard {
  logo: string;
  logoHeight: number;
  name: string;
  descr: string;
  cta: string;
  external: boolean;
  target: string;
}

const PLATFORMS: PlatformCard[] = [
  {
    logo: "/connects-logo.png",
    logoHeight: 64,
    name: "Genesis Healthcare",
    descr: "Clinical governance portal — KPIs, compliance, audits, incidents and board reporting for hospital operations.",
    cta: "Open connects.health",
    external: true,
    target: GENESIS_URL,
  },
  {
    logo: "/peppard-logo.jpg",
    logoHeight: 64,
    name: "Peppard IPAS Governance",
    descr: "Operator dashboard for 8 IPAS accommodation centres — Department returns, HIQA standards, findings and the 74-KPI framework.",
    cta: "Open dashboard",
    external: false,
    target: "/overview",
  },
];

// Platform launcher in the connects.health idiom: navy hero, white cards.
export default function SplashScreen() {
  const navigate = useNavigate();
  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: brand.primary, display: "flex", flexDirection: "column" }}>
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", px: 2, py: 6 }}>
        <Box sx={{ backgroundColor: "#fff", borderRadius: 3, px: 4, py: 2.5, mb: 3 }}>
          <OriginLogo height={52} />
        </Box>
        <Typography
          variant="h4"
          sx={{ color: "#fff", fontWeight: 700, textAlign: "center", mb: 1 }}
        >
          Governance Platforms
        </Typography>
        <Typography sx={{ color: brand.mint, fontSize: "1.05rem", textAlign: "center", mb: 5, maxWidth: 560 }}>
          Connecting people, carers and organisations — one platform family, one way of working.
        </Typography>

        <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", justifyContent: "center", maxWidth: 1000 }}>
          {PLATFORMS.map((p) => (
            <Paper
              key={p.name}
              sx={{
                width: { xs: "100%", sm: 420 },
                p: 3.5,
                borderRadius: 3,
                border: "none",
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                "&:hover": { transform: "translateY(-4px)", boxShadow: "0 12px 32px rgba(0,0,0,0.25)" },
              }}
            >
              <Box sx={{ height: 72, display: "flex", alignItems: "center" }}>
                <Box component="img" src={p.logo} alt="" sx={{ height: p.logoHeight, width: "auto", maxWidth: "100%" }} />
              </Box>
              <Typography variant="h6" sx={{ color: brand.primary, fontSize: "1.25rem" }}>
                {p.name}
              </Typography>
              <Typography sx={{ fontSize: "0.9rem", color: "text.secondary", flexGrow: 1 }}>
                {p.descr}
              </Typography>
              <Button
                variant="contained"
                disableElevation
                endIcon={p.external ? <OpenInNewIcon /> : <ArrowForwardIcon />}
                onClick={() => {
                  if (p.external) window.open(p.target, "_blank", "noopener");
                  else navigate(p.target);
                }}
                sx={{ alignSelf: "flex-start", mt: 1 }}
              >
                {p.cta}
              </Button>
            </Paper>
          ))}
        </Box>
      </Box>

      <Typography sx={{ textAlign: "center", color: brand.mint, fontSize: "0.78rem", pb: 3 }}>
        © {new Date().getFullYear()} Origin Care Group · www.origincaregroup.com
      </Typography>
    </Box>
  );
}

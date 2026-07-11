import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Fade from "@mui/material/Fade";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useNavigate } from "react-router-dom";
import { brand, surface } from "../theme/tokens";

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
    logo: "/genesis-logo.png",
    logoHeight: 72,
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

const LOGO_HOLD_MS = 2600;

// Stage 1: Peppard Investments brand splash — the logo alone on the white
// field it was designed for, then on to the platform chooser.
// Stage 2: platform launcher in the connects.health idiom: navy hero, white cards.
export default function SplashScreen() {
  const navigate = useNavigate();
  const [stage, setStage] = useState<"logo" | "choose">("logo");

  useEffect(() => {
    if (stage !== "logo") return;
    const t = window.setTimeout(() => setStage("choose"), LOGO_HOLD_MS);
    return () => window.clearTimeout(t);
  }, [stage]);

  if (stage === "logo") {
    return (
      <Box
        role="button"
        tabIndex={0}
        aria-label="Continue to platform selection"
        onClick={() => setStage("choose")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setStage("choose");
        }}
        sx={{
          minHeight: "100vh",
          backgroundColor: surface.cardBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          "&:focus-visible": { outline: "none" },
          "@keyframes splashLogoIn": {
            from: { opacity: 0, transform: "translateY(14px) scale(0.97)" },
            to: { opacity: 1, transform: "translateY(0) scale(1)" },
          },
        }}
      >
        <Box
          component="img"
          src="/peppard-logo.jpg"
          alt="Peppard Investments Limited"
          sx={{
            width: "min(72vw, 620px)",
            height: "auto",
            animation: "splashLogoIn 1.1s ease-out both",
            "@media (prefers-reduced-motion: reduce)": { animation: "none" },
          }}
        />
      </Box>
    );
  }

  return (
    <Fade in timeout={600}>
      {renderChooser(navigate)}
    </Fade>
  );
}

function renderChooser(navigate: ReturnType<typeof useNavigate>) {
  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: brand.primary, display: "flex", flexDirection: "column" }}>
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", px: 2, py: 6 }}>
        {/* Official white lockup — supplied asset, used verbatim */}
        <Box
          component="img"
          src="/origin-logo-white.png"
          alt="Origin Care Group"
          sx={{ height: 78, width: "auto", mb: 4 }}
        />
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

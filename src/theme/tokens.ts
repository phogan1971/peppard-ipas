// Single source of truth for every colour in the app.
// Rule: components never hardcode hex values — they import from here or use
// the MUI theme. This is the discipline Genisis3 lacked (navy #00465c is
// scattered across hundreds of files there); one brand swap = one file here.

// ── Peppard Investments brand (from logo + descriptor §6) ──────────────
export const brand = {
  red: "#E01E1F", // Peppard Red — structural accent: nav selection, buttons, links
  redDark: "#A81516", // hover / pressed state for brand red
  charcoal: "#26262A", // headings, wordmark, primary text
  warmLight: "#F8F4F2", // page background (warm neutral)
  paleRedTint: "#FBEDED", // tinted panels, selected-row highlight
  border: "#E8E0DC", // card and divider borders (warm)
} as const;

// ── RAG / status colours (regulatory findings, KPI thresholds) ─────────
// Deliberately DISTINCT from brand.red: brand red is structural chrome,
// status red means a RED-priority finding. Descriptor §6 requires the two
// to be visually distinguishable — status red is a darker crimson and is
// always paired with a text label, never colour alone.
export const rag = {
  red: "#B71C1C",
  redBg: "#FDECEA",
  amber: "#E65100",
  amberBg: "#FFF3E0",
  green: "#1B5E20",
  greenBg: "#E8F5E9",
  neutral: "#546E7A", // not assessed / not applicable
  neutralBg: "#ECEFF1",
} as const;

// ── HIQA 4-point compliance scale ───────────────────────────────────────
export const compliance = {
  compliant: "#1B5E20",
  compliantBg: "#E8F5E9",
  substantially: "#558B2F",
  substantiallyBg: "#F1F8E9",
  partially: "#E65100",
  partiallyBg: "#FFF3E0",
  notCompliant: "#B71C1C",
  notCompliantBg: "#FDECEA",
  notAssessed: "#546E7A",
  notAssessedBg: "#ECEFF1",
} as const;

// ── Surfaces (Genesis page-shell conventions, warmed for Peppard) ──────
export const surface = {
  pageBg: brand.warmLight, // page body (Genesis uses #f5f5f5)
  cardBg: "#FFFFFF", // Paper, cards, inputs
  subNavBg: "#FFFFFF", // sticky sub-nav bar
  pillRowBg: "#F1EAE7", // pill-row container / inactive toggle
  subtleBg: "#FAF7F5", // info boxes nested inside cards
  hoverBg: "#F5EFEC",
} as const;

export const text = {
  primary: brand.charcoal,
  secondary: "#5F5C60",
  muted: "#8A868B",
  onDark: "#FFFFFF",
} as const;

export const fonts = {
  heading: '"Cambria", "Georgia", serif',
  body: '"Calibri", "Segoe UI", "Inter", "Roboto", sans-serif',
} as const;

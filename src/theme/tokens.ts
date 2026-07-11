// Single source of truth for every colour in the app.
// Rule: components never hardcode hex values — they import from here or use
// the MUI theme. This is the discipline Genisis3 lacked; one brand swap =
// one file here (proven: this file went Peppard-red → Origin/Genesis navy
// without touching a component).

// ── Origin Care Group / connects.health platform palette ───────────────
// Primary matches the Genesis platform (#00465c); supporting tones come
// from the Origin donut mark (teal / green / mint / navy).
export const brand = {
  primary: "#00465c", // Genesis navy — structural accent: nav selection, buttons, headings
  primaryDark: "#003347", // hover / pressed state (Genesis exact)
  primaryHover: "rgba(0, 70, 92, 0.08)", // unselected-pill hover wash
  topBar: "hsl(199, 57%, 23%)", // Genesis AppBar toolbar colour
  teal: "#0E7F8B", // Origin mark teal — secondary accent
  green: "#23A566", // Origin mark green — positive accent
  mint: "#9FCFA8", // Origin mark pale green — tints
  charcoal: "#26262A", // Peppard charcoal (documents)
  tint: "#E6F0F2", // navy-tinted panels, selected-row highlight
  border: "#e0e0e0", // card and divider borders (Genesis neutral)
} as const;

// Genesis stat-card accent palette (DESIGN_SYSTEM_HELPER §4)
export const accent = {
  navy: "#00465c", // neutral totals
  green: "#2e7d32", // healthy / compliance
  blue: "#1976d2", // informational / low risk
  orange: "#ed6c02", // warnings / medium risk
  purple: "#9c27b0", // actions
  red: "#f44336", // errors / high risk
} as const;

// Genesis accordion header block (DESIGN_SYSTEM_HELPER §6)
export const accordion = {
  wrapperBg: "#ebf5ef",
  headerBg: "#dde3e6",
  headerHover: "#cdd5d9",
  hoverRing: "0 0 0 2px rgba(0, 70, 92, 0.1)",
  hoverBorder: "#00465c60",
} as const;

// Peppard Investments brand (client identity — kept for the centre logo
// and any Peppard-specific flourishes; no longer the app chrome)
export const peppard = {
  red: "#E01E1F",
  charcoal: "#26262A",
} as const;

// ── RAG / status colours (regulatory findings, KPI thresholds) ─────────
// Status red is reserved exclusively for RED-priority findings — with the
// chrome now navy, alert red carries even more signal. Status is always
// colour + text label, never colour alone.
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

// ── Surfaces (Genesis page-shell conventions) ───────────────────────────
export const surface = {
  pageBg: "#F5F5F5", // page body (Genesis standard)
  cardBg: "#FFFFFF", // Paper, cards, inputs
  subNavBg: "#FFFFFF", // sticky sub-nav bar
  pillRowBg: "#F0F2F5", // pill-row container / inactive toggle
  subtleBg: "#FAFAFA", // info boxes nested inside cards
  hoverBg: "#F0F2F5",
} as const;

export const text = {
  primary: "#424242", // Genesis body text
  secondary: "#666666",
  muted: "#8A8F94",
  onDark: "#FFFFFF",
} as const;

// Genesis typography: Roboto throughout (main.tsx theme)
export const fonts = {
  heading: '"Roboto", "Helvetica", "Arial", sans-serif',
  body: '"Roboto", "Helvetica", "Arial", sans-serif',
} as const;

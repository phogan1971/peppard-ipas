import { createTheme, Theme, useTheme } from "@mui/material/styles";
import { brand, rag, surface, darkSurface, SurfaceSet, text, fonts } from "./tokens";

// Mode-aware surface tokens: components call useSurfaces() instead of
// importing the light `surface` set directly, so dark mode is one hook.
export function useSurfaces(): SurfaceSet {
  const theme = useTheme();
  return theme.palette.mode === "dark" ? darkSurface : surface;
}

// Mirrors Genisis3's main.tsx theme (typography scale + component
// overrides) so the two apps read as one platform; dark variant follows
// the Genisis3 dark idiom (slate surfaces, sky headings).
export function buildPeppardTheme(mode: "light" | "dark"): Theme {
  const dark = mode === "dark";
  const s = dark ? darkSurface : surface;

  return createTheme({
    typography: {
      fontFamily: fonts.body,
      h4: { fontSize: "34px", fontWeight: 700, lineHeight: 1.2, color: s.heading },
      h5: { fontWeight: 700, color: s.heading },
      h6: { fontSize: "20px", fontWeight: 600, lineHeight: 1.6, color: s.heading },
      subtitle1: { fontSize: "16px", fontWeight: 700, lineHeight: 1.75 },
      subtitle2: { fontSize: "0.875rem", fontWeight: 700, lineHeight: 1.4 },
      overline: {
        fontSize: "0.7rem",
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        lineHeight: 1.5,
      },
      body1: { fontSize: "15px", fontWeight: 400, lineHeight: 1.5 },
      body2: { fontSize: "14px", fontWeight: 400, lineHeight: 1.6 },
      caption: { fontSize: "12px", fontWeight: 400, lineHeight: 1.66 },
    },
    palette: {
      mode,
      primary: dark
        ? { main: "#4FA3BD", dark: "#3B89A1", contrastText: "#fff" }
        : { main: brand.primary, dark: brand.primaryDark, contrastText: "#fff" },
      secondary: { main: brand.mint },
      background: {
        default: s.pageBg,
        paper: s.cardBg,
      },
      text: dark
        ? { primary: "#E2E8F0", secondary: "#94A3B8", disabled: "#5B6779" }
        : { primary: text.primary, secondary: text.secondary, disabled: "#cccccc" },
      success: { main: rag.green },
      warning: { main: rag.amber },
      error: { main: rag.red },
      divider: s.border,
    },
    shape: { borderRadius: 8 },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            borderRadius: "8px",
            fontWeight: 600,
            fontSize: "0.875rem",
            transition: "all 0.2s ease",
          },
          containedPrimary: dark
            ? {}
            : {
                backgroundColor: brand.primary,
                "&:hover": { backgroundColor: brand.primaryDark },
              },
          outlined: {
            borderColor: s.border,
            color: dark ? "#94A3B8" : "#666",
            "&:hover": {
              borderColor: dark ? "#4FA3BD" : brand.primary,
              backgroundColor: dark ? "rgba(79,163,189,0.08)" : "rgba(0,70,92,0.04)",
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: "10px",
            border: `1px solid ${s.border}`,
            boxShadow: dark ? "0 2px 4px rgba(0,0,0,0.4)" : "0 2px 4px rgba(0,0,0,0.08)",
            backgroundImage: "none",
          },
        },
        defaultProps: { elevation: 0 },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: "10px",
            border: `1px solid ${s.border}`,
            boxShadow: dark ? "0 2px 4px rgba(0,0,0,0.4)" : "0 2px 4px rgba(0,0,0,0.08)",
            backgroundImage: "none",
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          // On phones every dialog goes near-fullscreen (8px gutter) so
          // form dialogs stay usable without per-dialog fullScreen wiring.
          paper: ({ theme }) => ({
            borderRadius: "10px",
            [theme.breakpoints.down("sm")]: {
              margin: 8,
              width: "calc(100% - 16px)",
              maxWidth: "calc(100% - 16px)",
              maxHeight: "calc(100% - 16px)",
            },
          }),
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: { borderRadius: "8px", backgroundColor: s.cardBg },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: "20px", fontWeight: 600, fontSize: "0.75rem" },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: { borderBottomColor: s.border },
          head: {
            fontWeight: 600,
            color: s.heading,
            backgroundColor: s.tableHeadBg,
            fontSize: "14px",
          },
        },
      },
    },
  });
}

// Always-light theme for the generated documents (readiness pack, board
// pack, Department return) — they are paper, and must print correctly
// regardless of the app's colour mode.
export const printTheme = buildPeppardTheme("light");

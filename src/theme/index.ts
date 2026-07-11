import { createTheme } from "@mui/material/styles";
import { brand, rag, surface, text, fonts } from "./tokens";

// Mirrors Genisis3's main.tsx theme (typography scale + component
// overrides) so the two apps read as one platform.
export const peppardTheme = createTheme({
  typography: {
    fontFamily: fonts.body,
    h4: { fontSize: "34px", fontWeight: 700, lineHeight: 1.2, color: brand.primary },
    h5: { fontWeight: 700, color: brand.primary },
    h6: { fontSize: "20px", fontWeight: 600, lineHeight: 1.6, color: brand.primary },
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
    primary: {
      main: brand.primary,
      dark: brand.primaryDark,
      contrastText: "#fff",
    },
    secondary: {
      main: brand.mint,
    },
    background: {
      default: surface.pageBg,
      paper: surface.cardBg,
    },
    text: {
      primary: text.primary,
      secondary: text.secondary,
      disabled: "#cccccc",
    },
    success: { main: rag.green },
    warning: { main: rag.amber },
    error: { main: rag.red },
    divider: brand.border,
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
        containedPrimary: {
          backgroundColor: brand.primary,
          "&:hover": { backgroundColor: brand.primaryDark },
        },
        outlined: {
          borderColor: brand.border,
          color: "#666",
          "&:hover": {
            borderColor: brand.primary,
            backgroundColor: "rgba(0,70,92,0.04)",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: "10px",
          border: `1px solid ${brand.border}`,
          boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
        },
      },
      defaultProps: { elevation: 0 },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: "10px",
          border: `1px solid ${brand.border}`,
          boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: "10px" },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: "8px", backgroundColor: "#fff" },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: "20px", fontWeight: 600, fontSize: "0.75rem" },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          color: brand.primary,
          backgroundColor: "#fafafa",
          fontSize: "14px",
        },
      },
    },
  },
});

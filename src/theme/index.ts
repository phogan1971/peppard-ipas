import { createTheme } from "@mui/material/styles";
import { brand, rag, surface, text, fonts } from "./tokens";

export const peppardTheme = createTheme({
  palette: {
    primary: {
      main: brand.primary,
      dark: brand.primaryDark,
      contrastText: "#fff",
    },
    secondary: {
      main: brand.charcoal,
      contrastText: "#fff",
    },
    background: {
      default: surface.pageBg,
      paper: surface.cardBg,
    },
    text: {
      primary: text.primary,
      secondary: text.secondary,
    },
    success: { main: rag.green },
    warning: { main: rag.amber },
    error: { main: rag.red },
    divider: brand.border,
  },
  typography: {
    fontFamily: fonts.body,
    h1: { fontFamily: fonts.heading, fontWeight: 700 },
    h2: { fontFamily: fonts.heading, fontWeight: 700 },
    h3: { fontFamily: fonts.heading, fontWeight: 700 },
    h4: { fontFamily: fonts.heading, fontWeight: 700 },
    h5: { fontFamily: fonts.heading, fontWeight: 700 },
    h6: { fontFamily: fonts.heading, fontWeight: 700 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 600 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { border: `1px solid ${brand.border}` },
      },
      defaultProps: { elevation: 0 },
    },
  },
});

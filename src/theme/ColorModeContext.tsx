import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { buildPeppardTheme } from "./index";

type Mode = "light" | "dark";

const MODE_KEY = "peppard-ipas:mode";

interface ColorModeValue {
  mode: Mode;
  toggleMode: () => void;
}

const ColorModeContext = createContext<ColorModeValue>({ mode: "light", toggleMode: () => {} });

export function useColorMode(): ColorModeValue {
  return useContext(ColorModeContext);
}

function initialMode(): Mode {
  try {
    const saved = localStorage.getItem(MODE_KEY);
    if (saved === "dark" || saved === "light") return saved;
  } catch {
    // ignore
  }
  return "light";
}

export function ColorModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>(initialMode);

  const value = useMemo<ColorModeValue>(
    () => ({
      mode,
      toggleMode: () =>
        setMode((m) => {
          const next = m === "light" ? "dark" : "light";
          localStorage.setItem(MODE_KEY, next);
          return next;
        }),
    }),
    [mode],
  );

  const theme = useMemo(() => buildPeppardTheme(mode), [mode]);

  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

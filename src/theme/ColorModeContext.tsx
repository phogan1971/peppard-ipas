import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { buildPeppardTheme } from "./index";
import { safeSet } from "../data/safeStorage";

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

  // Persist as a side effect, never inside the state updater — a throw there
  // (storage disabled) would propagate during render and blank the app.
  useEffect(() => {
    safeSet(MODE_KEY, mode);
  }, [mode]);

  const value = useMemo<ColorModeValue>(
    () => ({
      mode,
      toggleMode: () => setMode((m) => (m === "light" ? "dark" : "light")),
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

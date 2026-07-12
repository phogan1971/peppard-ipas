import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import { FireRegister, fireCurrencyFor, FireCurrencyState } from "../data/types";
import { rag } from "../theme/tokens";
import { useSurfaces } from "../theme";

const CURRENCY_META: Record<FireCurrencyState, { label: string; color: string; bg: string }> = {
  in_date: { label: "In date", color: rag.green, bg: rag.greenBg },
  due_soon: { label: "Due soon", color: rag.amber, bg: rag.amberBg },
  overdue: { label: "Overdue", color: "#fff", bg: rag.red },
};

interface Props {
  registers: FireRegister[];
  onLog?: (name: string) => void;
}

export default function FireRegisterPanel({ registers, onLog }: Props) {
  const surf = useSurfaces();
  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <LocalFireDepartmentIcon sx={{ color: rag.red, fontSize: 20 }} />
        <Typography variant="h6" sx={{ fontSize: "1.05rem", color: "text.primary" }}>
          Fire safety registers
        </Typography>
      </Box>
      <Typography sx={{ fontSize: "0.8rem", color: "text.secondary", mb: 1.5 }}>
        Each register shows days since the last entry against its required frequency, turning amber then red as currency
        lapses.
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {registers.map((reg) => {
          const cur = fireCurrencyFor(reg);
          const meta = CURRENCY_META[cur.state];
          return (
            <Box
              key={reg.name}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 1,
                p: 1,
                borderRadius: 1,
                backgroundColor: surf.subtleBg,
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, lineHeight: 1.3 }}>{reg.shortName}</Typography>
                <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
                  {cur.daysSince === null ? "No check on record" : `${cur.daysSince}d since last check`} · required every{" "}
                  {reg.frequencyDays}d
                  {reg.enteredBy ? ` · logged by ${reg.enteredBy}` : ""}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexShrink: 0 }}>
                <Chip label={meta.label} size="small" sx={{ backgroundColor: meta.bg, color: meta.color, fontWeight: 700 }} />
                {onLog && (
                  <Button size="small" variant="outlined" onClick={() => onLog(reg.name)} sx={{ minWidth: 0, px: 1 }}>
                    Log check
                  </Button>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}

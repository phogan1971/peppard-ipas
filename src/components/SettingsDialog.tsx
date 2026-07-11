import { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Slider from "@mui/material/Slider";
import { useNavigate } from "react-router-dom";
import { brand, rag, surface } from "../theme/tokens";
import { DataProfile, DEFAULT_PROFILE, getProfile, matchingPreset, PROFILE_PRESETS, PresetKey } from "../data/profile";
import { regenerateData } from "../data/store";

const PRESET_ACCENTS: Record<PresetKey, string> = {
  strong: rag.green,
  mixed: rag.amber,
  pressure: rag.red,
};

interface SliderSpec {
  key: keyof DataProfile;
  label: string;
  help: string;
}

const SLIDERS: SliderSpec[] = [
  {
    key: "compliance",
    label: "Standards & registers compliance",
    help: "Higher = more standards compliant, registers in order, fewer room issues",
  },
  {
    key: "findings",
    label: "Findings pressure",
    help: "Higher = more open findings, more severe, evidence deadlines slipping",
  },
  {
    key: "kpi",
    label: "KPI performance",
    help: "Higher = more of the 74 KPIs on target",
  },
];

export default function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<DataProfile>(getProfile());
  const activePreset = matchingPreset(draft);

  const apply = (profile: DataProfile) => {
    regenerateData(profile);
    onClose();
    navigate("/overview");
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ color: brand.primary }}>Data settings</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          Choose how the sample dataset presents. Presets set the overall tone; the sliders fine-tune it.
          Applying regenerates all centres, findings, assessments and KPI positions.
        </Typography>

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 3 }}>
          {(Object.keys(PROFILE_PRESETS) as PresetKey[]).map((key) => {
            const preset = PROFILE_PRESETS[key];
            const selected = activePreset === key;
            return (
              <Button
                key={key}
                onClick={() => setDraft(preset.profile)}
                sx={{
                  flex: "1 1 150px",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  textAlign: "left",
                  border: `2px solid ${selected ? PRESET_ACCENTS[key] : brand.border}`,
                  backgroundColor: selected ? surface.subtleBg : "#fff",
                  borderRadius: "10px",
                  p: 1.5,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: PRESET_ACCENTS[key] }} />
                  <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: brand.primary }}>
                    {preset.label}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: "0.72rem", color: "text.secondary", lineHeight: 1.35 }}>
                  {preset.description}
                </Typography>
              </Button>
            );
          })}
        </Box>

        {SLIDERS.map((s) => (
          <Box key={s.key} sx={{ mb: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <Typography sx={{ fontWeight: 600, fontSize: "0.85rem", color: brand.primary }}>{s.label}</Typography>
              <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>{draft[s.key]}%</Typography>
            </Box>
            <Slider
              value={draft[s.key]}
              onChange={(_, v) => setDraft({ ...draft, [s.key]: v as number })}
              min={0}
              max={100}
              aria-label={s.label}
              sx={{ color: brand.primary }}
            />
            <Typography sx={{ fontSize: "0.72rem", color: "text.secondary", mt: -0.5 }}>{s.help}</Typography>
          </Box>
        ))}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={() => apply(DEFAULT_PROFILE)} sx={{ color: "text.secondary", mr: "auto" }}>
          Reset to defaults
        </Button>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disableElevation onClick={() => apply(draft)}>
          Apply & regenerate
        </Button>
      </DialogActions>
    </Dialog>
  );
}

import { useEffect, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Slider from "@mui/material/Slider";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Chip from "@mui/material/Chip";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import { useNavigate } from "react-router-dom";
import { rag, accent } from "../theme/tokens";
import { useSurfaces } from "../theme";
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

// Placeholder user directory — the descriptor's roles (§2.2). Read-only for
// now; real invite/roles/per-module permissions arrive with the backend.
interface UserRow {
  name: string;
  role: string;
  scope: string;
  perms: string[];
}
const USERS: UserRow[] = [
  { name: "Peter O'Brien", role: "Centre Manager", scope: "Riverside", perms: ["Own centre · read/write"] },
  { name: "Aoife Duignan", role: "Centre Manager", scope: "Ballaghaderreen", perms: ["Own centre · read/write"] },
  { name: "Maeve Kelly", role: "Internal Auditor", scope: "All centres", perms: ["Audit · read/write", "Findings & CAPA"] },
  { name: "Ciara Nolan", role: "Designated Officer", scope: "All centres", perms: ["Safeguarding", "Data protection", "H&S"] },
  { name: "Daniel Peppard", role: "Group Executive", scope: "All centres", perms: ["Read", "Return sign-off"] },
  { name: "Board of Directors", role: "Board", scope: "Group", perms: ["Reports · read"] },
];

function UsersPanel() {
  const s = useSurfaces();
  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1, flexWrap: "wrap", mb: 1.5 }}>
        <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 420 }}>
          Users, roles and permissions for the group. Role-based access is a{" "}
          <Box component="span" sx={{ fontWeight: 700, color: "text.primary" }}>placeholder</Box> — invite, edit and
          per-module permissions arrive with the backend and authentication.
        </Typography>
        <Chip label="Coming soon" size="small" sx={{ backgroundColor: rag.amberBg, color: rag.amber, fontWeight: 700 }} />
      </Box>

      <Box sx={{ border: `1px solid ${s.border}`, borderRadius: "10px", overflow: "hidden" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Permissions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {USERS.map((u) => (
              <TableRow key={u.name} hover>
                <TableCell>
                  <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "text.primary" }}>{u.name}</Typography>
                  <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>{u.scope}</Typography>
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>
                  <Chip label={u.role} size="small" sx={{ height: 20, fontSize: "0.68rem", fontWeight: 700, backgroundColor: s.pillRowBg, color: accent.navy }} />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                    {u.perms.map((p) => (
                      <Chip key={p} label={p} size="small" variant="outlined" sx={{ height: 20, fontSize: "0.66rem" }} />
                    ))}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      <Button startIcon={<PersonAddAlt1Icon />} disabled sx={{ mt: 1.5 }}>
        Add user
      </Button>
    </Box>
  );
}

export default function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"data" | "users">("data");
  const [draft, setDraft] = useState<DataProfile>(getProfile());
  const activePreset = matchingPreset(draft);
  const s = useSurfaces();

  // Reset the draft (and land on the Data tab) each time the dialog opens, so
  // a cancelled adjustment doesn't linger as a stale draft on reopen.
  useEffect(() => {
    if (open) {
      setDraft(getProfile());
      setTab("data");
    }
  }, [open]);

  const apply = (profile: DataProfile) => {
    regenerateData(profile);
    onClose();
    navigate("/overview");
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ color: s.heading, pb: 0 }}>Settings</DialogTitle>
      <Box sx={{ px: 3, borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} aria-label="Settings sections">
          <Tab value="data" label="Data" sx={{ textTransform: "none", fontWeight: 600 }} />
          <Tab value="users" label="Users" sx={{ textTransform: "none", fontWeight: 600 }} />
        </Tabs>
      </Box>
      <DialogContent>
        {tab === "data" && (
          <>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
              Choose how the sample dataset presents. Presets set the overall tone; the sliders fine-tune it.
              Applying regenerates all centres, findings, assessments and KPI positions — and{" "}
              <Box component="span" sx={{ fontWeight: 700, color: "text.primary" }}>
                clears any records entered through the dashboard
              </Box>{" "}
              (room edits, logged fire checks, verified notices, raised findings).
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
                      border: `2px solid ${selected ? PRESET_ACCENTS[key] : s.border}`,
                      backgroundColor: selected ? s.subtleBg : "background.paper",
                      borderRadius: "10px",
                      p: 1.5,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: PRESET_ACCENTS[key] }} />
                      <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: s.heading }}>
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

            {SLIDERS.map((spec) => (
              <Box key={spec.key} sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <Typography sx={{ fontWeight: 600, fontSize: "0.85rem", color: s.heading }}>{spec.label}</Typography>
                  <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>{draft[spec.key]}%</Typography>
                </Box>
                <Slider
                  value={draft[spec.key]}
                  onChange={(_, v) => setDraft({ ...draft, [spec.key]: v as number })}
                  min={0}
                  max={100}
                  aria-label={spec.label}
                  sx={{ color: "primary.main" }}
                />
                <Typography sx={{ fontSize: "0.72rem", color: "text.secondary", mt: -0.5 }}>{spec.help}</Typography>
              </Box>
            ))}
          </>
        )}

        {tab === "users" && <UsersPanel />}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {tab === "data" ? (
          <>
            <Button onClick={() => apply(DEFAULT_PROFILE)} sx={{ color: "text.secondary", mr: "auto" }}>
              Reset to defaults
            </Button>
            <Button onClick={onClose}>Cancel</Button>
            <Button variant="contained" disableElevation onClick={() => apply(draft)}>
              Apply & regenerate
            </Button>
          </>
        ) : (
          <Button onClick={onClose}>Close</Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

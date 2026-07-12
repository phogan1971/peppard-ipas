import { useMemo, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import { Room, SPACE_STANDARD_M2_PER_PERSON, suitableOccupancyFor } from "../data/types";
import { RoomInput, upsertRoom } from "../data/store";
import { rag } from "../theme/tokens";
import { useSurfaces } from "../theme";

const ISSUE_OPTIONS = [
  "Fridge in room",
  "Kettle in room",
  "Mould spotting in bathroom",
  "Window restrictor missing",
  "Damaged flooring",
  "Extension lead in use",
  "Prohibited electrical item",
  "Fixture requiring repair",
];

interface Props {
  open: boolean;
  centreId: string;
  enteredBy: string;
  existing: Room | null;
  onClose: () => void;
  onSaved: (roomName: string) => void;
}

// Best-effort split of a stored "L × W = area" back into dimensions so an
// edit starts from sensible values; falls back to a square of the area.
function splitDimensions(room: Room | null): { length: string; width: string } {
  if (!room?.dimensionsM2) return { length: "", width: "" };
  const side = Math.sqrt(room.dimensionsM2);
  return { length: side.toFixed(2), width: side.toFixed(2) };
}

export default function RoomFormDialog({ open, centreId, enteredBy, existing, onClose, onSaved }: Props) {
  const surf = useSurfaces();
  const init = splitDimensions(existing);
  const [room, setRoom] = useState(existing?.room ?? "");
  const [bedConfig, setBedConfig] = useState(existing?.bedConfig ?? "");
  const [occupancy, setOccupancy] = useState(String(existing?.currentOccupancy ?? 0));
  const [length, setLength] = useState(init.length);
  const [width, setWidth] = useState(init.width);
  const [issues, setIssues] = useState<string[]>(existing?.issues ?? []);

  const lengthN = parseFloat(length);
  const widthN = parseFloat(width);
  const occupancyN = parseInt(occupancy, 10);

  const preview = useMemo(() => {
    if (!(lengthN > 0) || !(widthN > 0)) return null;
    const area = Math.round(lengthN * widthN * 100) / 100;
    const suitable = suitableOccupancyFor(area);
    const over = Number.isFinite(occupancyN) && occupancyN > suitable;
    return { area, suitable, over, overBy: occupancyN - suitable };
  }, [lengthN, widthN, occupancyN]);

  const valid = room.trim() !== "" && lengthN > 0 && widthN > 0 && Number.isFinite(occupancyN) && occupancyN >= 0;

  const handleSave = () => {
    if (!valid) return;
    const input: RoomInput = {
      room,
      bedConfig,
      currentOccupancy: occupancyN,
      lengthM: lengthN,
      widthM: widthN,
      issues,
    };
    upsertRoom(centreId, input, enteredBy);
    onSaved(room.trim());
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{existing ? `Edit room ${existing.room}` : "Add room"}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField
              label="Room number"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              fullWidth
              size="small"
              disabled={!!existing}
              autoFocus={!existing}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Bed configuration"
              value={bedConfig}
              onChange={(e) => setBedConfig(e.target.value)}
              placeholder="e.g. 2S, 1D"
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              label="Length (m)"
              value={length}
              onChange={(e) => setLength(e.target.value)}
              type="number"
              inputProps={{ min: 0, step: 0.1 }}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              label="Width (m)"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              type="number"
              inputProps={{ min: 0, step: 0.1 }}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              label="Current occupancy"
              value={occupancy}
              onChange={(e) => setOccupancy(e.target.value)}
              type="number"
              inputProps={{ min: 0, step: 1 }}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12}>
            <Autocomplete
              multiple
              freeSolo
              options={ISSUE_OPTIONS}
              value={issues}
              onChange={(_, v) => setIssues(v)}
              renderInput={(params) => <TextField {...params} label="Issues noted" size="small" placeholder="Add issue" />}
            />
          </Grid>
        </Grid>

        <Box
          sx={{
            mt: 2,
            p: 1.5,
            borderRadius: 1,
            backgroundColor: preview?.over ? rag.redBg : surf.subtleBg,
            border: "1px solid",
            borderColor: preview?.over ? rag.red : surf.border,
          }}
        >
          <Typography sx={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: 0.6, color: "text.secondary" }}>
            Derived automatically @ {SPACE_STANDARD_M2_PER_PERSON} m² per person
          </Typography>
          {preview ? (
            <Typography sx={{ fontSize: "0.95rem", fontWeight: 600, mt: 0.25 }}>
              Area {preview.area} m² → suitable occupancy{" "}
              <Box component="span" sx={{ color: rag.green, fontWeight: 800 }}>
                {preview.suitable}
              </Box>
              {preview.over && (
                <Box component="span" sx={{ color: rag.red, fontWeight: 800 }}>
                  {" "}
                  · current {occupancyN} exceeds suitable by {preview.overBy}
                </Box>
              )}
            </Typography>
          ) : (
            <Typography sx={{ fontSize: "0.9rem", color: "text.secondary", mt: 0.25 }}>
              Enter length and width to compute suitable occupancy.
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disableElevation disabled={!valid} onClick={handleSave}>
          Save room
        </Button>
      </DialogActions>
    </Dialog>
  );
}

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import ApartmentIcon from "@mui/icons-material/Apartment";
import DescriptionIcon from "@mui/icons-material/Description";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import GroupsIcon from "@mui/icons-material/Groups";
import SquareFootIcon from "@mui/icons-material/SquareFoot";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import AddIcon from "@mui/icons-material/Add";
import DoneIcon from "@mui/icons-material/Done";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageShell from "../components/PageShell";
import StatCard from "../components/StatCard";
import ChartDialog, { ChartContent } from "../components/ChartDialog";
import RoomFormDialog from "../components/RoomFormDialog";
import FireRegisterPanel from "../components/FireRegisterPanel";
import NoticesPanel from "../components/NoticesPanel";
import { markRegisterReviewed, logFireCheck, setNoticeVerified, useAppState } from "../data/store";
import { RegisterEntry, Room, SPACE_STANDARD_M2_PER_PERSON } from "../data/types";
import { rag, ragAccent, accent } from "../theme/tokens";
import { useSurfaces } from "../theme";

const REGISTER_STATUS: Record<RegisterEntry["status"], { label: string; color: string; bg: string }> = {
  in_order: { label: "In order", color: rag.green, bg: rag.greenBg },
  attention: { label: "Needs attention", color: rag.amber, bg: rag.amberBg },
  not_reviewed: { label: "Not reviewed", color: rag.neutral, bg: rag.neutralBg },
};

export default function CentreOperations() {
  const { centreId } = useParams();
  const navigate = useNavigate();
  const { centres, roomsByCentre, registersByCentre, fireByCentre, noticesByCentre } = useAppState();
  const surf = useSurfaces();

  const centre = centres.find((c) => c.id === centreId) ?? centres[0];
  const rooms = roomsByCentre[centre.id] ?? [];
  const registers = registersByCentre[centre.id] ?? [];
  const fireRegisters = fireByCentre[centre.id] ?? [];
  const notices = noticesByCentre[centre.id] ?? [];

  const [roomDialog, setRoomDialog] = useState<{ open: boolean; existing: Room | null }>({ open: false, existing: null });
  const [toast, setToast] = useState<string | null>(null);

  const occupied = rooms.filter((r) => (r.currentOccupancy ?? 0) > 0);
  const overOccupied = rooms.filter(
    (r) => r.currentOccupancy !== null && r.suitableOccupancy !== null && r.currentOccupancy > r.suitableOccupancy,
  );
  const withIssues = rooms.filter((r) => r.issues.length > 0);
  const suitableTotal = rooms.reduce((s, r) => s + (r.suitableOccupancy ?? 0), 0);

  const [chart, setChart] = useState<ChartContent | null>(null);

  const emptyRooms = rooms.filter((r) => r.currentOccupancy === 0).length;
  const withinRooms = occupied.length - overOccupied.length;

  const roomStatusChart = (): ChartContent => ({
    title: "Rooms by status",
    subtitle: `${rooms.length} rooms at ${centre.shortName}`,
    defaultType: "pie",
    valueLabel: "Rooms",
    data: [
      { name: "Within standard", value: withinRooms, color: ragAccent.green },
      { name: "Over-occupied", value: overOccupied.length, color: ragAccent.red },
      { name: "Empty", value: emptyRooms, color: rag.neutral },
    ].filter((d) => d.value > 0),
  });

  const occupancyChart = (): ChartContent => ({
    title: "Bed utilisation",
    subtitle: `${centre.occupancy} of ${centre.contractCapacity} contracted beds filled`,
    defaultType: "pie",
    valueLabel: "Beds",
    data: [
      { name: "Filled", value: centre.occupancy, color: ragAccent.green },
      { name: "Available", value: Math.max(centre.contractCapacity - centre.occupancy, 0), color: rag.neutral },
    ].filter((d) => d.value > 0),
  });

  const capacityChart = (): ChartContent => ({
    title: "Capacity comparison",
    subtitle: `Suitable occupancy derived @ ${SPACE_STANDARD_M2_PER_PERSON} m² per person`,
    defaultType: "bar",
    valueLabel: "Beds",
    data: [
      { name: "Contracted", value: centre.contractCapacity, color: accent.navy },
      { name: "Suitable", value: suitableTotal, color: accent.purple },
      { name: "Current", value: centre.occupancy, color: accent.blue },
    ],
  });

  const overOccupiedChart = (): ChartContent => ({
    title: "Over-occupied rooms",
    subtitle: "Persons above the room's suitable occupancy",
    defaultType: "bar",
    valueLabel: "Persons over",
    data: overOccupied.map((r) => ({
      name: r.room,
      value: (r.currentOccupancy ?? 0) - (r.suitableOccupancy ?? 0),
      color: ragAccent.red,
    })),
    emptyText: "No rooms are above their suitable occupancy.",
  });

  const issuesChart = (): ChartContent => {
    const counts = new Map<string, number>();
    rooms.forEach((r) => r.issues.forEach((i) => counts.set(i, (counts.get(i) ?? 0) + 1)));
    return {
      title: "Issues flagged at inspection",
      subtitle: `${withIssues.length} of ${rooms.length} rooms carry at least one issue`,
      defaultType: "bar",
      valueLabel: "Rooms",
      data: [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value, color: ragAccent.amber })),
      emptyText: "No issues recorded against any room.",
    };
  };

  return (
    <PageShell
      icon={ApartmentIcon}
      title="Centre Operations"
      subtitle={`Room register, occupancy and administration registers — space standard ${SPACE_STANDARD_M2_PER_PERSON} m² per person`}
      actions={
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Select
            size="small"
            value={centre.id}
            onChange={(e) => navigate(`/centres/${e.target.value}`)}
            aria-label="Select centre"
            sx={{ minWidth: 220, backgroundColor: "background.paper" }}
          >
            {centres.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.shortName}
              </MenuItem>
            ))}
          </Select>
          <Button
            variant="outlined"
            startIcon={<DescriptionIcon />}
            onClick={() => navigate(`/centres/${centre.id}/return`)}
          >
            Department return
          </Button>
          <Button
            variant="contained"
            disableElevation
            startIcon={<DescriptionIcon />}
            onClick={() => navigate(`/centres/${centre.id}/readiness`)}
          >
            Readiness pack
          </Button>
        </Box>
      }
    >
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 1 }}>
          <Box>
            <Typography variant="h6" sx={{ color: "text.primary" }}>
              {centre.name}
            </Typography>
            <Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>
              {centre.location}, Co. {centre.county} · {centre.accommodationId} · Profile: {centre.profile} · Manager:{" "}
              {centre.manager} · Last IPPS inspection: {centre.lastIppsInspection ?? "—"}
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard label="Rooms" value={rooms.length} sub={`${occupied.length} occupied`} accent={accent.navy} icon={MeetingRoomIcon} onClick={() => setChart(roomStatusChart())} />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard label="Occupancy" value={centre.occupancy} sub={`of ${centre.contractCapacity} contracted`} accent={accent.blue} icon={GroupsIcon} onClick={() => setChart(occupancyChart())} />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard label="Suitable capacity" value={suitableTotal} sub={`derived @ ${SPACE_STANDARD_M2_PER_PERSON} m²/person`} accent={accent.purple} icon={SquareFootIcon} onClick={() => setChart(capacityChart())} />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            label="Over-occupied"
            value={overOccupied.length}
            sub="rooms above suitable occupancy"
            accent={overOccupied.length > 0 ? accent.red : accent.green}
            icon={ErrorOutlineIcon}
            onClick={() => setChart(overOccupiedChart())}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            label="Rooms with issues"
            value={withIssues.length}
            sub="flagged at inspection"
            accent={withIssues.length > 0 ? accent.orange : accent.green}
            icon={WarningAmberIcon}
            onClick={() => setChart(issuesChart())}
          />
        </Grid>
      </Grid>

      <ChartDialog content={chart} onClose={() => setChart(null)} />

      <Grid container spacing={2}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ overflow: "hidden" }}>
            <Box sx={{ p: 2, pb: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
              <Box>
                <Typography variant="h6" sx={{ fontSize: "1.05rem", color: "text.primary" }}>
                  Room register
                </Typography>
                <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
                  Suitable occupancy is derived automatically: room area ÷ {SPACE_STANDARD_M2_PER_PERSON} m² · click a row to
                  edit
                </Typography>
              </Box>
              <Button
                size="small"
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setRoomDialog({ open: true, existing: null })}
                sx={{ flexShrink: 0 }}
              >
                Add room
              </Button>
            </Box>
            <TableContainer sx={{ maxHeight: 520 }}>
              <Table stickyHeader size="small" aria-label="Room register">
                <TableHead>
                  <TableRow>
                    <TableCell>Room</TableCell>
                    <TableCell>Beds</TableCell>
                    <TableCell align="right">Area m²</TableCell>
                    <TableCell align="right">Suitable</TableCell>
                    <TableCell align="right">Current</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Issues</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rooms.map((room) => {
                    const over =
                      room.currentOccupancy !== null &&
                      room.suitableOccupancy !== null &&
                      room.currentOccupancy > room.suitableOccupancy;
                    const empty = room.currentOccupancy === 0;
                    return (
                      <TableRow
                        key={room.room}
                        hover
                        onClick={() => setRoomDialog({ open: true, existing: room })}
                        sx={{ cursor: "pointer", ...(over ? { backgroundColor: rag.redBg } : {}) }}
                      >
                        <TableCell sx={{ fontWeight: 600 }}>
                          {room.room}
                          {room.enteredBy && (
                            <Tooltip title={`Entered by ${room.enteredBy}`}>
                              <Box component="span" sx={{ ml: 0.5, color: accent.blue, fontSize: "0.7rem" }}>
                                ●
                              </Box>
                            </Tooltip>
                          )}
                        </TableCell>
                        <TableCell>{room.bedConfig ?? "—"}</TableCell>
                        <TableCell align="right">{room.dimensionsM2 ?? "—"}</TableCell>
                        <TableCell align="right">{room.suitableOccupancy ?? "—"}</TableCell>
                        <TableCell align="right">{room.currentOccupancy ?? "—"}</TableCell>
                        <TableCell>
                          {over ? (
                            <Chip label="Over" size="small" sx={{ backgroundColor: rag.red, color: "#fff", fontWeight: 700, height: 20 }} />
                          ) : empty ? (
                            <Chip label="Empty" size="small" sx={{ backgroundColor: rag.neutralBg, color: rag.neutral, height: 20 }} />
                          ) : (
                            <Chip label="OK" size="small" sx={{ backgroundColor: rag.greenBg, color: rag.green, height: 20 }} />
                          )}
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.78rem", color: room.issues.length ? rag.amber : "text.secondary" }}>
                          {room.issues.length ? room.issues.join("; ") : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ fontSize: "1.05rem", color: "text.primary", mb: 0.5 }}>
                Administration registers
              </Typography>
              <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", mb: 1 }}>
                Each register is tagged to the IPPS report section and the HIQA standard it evidences — one entry serves
                both regimes.
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {registers.map((reg) => {
                  const s = REGISTER_STATUS[reg.status];
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
                        <Typography sx={{ fontSize: "0.83rem", fontWeight: 600, lineHeight: 1.3 }}>{reg.name}</Typography>
                        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 0.25, mb: 0.25 }}>
                          {reg.ippsSection && (
                            <Chip
                              label={`IPPS §${reg.ippsSection}`}
                              size="small"
                              sx={{ height: 17, fontSize: "0.62rem", fontWeight: 700, backgroundColor: surf.pillRowBg, color: accent.navy }}
                            />
                          )}
                          {reg.hiqaStandard && (
                            <Chip
                              label={`HIQA ${reg.hiqaStandard}`}
                              size="small"
                              sx={{ height: 17, fontSize: "0.62rem", fontWeight: 700, backgroundColor: rag.greenBg, color: rag.green }}
                            />
                          )}
                        </Box>
                        <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
                          Last reviewed {reg.lastReviewed}
                          {reg.enteredBy ? ` · by ${reg.enteredBy}` : ""}
                          {reg.note ? ` — ${reg.note}` : ""}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.5, flexShrink: 0 }}>
                        <Chip label={s.label} size="small" sx={{ backgroundColor: s.bg, color: s.color, fontWeight: 600 }} />
                        {reg.status !== "in_order" && (
                          <Tooltip title="Record a review today">
                            <Button
                              size="small"
                              startIcon={<DoneIcon sx={{ fontSize: 14 }} />}
                              onClick={() => {
                                markRegisterReviewed(centre.id, reg.name, centre.manager);
                                setToast(`${reg.name} marked reviewed — status and KPIs updated.`);
                              }}
                              sx={{ minWidth: 0, px: 0.75, fontSize: "0.68rem" }}
                            >
                              Review
                            </Button>
                          </Tooltip>
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Paper>

            <FireRegisterPanel
              registers={fireRegisters}
              onLog={(name) => {
                logFireCheck(centre.id, name, centre.manager);
                setToast(`Fire check logged for ${centre.shortName} — register currency refreshed.`);
              }}
            />

            <NoticesPanel
              notices={notices}
              onVerify={(name, compliant) => {
                setNoticeVerified(centre.id, name, compliant, centre.manager);
                setToast(
                  compliant
                    ? `${name} verified as displayed — readiness pack updated.`
                    : `${name} flagged as missing — needs attention.`,
                );
              }}
            />
          </Box>
        </Grid>
      </Grid>

      <RoomFormDialog
        open={roomDialog.open}
        centreId={centre.id}
        enteredBy={centre.manager}
        existing={roomDialog.existing}
        onClose={() => setRoomDialog({ open: false, existing: null })}
        onSaved={(roomName) => {
          setRoomDialog({ open: false, existing: null });
          setToast(`Room ${roomName} saved — suitable-occupancy KPI, space-standard tiles and the Department return updated.`);
        }}
      />

      <Snackbar
        open={!!toast}
        autoHideDuration={4500}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setToast(null)} severity="success" variant="filled" sx={{ width: "100%" }}>
          {toast}
        </Alert>
      </Snackbar>
    </PageShell>
  );
}

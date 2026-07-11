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
import ApartmentIcon from "@mui/icons-material/Apartment";
import DescriptionIcon from "@mui/icons-material/Description";
import { useNavigate, useParams } from "react-router-dom";
import PageShell from "../components/PageShell";
import StatCard from "../components/StatCard";
import { useAppState } from "../data/store";
import { RegisterEntry, SPACE_STANDARD_M2_PER_PERSON } from "../data/types";
import { brand, rag, surface } from "../theme/tokens";

const REGISTER_STATUS: Record<RegisterEntry["status"], { label: string; color: string; bg: string }> = {
  in_order: { label: "In order", color: rag.green, bg: rag.greenBg },
  attention: { label: "Needs attention", color: rag.amber, bg: rag.amberBg },
  not_reviewed: { label: "Not reviewed", color: rag.neutral, bg: rag.neutralBg },
};

export default function CentreOperations() {
  const { centreId } = useParams();
  const navigate = useNavigate();
  const { centres, roomsByCentre, registersByCentre } = useAppState();

  const centre = centres.find((c) => c.id === centreId) ?? centres[0];
  const rooms = roomsByCentre[centre.id] ?? [];
  const registers = registersByCentre[centre.id] ?? [];

  const occupied = rooms.filter((r) => (r.currentOccupancy ?? 0) > 0);
  const overOccupied = rooms.filter(
    (r) => r.currentOccupancy !== null && r.suitableOccupancy !== null && r.currentOccupancy > r.suitableOccupancy,
  );
  const withIssues = rooms.filter((r) => r.issues.length > 0);
  const suitableTotal = rooms.reduce((s, r) => s + (r.suitableOccupancy ?? 0), 0);

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
            sx={{ minWidth: 220, backgroundColor: "#fff" }}
          >
            {centres.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.shortName}
              </MenuItem>
            ))}
          </Select>
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
            <Typography variant="h6" sx={{ color: brand.charcoal }}>
              {centre.name}
            </Typography>
            <Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>
              {centre.location}, Co. {centre.county} · {centre.accommodationId} · Profile: {centre.profile} · Manager:{" "}
              {centre.manager} · Last IPPS inspection: {centre.lastIppsInspection ?? "—"}
            </Typography>
          </Box>
          {centre.isDemoData && <Chip label="Demo data — real registers land per centre in Phase 1" size="small" />}
        </Box>
      </Paper>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={2.4}>
          <StatCard label="Rooms" value={rooms.length} sub={`${occupied.length} occupied`} accent={brand.charcoal} />
        </Grid>
        <Grid item xs={6} md={2.4}>
          <StatCard label="Occupancy" value={centre.occupancy} sub={`of ${centre.contractCapacity} contracted`} accent={brand.red} />
        </Grid>
        <Grid item xs={6} md={2.4}>
          <StatCard label="Suitable capacity" value={suitableTotal} sub={`derived @ ${SPACE_STANDARD_M2_PER_PERSON} m²/person`} accent={brand.charcoal} />
        </Grid>
        <Grid item xs={6} md={2.4}>
          <StatCard
            label="Over-occupied"
            value={overOccupied.length}
            sub="rooms above suitable occupancy"
            accent={overOccupied.length > 0 ? rag.red : rag.green}
          />
        </Grid>
        <Grid item xs={6} md={2.4}>
          <StatCard
            label="Rooms with issues"
            value={withIssues.length}
            sub="flagged at inspection"
            accent={withIssues.length > 0 ? rag.amber : rag.green}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ overflow: "hidden" }}>
            <Box sx={{ p: 2, pb: 1 }}>
              <Typography variant="h6" sx={{ fontSize: "1.05rem", color: brand.charcoal }}>
                Room register
              </Typography>
              <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
                Suitable occupancy is derived automatically: room area ÷ {SPACE_STANDARD_M2_PER_PERSON} m²
              </Typography>
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
                      <TableRow key={room.room} hover sx={over ? { backgroundColor: rag.redBg } : undefined}>
                        <TableCell sx={{ fontWeight: 600 }}>{room.room}</TableCell>
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
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ fontSize: "1.05rem", color: brand.charcoal, mb: 1 }}>
              Administration registers
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
                      backgroundColor: surface.subtleBg,
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontSize: "0.83rem", fontWeight: 600, lineHeight: 1.3 }}>{reg.name}</Typography>
                      <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
                        Last reviewed {reg.lastReviewed}
                        {reg.note ? ` — ${reg.note}` : ""}
                      </Typography>
                    </Box>
                    <Chip label={s.label} size="small" sx={{ backgroundColor: s.bg, color: s.color, fontWeight: 600, flexShrink: 0 }} />
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </PageShell>
  );
}

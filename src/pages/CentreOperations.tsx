import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import ApartmentIcon from "@mui/icons-material/Apartment";
import { useParams } from "react-router-dom";
import PageShell from "../components/PageShell";

export default function CentreOperations() {
  const { centreId } = useParams();
  return (
    <PageShell
      icon={ApartmentIcon}
      title="Centre Operations"
      subtitle="Room register, occupancy, and administration registers for the selected centre"
    >
      <Paper sx={{ p: 3 }}>
        <Typography color="text.secondary">
          Room register for centre "{centreId}" lands in the next build step.
        </Typography>
      </Paper>
    </PageShell>
  );
}

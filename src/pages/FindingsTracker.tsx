import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import PageShell from "../components/PageShell";

export default function FindingsTracker() {
  return (
    <PageShell
      icon={FactCheckIcon}
      title="Findings & Actions"
      subtitle="Inspection findings with RAG priority and the 14-day evidence clock"
    >
      <Paper sx={{ p: 3 }}>
        <Typography color="text.secondary">
          Findings register lands in the next build step.
        </Typography>
      </Paper>
    </PageShell>
  );
}

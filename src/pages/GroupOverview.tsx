import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PageShell from "../components/PageShell";

export default function GroupOverview() {
  return (
    <PageShell
      icon={DashboardIcon}
      title="Group Overview"
      subtitle="Compliance position across all 8 Peppard accommodation centres"
    >
      <Paper sx={{ p: 3 }}>
        <Typography color="text.secondary">
          Centre RAG summary grid lands in the next build step.
        </Typography>
      </Paper>
    </PageShell>
  );
}

import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import RuleIcon from "@mui/icons-material/Rule";
import PageShell from "../components/PageShell";

export default function StandardsRegister() {
  return (
    <PageShell
      icon={RuleIcon}
      title="HIQA Standards"
      subtitle="National Standards self-assessment with sector benchmarking"
    >
      <Paper sx={{ p: 3 }}>
        <Typography color="text.secondary">
          Standards register with sector benchmark overlay lands in the next build step.
        </Typography>
      </Paper>
    </PageShell>
  );
}

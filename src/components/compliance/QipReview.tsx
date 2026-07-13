import { useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import RateReviewIcon from "@mui/icons-material/RateReview";
import QipFormDialog from "./QipFormDialog";
import { useAppState } from "../../data/store";
import { Centre, Qip, qipProgress } from "../../data/types";
import { accent, rag } from "../../theme/tokens";

interface Props {
  centreFilter: string;
  centres: Centre[];
  centreName: (id: string) => string;
}

// Governance review queue: QIPs awaiting sign-off. Reviewing opens the
// full plan — moving it back to Active (or Closed) clears it from the queue.
export default function QipReview({ centreFilter, centres, centreName }: Props) {
  const { qips } = useAppState();
  const [review, setReview] = useState<Qip | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const queue = qips
    .filter((q) => centreFilter === "all" || q.centreId === centreFilter || q.centreId === null)
    .filter((q) => q.status === "under_review")
    .sort((a, b) => ((a.targetOn ?? "9999") < (b.targetOn ?? "9999") ? -1 : 1));

  return (
    <Box>
      <Typography sx={{ fontSize: "0.85rem", color: "text.secondary", mb: 1.5, maxWidth: 680 }}>
        Quality improvement plans awaiting governance sign-off. A reviewed plan moves back to Active (further work
        agreed) or Closed (improvement embedded and evidenced).
      </Typography>

      {queue.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <RateReviewIcon sx={{ fontSize: 36, color: accent.green, mb: 1 }} />
          <Typography sx={{ fontWeight: 700 }}>Nothing awaiting review</Typography>
          <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
            No QIPs are in the Under review state for this facility — the QIP register holds the full list.
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {queue.map((q) => {
            const pct = qipProgress(q);
            return (
              <Paper key={q.id} sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                <Box sx={{ minWidth: 260, flex: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                    <Typography sx={{ fontSize: "0.9rem", fontWeight: 700 }}>{q.title}</Typography>
                    <Chip label="Under review" size="small" sx={{ height: 20, fontSize: "0.66rem", fontWeight: 700, backgroundColor: rag.amberBg, color: rag.amber }} />
                  </Box>
                  <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
                    {q.centreId ? centreName(q.centreId) : "Group"} · {q.theme} · owner {q.owner}
                    {q.targetOn ? ` · target ${q.targetOn}` : ""}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 180 }}>
                  <LinearProgress variant="determinate" value={pct} sx={{ flex: 1, height: 7, borderRadius: 4, backgroundColor: "action.hover", "& .MuiLinearProgress-bar": { backgroundColor: pct >= 80 ? rag.green : rag.amber } }} />
                  <Typography sx={{ fontSize: "0.75rem", fontWeight: 700 }}>{pct}%</Typography>
                </Box>
                <Button variant="outlined" size="small" onClick={() => setReview(q)}>
                  Review
                </Button>
              </Paper>
            );
          })}
        </Box>
      )}

      <QipFormDialog
        open={!!review}
        centres={centres}
        existing={review}
        onClose={() => setReview(null)}
        onSaved={(msg) => {
          setReview(null);
          setToast(msg);
        }}
      />
      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={() => setToast(null)} severity="success" variant="filled" sx={{ width: "100%" }}>{toast}</Alert>
      </Snackbar>
    </Box>
  );
}

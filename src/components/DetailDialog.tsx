import { ReactNode } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import { useSurfaces } from "../theme";

export interface DetailRow {
  id: string;
  leading?: ReactNode; // coloured dot, RAG chip, standard id…
  primary: ReactNode;
  secondary?: ReactNode;
  trailing?: ReactNode; // value or status on the right
}

export interface DetailContent {
  title: string;
  subtitle?: string;
  rows: DetailRow[];
  emptyText?: string;
}

// Drill-down for a summary stat card: the same figure, broken out into
// the individual records behind it. Content is built by the caller so the
// dialog stays a dumb, reusable list.
export default function DetailDialog({ content, onClose }: { content: DetailContent | null; onClose: () => void }) {
  const s = useSurfaces();
  const open = content !== null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth scroll="paper" PaperProps={{ sx: { maxHeight: "min(680px, 88vh)" } }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", px: 2.5, py: 1.5, borderBottom: `1px solid ${s.border}` }}>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="h6">{content?.title}</Typography>
          {content?.subtitle && (
            <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>{content.subtitle}</Typography>
          )}
        </Box>
        <IconButton aria-label="Close details" onClick={onClose} size="small" sx={{ ml: 1 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <DialogContent sx={{ p: 0 }}>
        {content && content.rows.length === 0 ? (
          <Typography sx={{ p: 3, fontSize: "0.9rem", color: "text.secondary" }}>
            {content.emptyText ?? "Nothing to show."}
          </Typography>
        ) : (
          content?.rows.map((row, i) => (
            <Box
              key={row.id}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: 2.5,
                py: 1.5,
                borderTop: i > 0 ? `1px solid ${s.border}` : "none",
              }}
            >
              {row.leading && <Box sx={{ flexShrink: 0, display: "flex", alignItems: "center" }}>{row.leading}</Box>}
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                {/* component="div": primary/secondary may contain chips (block elements) */}
                <Typography component="div" sx={{ fontSize: "0.88rem", fontWeight: 600, color: "text.primary", display: "flex", alignItems: "center", flexWrap: "wrap" }}>
                  {row.primary}
                </Typography>
                {row.secondary && (
                  <Typography component="div" sx={{ fontSize: "0.8rem", color: "text.secondary" }}>{row.secondary}</Typography>
                )}
              </Box>
              {row.trailing && (
                <Box sx={{ flexShrink: 0, textAlign: "right", display: "flex", alignItems: "center" }}>{row.trailing}</Box>
              )}
            </Box>
          ))
        )}
      </DialogContent>
    </Dialog>
  );
}

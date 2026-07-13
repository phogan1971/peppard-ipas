import { useRef, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Tooltip from "@mui/material/Tooltip";
import DescriptionIcon from "@mui/icons-material/Description";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { SourceDocument } from "../data/types";
import { accent, rag } from "../theme/tokens";
import { useSurfaces } from "../theme";

const MAX_KB = 4096; // keep uploads within a safe localStorage budget

interface Props {
  documents: SourceDocument[];
  // The centre an upload attaches to; null when the "All centres" filter is on.
  uploadCentreId: string | null;
  uploadCentreName: string;
  onUpload: (centreId: string, doc: { name: string; dataUrl: string; sizeKb: number }) => void;
  centreName: (id: string) => string;
}

export default function InspectionReportsPanel({ documents, uploadCentreId, uploadCentreName, onUpload, centreName }: Props) {
  const surf = useSurfaces();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File) => {
    setError(null);
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please choose a PDF file.");
      return;
    }
    const sizeKb = Math.round(file.size / 1024);
    if (sizeKb > MAX_KB) {
      setError(`That file is ${(sizeKb / 1024).toFixed(1)} MB — please use a report under 4 MB for the demo.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (uploadCentreId) onUpload(uploadCentreId, { name: file.name, dataUrl: String(reader.result), sizeKb });
    };
    reader.readAsDataURL(file);
  };

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1, flexWrap: "wrap", mb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <DescriptionIcon sx={{ color: accent.navy, fontSize: 20 }} />
          <Box>
            <Typography variant="h6" sx={{ fontSize: "1.05rem", color: "text.primary" }}>
              Inspection reports
            </Typography>
            <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
              Upload a report to attach it as the source — its findings are summarised in the table below.
            </Typography>
          </Box>
        </Box>
        <Tooltip title={uploadCentreId ? `Attach to ${uploadCentreName}` : "Filter to a single centre to attach a report"}>
          <span>
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
            <Button
              variant="outlined"
              startIcon={<UploadFileIcon />}
              disabled={!uploadCentreId}
              onClick={() => inputRef.current?.click()}
            >
              Upload report
            </Button>
          </span>
        </Tooltip>
      </Box>

      {error && (
        <Typography sx={{ fontSize: "0.8rem", color: rag.red, mb: 1 }}>{error}</Typography>
      )}

      {documents.length === 0 ? (
        <Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>
          No inspection report attached{uploadCentreId ? ` for ${uploadCentreName}` : ""} yet — upload one to reference it here.
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {documents.map((d) => (
            <Box
              key={d.id}
              sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, p: 1, borderRadius: 1, backgroundColor: surf.subtleBg }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                  <Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>{d.name}</Typography>
                  <Chip
                    label={d.kind === "sample" ? "Sample" : "Uploaded"}
                    size="small"
                    sx={{ height: 18, fontSize: "0.62rem", fontWeight: 700, backgroundColor: d.kind === "sample" ? rag.greenBg : surf.pillRowBg, color: d.kind === "sample" ? rag.green : "text.secondary" }}
                  />
                </Box>
                <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
                  {centreName(d.centreId)} · {d.uploadedOn} · {d.uploadedBy}
                  {d.sizeKb ? ` · ${d.sizeKb >= 1024 ? (d.sizeKb / 1024).toFixed(1) + " MB" : d.sizeKb + " KB"}` : ""}
                </Typography>
              </Box>
              <Link href={d.url} target="_blank" rel="noopener" sx={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 0.5, fontSize: "0.8rem", fontWeight: 600 }}>
                View report <OpenInNewIcon sx={{ fontSize: 15 }} />
              </Link>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
}

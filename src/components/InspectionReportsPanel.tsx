import { MouseEvent, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Tooltip from "@mui/material/Tooltip";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import DescriptionIcon from "@mui/icons-material/Description";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import InsightsIcon from "@mui/icons-material/Insights";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import { Centre, SourceDocument } from "../data/types";
import { accent, rag } from "../theme/tokens";
import { useSurfaces } from "../theme";

const MAX_KB = 4096; // keep uploads within a safe localStorage budget

interface Props {
  documents: SourceDocument[];
  // The centre to attach to when a single facility is filtered; null on "All".
  uploadCentreId: string | null;
  uploadCentreName: string;
  centres: Centre[];
  onUpload: (centreId: string, doc: { name: string; dataUrl: string; sizeKb: number }) => void;
  onRecordAudit: (centreId: string) => void;
  onProcess: (doc: SourceDocument) => void;
  centreName: (id: string) => string;
}

const KIND_LABEL: Record<SourceDocument["kind"], string> = {
  internal: "Internal audit",
  sample: "Department inspection",
  uploaded: "Uploaded inspection",
};

export default function InspectionReportsPanel({ documents, uploadCentreId, uploadCentreName, centres, onUpload, onRecordAudit, onProcess, centreName }: Props) {
  const surf = useSurfaces();
  const inputRef = useRef<HTMLInputElement>(null);
  // The facility the next file selection attaches to (set before opening the
  // OS file picker — from the filter, or from the facility menu on "All").
  const uploadTargetRef = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pickerAnchor, setPickerAnchor] = useState<null | HTMLElement>(null);
  const [pickerMode, setPickerMode] = useState<"audit" | "attach">("attach");

  const handleFile = (file: File) => {
    setError(null);
    const target = uploadTargetRef.current;
    if (!target) return;
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
    reader.onload = () => onUpload(target, { name: file.name, dataUrl: String(reader.result), sizeKb });
    reader.readAsDataURL(file);
  };

  const openFilePicker = (centreId: string) => {
    uploadTargetRef.current = centreId;
    inputRef.current?.click();
  };

  // Record-audit / attach: act directly if a facility is filtered, else open
  // a facility menu so the operator picks where the report lands.
  const startAudit = (e: MouseEvent<HTMLElement>) => {
    if (uploadCentreId) onRecordAudit(uploadCentreId);
    else { setPickerMode("audit"); setPickerAnchor(e.currentTarget); }
  };
  const startAttach = (e: MouseEvent<HTMLElement>) => {
    if (uploadCentreId) openFilePicker(uploadCentreId);
    else { setPickerMode("attach"); setPickerAnchor(e.currentTarget); }
  };
  const pickCentre = (centreId: string) => {
    setPickerAnchor(null);
    if (pickerMode === "audit") onRecordAudit(centreId);
    else setTimeout(() => openFilePicker(centreId), 0);
  };

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1, flexWrap: "wrap", mb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <DescriptionIcon sx={{ color: accent.navy, fontSize: 20 }} />
          <Box>
            <Typography variant="h6" sx={{ fontSize: "1.05rem", color: "text.primary" }}>
              Audits &amp; inspections
            </Typography>
            <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
              The internal governance record — carry out your own audit inspections; attach a Department/HIQA inspection
              when one happens. Each feeds the registers and KPIs.
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
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
          <Tooltip title={uploadCentreId ? `Record an internal audit for ${uploadCentreName}` : "Record an internal audit — choose a facility"}>
            <Button variant="contained" disableElevation startIcon={<FactCheckIcon />} onClick={startAudit}>
              Record internal audit
            </Button>
          </Tooltip>
          <Tooltip title={uploadCentreId ? `Attach a Department/HIQA inspection to ${uploadCentreName}` : "Attach a Department/HIQA inspection PDF — choose a facility"}>
            <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={startAttach}>
              Attach inspection
            </Button>
          </Tooltip>
          <Menu anchorEl={pickerAnchor} open={!!pickerAnchor} onClose={() => setPickerAnchor(null)}>
            <MenuItem disabled sx={{ fontSize: "0.72rem", opacity: 0.8 }}>
              {pickerMode === "audit" ? "Record audit for…" : "Attach inspection to…"}
            </MenuItem>
            {centres.map((c) => (
              <MenuItem key={c.id} onClick={() => pickCentre(c.id)}>
                {c.shortName}
              </MenuItem>
            ))}
          </Menu>
        </Box>
      </Box>

      {error && (
        <Typography sx={{ fontSize: "0.8rem", color: rag.red, mb: 1 }}>{error}</Typography>
      )}

      {documents.length === 0 ? (
        <Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>
          No audits recorded{uploadCentreId ? ` for ${uploadCentreName}` : ""} yet — record an internal audit or attach an
          inspection to reference it here.
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
                    label={KIND_LABEL[d.kind]}
                    size="small"
                    sx={{ height: 18, fontSize: "0.62rem", fontWeight: 700, backgroundColor: d.kind === "internal" ? rag.greenBg : surf.pillRowBg, color: d.kind === "internal" ? rag.green : "text.secondary" }}
                  />
                </Box>
                <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
                  {centreName(d.centreId)} · {d.uploadedOn} · {d.uploadedBy}
                  {d.sizeKb ? ` · ${d.sizeKb >= 1024 ? (d.sizeKb / 1024).toFixed(1) + " MB" : d.sizeKb + " KB"}` : ""}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexShrink: 0 }}>
                <Button size="small" variant="outlined" startIcon={<InsightsIcon sx={{ fontSize: 16 }} />} onClick={() => onProcess(d)}>
                  Disseminate
                </Button>
                {d.url ? (
                  <Link href={d.url} target="_blank" rel="noopener" sx={{ display: "flex", alignItems: "center", gap: 0.5, fontSize: "0.8rem", fontWeight: 600 }}>
                    View report <OpenInNewIcon sx={{ fontSize: 15 }} />
                  </Link>
                ) : (
                  <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", fontStyle: "italic" }}>Self-assessed</Typography>
                )}
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
}

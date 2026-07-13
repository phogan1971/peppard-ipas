import { useRef, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import MenuItem from "@mui/material/MenuItem";
import Menu from "@mui/material/Menu";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { addSourceDocument, useAppState } from "../../data/store";
import { SourceDocument } from "../../data/types";
import { rag } from "../../theme/tokens";
import { useSurfaces } from "../../theme";

const MAX_KB = 4096; // same localStorage budget as Findings & Actions uploads

const KIND_LABEL: Record<SourceDocument["kind"], string> = {
  internal: "Internal audit",
  sample: "Department inspection",
  uploaded: "Uploaded document",
};

// The evidence library: every governance source in one place — internal
// audits (self-assessed, no file), the bundled Riverside report, and any
// PDF the operator attaches.
export default function EvidencePanel({ centreFilter }: { centreFilter: string }) {
  const surf = useSurfaces();
  const { documentsByCentre, centres } = useAppState();
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<string | null>(null);
  const [pickerAnchor, setPickerAnchor] = useState<null | HTMLElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const centreName = (id: string) => centres.find((c) => c.id === id)?.shortName ?? id;
  const scope = centreFilter === "all" ? centres.map((c) => c.id) : [centreFilter];
  const documents = scope
    .flatMap((id) => documentsByCentre[id] ?? [])
    .sort((a, b) => (a.uploadedOn < b.uploadedOn ? 1 : -1));

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
      setError(`That file is ${(sizeKb / 1024).toFixed(1)} MB — please use a document under 4 MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      addSourceDocument(target, { name: file.name, dataUrl: String(reader.result), sizeKb }, "Evidence library");
      setToast(`${file.name} attached to ${centreName(target)}.`);
    };
    reader.readAsDataURL(file);
  };

  const startUpload = (e: React.MouseEvent<HTMLElement>) => {
    if (centreFilter !== "all") {
      uploadTargetRef.current = centreFilter;
      inputRef.current?.click();
    } else {
      setPickerAnchor(e.currentTarget);
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1, flexWrap: "wrap", mb: 1 }}>
        <Typography sx={{ fontSize: "0.85rem", color: "text.secondary", maxWidth: 620 }}>
          Every governance source in one library — internal audits, Department/HIQA inspections and attached evidence
          documents. Each is referenced from the findings it informs.
        </Typography>
        <Box>
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
          <Button variant="contained" disableElevation startIcon={<UploadFileIcon />} onClick={startUpload}>
            Attach document
          </Button>
          <Menu anchorEl={pickerAnchor} open={!!pickerAnchor} onClose={() => setPickerAnchor(null)}>
            <MenuItem disabled sx={{ fontSize: "0.72rem", opacity: 0.8 }}>Attach to…</MenuItem>
            {centres.map((c) => (
              <MenuItem
                key={c.id}
                onClick={() => {
                  setPickerAnchor(null);
                  uploadTargetRef.current = c.id;
                  setTimeout(() => inputRef.current?.click(), 0);
                }}
              >
                {c.shortName}
              </MenuItem>
            ))}
          </Menu>
        </Box>
      </Box>

      {error && <Typography sx={{ fontSize: "0.8rem", color: rag.red, mb: 1 }}>{error}</Typography>}

      <Paper sx={{ overflow: "hidden" }}>
        <TableContainer sx={{ maxHeight: 560 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Document</TableCell>
                <TableCell>Kind</TableCell>
                <TableCell>Facility</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Source</TableCell>
                <TableCell align="right">Size</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {documents.map((d) => (
                <TableRow key={d.id} hover>
                  <TableCell sx={{ fontSize: "0.83rem", fontWeight: 600 }}>{d.name}</TableCell>
                  <TableCell>
                    <Chip
                      label={KIND_LABEL[d.kind]}
                      size="small"
                      sx={{ height: 20, fontSize: "0.66rem", fontWeight: 700, backgroundColor: d.kind === "internal" ? rag.greenBg : surf.pillRowBg, color: d.kind === "internal" ? rag.green : "text.secondary" }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}>{centreName(d.centreId)}</TableCell>
                  <TableCell sx={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}>{d.uploadedOn}</TableCell>
                  <TableCell sx={{ fontSize: "0.8rem" }}>{d.uploadedBy}</TableCell>
                  <TableCell align="right" sx={{ fontSize: "0.78rem", color: "text.secondary", whiteSpace: "nowrap" }}>
                    {d.sizeKb ? (d.sizeKb >= 1024 ? `${(d.sizeKb / 1024).toFixed(1)} MB` : `${d.sizeKb} KB`) : "—"}
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    {d.url ? (
                      <Link href={d.url} target="_blank" rel="noopener" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, fontSize: "0.8rem", fontWeight: 600 }}>
                        View <OpenInNewIcon sx={{ fontSize: 15 }} />
                      </Link>
                    ) : (
                      <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", fontStyle: "italic" }}>Self-assessed</Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {documents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Typography sx={{ color: "text.secondary", p: 1 }}>No documents for this facility yet.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={() => setToast(null)} severity="success" variant="filled" sx={{ width: "100%" }}>{toast}</Alert>
      </Snackbar>
    </Box>
  );
}

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import CampaignIcon from "@mui/icons-material/Campaign";
import { NoticeItem } from "../data/types";
import { rag } from "../theme/tokens";
import { useSurfaces } from "../theme";

interface Props {
  notices: NoticeItem[];
  onVerify: (name: string, compliant: boolean) => void;
}

export default function NoticesPanel({ notices, onVerify }: Props) {
  const surf = useSurfaces();
  const displayed = notices.filter((n) => n.compliant).length;
  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
        <CampaignIcon sx={{ color: rag.amber, fontSize: 20 }} />
        <Typography variant="h6" sx={{ fontSize: "1.05rem", color: "text.primary" }}>
          Mandatory notices checklist
        </Typography>
      </Box>
      <Typography sx={{ fontSize: "0.8rem", color: "text.secondary", mb: 1.5 }}>
        {displayed} of {notices.length} mandatory public notices displayed and verified (IPPS visual-inspection §2).
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {notices.map((n) => (
          <Box
            key={n.name}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 1,
              p: 1,
              borderRadius: 1,
              backgroundColor: surf.subtleBg,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: "0.83rem", fontWeight: 600, lineHeight: 1.3 }}>{n.name}</Typography>
              <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
                {n.verifiedOn ? `Verified ${n.verifiedOn}` : "Not yet verified"}
                {n.verifiedBy ? ` · by ${n.verifiedBy}` : ""}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexShrink: 0 }}>
              <Chip
                label={n.compliant ? "Displayed" : "Missing"}
                size="small"
                sx={{
                  backgroundColor: n.compliant ? rag.greenBg : rag.redBg,
                  color: n.compliant ? rag.green : rag.red,
                  fontWeight: 700,
                }}
              />
              {!n.compliant ? (
                <Button size="small" variant="outlined" onClick={() => onVerify(n.name, true)} sx={{ minWidth: 0, px: 1 }}>
                  Verify
                </Button>
              ) : (
                <Button
                  size="small"
                  onClick={() => onVerify(n.name, false)}
                  sx={{ minWidth: 0, px: 1, color: "text.secondary" }}
                >
                  Flag
                </Button>
              )}
            </Box>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}

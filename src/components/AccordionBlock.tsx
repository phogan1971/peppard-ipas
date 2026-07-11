import { ReactNode, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Collapse from "@mui/material/Collapse";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { accordion, brand } from "../theme/tokens";

interface AccordionBlockProps {
  title: string;
  subtitle?: string;
  headerExtra?: ReactNode; // chips / counts shown in the header row
  defaultExpanded?: boolean;
  children: ReactNode;
}

// Genisis3 accordion header block (DESIGN_SYSTEM_HELPER §6 /
// SupplementaryInfoSection): tinted wrapper, #dde3e6 clickable header,
// navy bold title + caption subtitle, navy chevron button.
export default function AccordionBlock({
  title,
  subtitle,
  headerExtra,
  defaultExpanded = false,
  children,
}: AccordionBlockProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <Box
      sx={{
        position: "relative",
        backgroundColor: accordion.wrapperBg,
        border: `1px solid ${brand.border}`,
        borderRadius: "10px",
        overflow: "hidden",
        transition: "all 0.2s ease",
        mb: 1,
        "&:hover": {
          borderColor: accordion.hoverBorder,
          boxShadow: accordion.hoverRing,
        },
      }}
    >
      <Box
        onClick={() => setExpanded((v) => !v)}
        sx={{
          display: "flex",
          alignItems: "center",
          padding: { xs: "8px 12px", sm: "10px 16px" },
          gap: { xs: 1, sm: 1.5 },
          flexWrap: "wrap",
          backgroundColor: accordion.headerBg,
          cursor: "pointer",
          "&:hover": { backgroundColor: accordion.headerHover },
        }}
      >
        <Box sx={{ flex: "1 1 auto", minWidth: 200 }}>
          <Typography variant="body1" sx={{ fontWeight: 700, color: brand.primary, mb: 0.25, fontSize: "0.875rem" }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: "#333" }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {headerExtra && <Box sx={{ flex: "0 0 auto", display: "flex", gap: 1, alignItems: "center" }}>{headerExtra}</Box>}
        <IconButton
          size="small"
          aria-label={expanded ? `Collapse ${title}` : `Expand ${title}`}
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          sx={{
            backgroundColor: brand.primary,
            color: "#fff",
            "&:hover": { backgroundColor: brand.primaryDark },
            width: 28,
            height: 28,
          }}
        >
          {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </IconButton>
      </Box>
      <Collapse in={expanded}>
        <Box sx={{ backgroundColor: "#fff" }}>{children}</Box>
      </Collapse>
    </Box>
  );
}

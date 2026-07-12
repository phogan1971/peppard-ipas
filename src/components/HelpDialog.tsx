import { useEffect, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import CloseIcon from "@mui/icons-material/Close";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ApartmentIcon from "@mui/icons-material/Apartment";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import RuleIcon from "@mui/icons-material/Rule";
import InsightsIcon from "@mui/icons-material/Insights";
import DescriptionIcon from "@mui/icons-material/Description";
import SettingsIcon from "@mui/icons-material/Settings";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import { SvgIconComponent } from "@mui/icons-material";
import { useLocation } from "react-router-dom";
import { useSurfaces } from "../theme";

type TopicKey = "overview" | "exec" | "centres" | "findings" | "standards" | "kpis" | "documents" | "settings";

interface HelpBlock {
  heading?: string;
  body?: string;
  bullets?: string[];
}

interface Topic {
  key: TopicKey;
  label: string;
  Icon: SvgIconComponent;
  title: string;
  blocks: HelpBlock[];
}

const TOPICS: Topic[] = [
  {
    key: "overview",
    label: "Group Overview",
    Icon: DashboardIcon,
    title: "Group Overview",
    blocks: [
      {
        body: "The landing view for the whole estate: every centre's compliance position on one screen, refreshed from the underlying registers every time you open it.",
      },
      {
        heading: "Reading the page",
        bullets: [
          "The four cards summarise the group: contracted capacity, occupancy against contract, open inspection findings (with the red/amber split), and anything past the 14-day evidence clock.",
          "Each centre card shows occupancy and its overall position — the coloured top edge and status line reflect the most serious finding currently open there.",
          "“No open findings” / “GREEN items only” means nothing needs escalation; an overdue chip means an evidence deadline has been missed.",
          "Click any centre card to open its Centre Operations view.",
          "The Board pack button generates the quarterly governance pack from this same data.",
        ],
      },
    ],
  },
  {
    key: "exec",
    label: "Executive view",
    Icon: PhoneIphoneIcon,
    title: "Executive view",
    blocks: [
      {
        body: "A phone-friendly digest of the group governance position, designed for directors between meetings. Reach it from the platform home screen (Executive view under the Peppard card) or directly at /exec.",
      },
      {
        heading: "Reading the page",
        bullets: [
          "The group status banner rolls the whole estate up to one position: ACTION REQUIRED (a RED finding is open or evidence is past the 14-day clock), MONITOR (AMBER items in the loop), or ON TRACK.",
          "The six tiles cover occupancy, findings, overdue evidence, KPIs on target, the HIQA self-assessment position and rooms within the 4.65 m² space standard — all computed from the same registers as the full dashboard.",
          "Needs attention lists the most urgent open items (RED or overdue) with their evidence clocks; tap one to open the Findings tracker.",
          "Tap any centre row to open its full Operations view. The dashboard icon in the header returns to the desktop dashboard.",
        ],
      },
    ],
  },
  {
    key: "centres",
    label: "Centre Operations",
    Icon: ApartmentIcon,
    title: "Centre Operations",
    blocks: [
      {
        body: "The day-to-day operational picture for one centre. Switch centres with the selector in the header. Riverside carries its actual March 2026 IPPS inspection dataset.",
      },
      {
        heading: "Room register",
        bullets: [
          "Every room with its bed configuration, floor area and current occupancy.",
          "Suitable occupancy is derived automatically: floor area ÷ 4.65 m² per person (the Department's space standard). Nobody keys it.",
          "Rooms above their suitable occupancy are flagged “Over” and highlighted — this is the contractual exposure the Department inspects against.",
          "Issues recorded at inspection or self-audit (prohibited appliances, mould, etc.) appear against the room.",
        ],
      },
      {
        heading: "Administration registers",
        bullets: [
          "The registers an IPPS inspector asks for — staff, fire safety, drills, cleaning, visitors and so on — each with review status and last-reviewed date.",
          "The Department return and Readiness pack buttons assemble this centre's documents in one click.",
        ],
      },
    ],
  },
  {
    key: "findings",
    label: "Findings & Actions",
    Icon: FactCheckIcon,
    title: "Findings & Actions",
    blocks: [
      {
        body: "The corrective-action loop for inspection findings across all centres, driven by the Department's 14-day evidence requirement.",
      },
      {
        heading: "How the loop works",
        bullets: [
          "Every finding carries the inspector's RAG priority: RED (contractual breach / high risk), AMBER (resolve within the agreed 14 days), GREEN (low concern, monitor). UNMARKED means the source report had no box ticked.",
          "For 14-day items a live clock counts down to the evidence deadline — it turns amber when close and red once overdue.",
          "“Mark evidence submitted” records that the evidence pack has gone to IPAS; “Close finding” records acceptance. Closed items stay on the register as an audit trail (use “Show closed”).",
          "Filter by centre with the pill row; findings sort with the most urgent deadline first.",
        ],
      },
    ],
  },
  {
    key: "standards",
    label: "HIQA Standards",
    Icon: RuleIcon,
    title: "HIQA Standards",
    blocks: [
      {
        body: "Self-assessment against all 40 National Standards (10 themes) for each centre, with sector benchmarking. IPAS centres are not designated centres, so HIQA inspections are monitoring visits — this register keeps the group inspection-ready.",
      },
      {
        heading: "Using the register",
        bullets: [
          "Pick a centre in the header, expand a theme, and set each standard's judgement on HIQA's own 4-point scale. Changes save immediately.",
          "Theme headers show at a glance whether anything sits below substantial compliance.",
        ],
      },
      {
        heading: "The sector benchmark bar",
        bullets: [
          "Built from the 69 HIQA IPAS inspections published to date (tracked in the group's sector spreadsheet).",
          "Each bar shows how those inspections judged that standard: dark green compliant, light green substantially, orange partially, red not compliant — segment width is the share of inspections.",
          "Hover for exact counts. The n varies because not every inspection assesses every standard; “No sector data” means none has yet.",
          "A largely orange/red bar marks a sector-wide weak point — expect HIQA to look hard at it, and prepare evidence accordingly.",
        ],
      },
    ],
  },
  {
    key: "kpis",
    label: "KPI Framework",
    Icon: InsightsIcon,
    title: "KPI Framework",
    blocks: [
      {
        body: "The revised performance framework in full: 13 domains, 74 KPIs, each mapped to the register that evidences it. The framework's governing rule: every KPI computes from a register — nothing is manually keyed.",
      },
      {
        heading: "Reading the page",
        bullets: [
          "The cards roll up the whole framework: on target, near target, off target, and how many compute live right now.",
          "Each domain expands to its KPI table: measure, assurance source register, reporting frequency, target and current position.",
          "KPIs marked LIVE are calculated in real time from data already in the system (occupancy vs contract, rooms within the space standard, findings closed on time, open REDs, mould cases, prohibited items).",
          "The remainder show indicative values until their assurance registers come online in Phase 2 — at which point they compute the same way.",
        ],
      },
    ],
  },
  {
    key: "documents",
    label: "Generated documents",
    Icon: DescriptionIcon,
    title: "Generated documents",
    blocks: [
      {
        body: "Three documents assemble themselves from the live registers — nothing is transcribed. Use the browser's print dialog (Print / save as PDF) to produce the file; the app chrome is excluded automatically.",
      },
      {
        heading: "Inspection readiness pack",
        bullets: [
          "Per centre, from its Operations page: master record, occupancy and space-standard position, register status, findings with evidence status, and the HIQA self-assessment summary — everything an inspector asks for on arrival.",
        ],
      },
      {
        heading: "Department return",
        bullets: [
          "Per centre: mirrors the IPPS inspection-report structure — the areas-covered checklist, all 21 inspection sections with status, registers, the full room-by-room table, findings in Department format and the RAG legend.",
        ],
      },
      {
        heading: "Quarterly board pack",
        bullets: [
          "Group level, from the Overview page: group position, centre-by-centre compliance, KPI roll-up by domain, the open findings register, and standards themes needing a group-level improvement plan.",
        ],
      },
    ],
  },
  {
    key: "settings",
    label: "Settings",
    Icon: SettingsIcon,
    title: "Settings",
    blocks: [
      {
        body: "The cog in the top bar controls how the sample dataset presents while the platform runs ahead of its live register feeds.",
      },
      {
        heading: "Data settings",
        bullets: [
          "Presets set the overall tone: Strong performance (green-dominant), Mixed, or Under pressure (red-leaning, overdue items).",
          "The sliders fine-tune it: standards & registers compliance, findings pressure, and KPI performance.",
          "Apply & regenerate rebuilds every centre, finding, assessment and KPI position under the chosen profile. Reset to defaults returns to the standard presentation.",
          "The moon/sun icon beside the cog switches between light and dark mode; generated documents always stay light for printing.",
        ],
      },
    ],
  },
];

function topicForPath(pathname: string): TopicKey {
  if (pathname.startsWith("/overview")) return "overview";
  if (pathname.startsWith("/exec")) return "exec";
  if (/^\/centres\/[^/]+\/(readiness|return)/.test(pathname)) return "documents";
  if (pathname.startsWith("/centres")) return "centres";
  if (pathname.startsWith("/findings")) return "findings";
  if (pathname.startsWith("/standards")) return "standards";
  if (pathname.startsWith("/kpis")) return "kpis";
  if (pathname.startsWith("/board-pack")) return "documents";
  return "overview";
}

export default function HelpDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { pathname } = useLocation();
  const s = useSurfaces();
  const [topicKey, setTopicKey] = useState<TopicKey>(topicForPath(pathname));

  // Re-anchor to the current page each time help is opened
  useEffect(() => {
    if (open) setTopicKey(topicForPath(pathname));
  }, [open, pathname]);

  const topic = TOPICS.find((t) => t.key === topicKey) ?? TOPICS[0];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { height: "min(640px, 90vh)" } }}>
      <Box sx={{ display: "flex", alignItems: "center", px: 2.5, py: 1.5, borderBottom: `1px solid ${s.border}` }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Help
        </Typography>
        <IconButton aria-label="Close help" onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <DialogContent sx={{ display: "flex", p: 0, overflow: "hidden" }}>
        <List
          sx={{
            width: 230,
            flexShrink: 0,
            borderRight: `1px solid ${s.border}`,
            backgroundColor: s.subtleBg,
            overflowY: "auto",
            py: 1,
          }}
          aria-label="Help topics"
        >
          {TOPICS.map((t) => (
            <ListItemButton
              key={t.key}
              selected={t.key === topicKey}
              onClick={() => setTopicKey(t.key)}
              sx={{
                borderRadius: "8px",
                mx: 1,
                mb: 0.25,
                "&.Mui-selected": { backgroundColor: s.pillRowBg },
              }}
            >
              <ListItemIcon sx={{ minWidth: 34, color: s.heading }}>
                <t.Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: t.key === topicKey ? 700 : 500 }}>
                {t.label}
              </ListItemText>
            </ListItemButton>
          ))}
        </List>

        <Box sx={{ flexGrow: 1, overflowY: "auto", px: 3, py: 2.5 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            {topic.title}
          </Typography>
          {topic.blocks.map((block, i) => (
            <Box key={i} sx={{ mb: 2 }}>
              {block.heading && (
                <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: s.heading, mb: 0.75 }}>
                  {block.heading}
                </Typography>
              )}
              {block.body && (
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {block.body}
                </Typography>
              )}
              {block.bullets && (
                <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                  {block.bullets.map((b, j) => (
                    <Typography component="li" key={j} variant="body2" sx={{ color: "text.secondary", mb: 0.6 }}>
                      {b}
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>
          ))}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

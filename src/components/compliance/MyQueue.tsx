import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import { useNavigate } from "react-router-dom";
import { daysUntilDue, isOverdue, useAppState } from "../../data/store";
import { fireCurrencyFor, qipProgress, riskBand, riskScore } from "../../data/types";
import { rag } from "../../theme/tokens";

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface QueueItem {
  id: string;
  urgency: 0 | 1 | 2; // 0 = overdue/breach, 1 = due soon, 2 = routine
  what: string;
  detail: string;
  centreId: string | null;
  action: { label: string; tab?: string; route?: string };
}

interface Props {
  centreFilter: string;
  onOpenTab: (tab: string) => void;
}

// The work queue: everything the (selected facility's) manager should act
// on today, derived live from every register — the compliance to-do list.
export default function MyQueue({ centreFilter, onOpenTab }: Props) {
  const navigate = useNavigate();
  const s = useAppState();
  const today = todayIso();
  const scope = centreFilter === "all" ? s.centres.map((c) => c.id) : [centreFilter];
  const centreName = (id: string) => s.centres.find((c) => c.id === id)?.shortName ?? id;

  const items: QueueItem[] = [];

  for (const f of s.findings.filter((f) => scope.includes(f.centreId) && f.status === "open")) {
    const days = daysUntilDue(f);
    if (isOverdue(f)) {
      items.push({ id: `q-f-${f.id}`, urgency: 0, what: `Submit overdue evidence — ${f.finding}`, detail: `${centreName(f.centreId)} · 14-day clock ran out ${f.dueOn}`, centreId: f.centreId, action: { label: "Open CAPA", tab: "actions" } });
    } else if (days !== null && days <= 3) {
      items.push({ id: `q-f-${f.id}`, urgency: 1, what: `Evidence due in ${days}d — ${f.finding}`, detail: `${centreName(f.centreId)} · due ${f.dueOn}`, centreId: f.centreId, action: { label: "Open CAPA", tab: "actions" } });
    }
  }

  for (const id of scope) {
    for (const r of (s.registersByCentre[id] ?? []).filter((r) => r.status !== "in_order")) {
      items.push({ id: `q-r-${id}-${r.name}`, urgency: r.status === "not_reviewed" ? 1 : 0, what: `Review register — ${r.name}`, detail: `${centreName(id)} · ${r.note ?? "needs attention"}`, centreId: id, action: { label: "Open registers", route: `/centres/${id}` } });
    }
    for (const r of (s.fireByCentre[id] ?? []).filter((r) => fireCurrencyFor(r).state === "overdue")) {
      items.push({ id: `q-fire-${id}-${r.shortName}`, urgency: 0, what: `Log fire check — ${r.shortName}`, detail: `${centreName(id)} · required every ${r.frequencyDays} days`, centreId: id, action: { label: "Open fire registers", route: `/centres/${id}` } });
    }
    for (const n of (s.noticesByCentre[id] ?? []).filter((n) => !n.compliant)) {
      items.push({ id: `q-n-${id}-${n.name}`, urgency: 1, what: `Display mandatory notice — ${n.name}`, detail: `${centreName(id)} · IPPS §2.2 checklist`, centreId: id, action: { label: "Open notices", route: `/centres/${id}` } });
    }
  }

  for (const r of s.risks.filter((r) => r.status !== "closed" && (centreFilter === "all" || r.centreId === centreFilter || r.centreId === null))) {
    if (r.reviewOn && r.reviewOn < today) {
      items.push({ id: `q-risk-${r.id}`, urgency: riskBand(riskScore(r.likelihood, r.impact)) === "extreme" ? 0 : 1, what: `Review risk — ${r.title}`, detail: `${r.centreId ? centreName(r.centreId) : "Group"} · review was due ${r.reviewOn}`, centreId: r.centreId, action: { label: "Open risk register", tab: "risk" } });
    }
  }

  for (const q of s.qips.filter((q) => q.status !== "closed" && (centreFilter === "all" || q.centreId === centreFilter || q.centreId === null))) {
    if (q.targetOn && q.targetOn < today) {
      items.push({ id: `q-qip-${q.id}`, urgency: 1, what: `Update QIP past target — ${q.title}`, detail: `${q.centreId ? centreName(q.centreId) : "Group"} · target ${q.targetOn} · ${qipProgress(q)}% complete`, centreId: q.centreId, action: { label: "Open QIP register", tab: "qip" } });
    }
  }

  for (const sch of s.schedules.filter((x) => scope.includes(x.centreId) && x.status === "scheduled")) {
    const [y, m, d] = sch.dueOn.split("-").map(Number);
    const [ty, tm, td] = today.split("-").map(Number);
    const diff = Math.round((new Date(y, m - 1, d).getTime() - new Date(ty, tm - 1, td).getTime()) / 86400000);
    const type = s.auditTypes.find((t) => t.id === sch.auditTypeId);
    if (diff < 0) {
      items.push({ id: `q-sch-${sch.id}`, urgency: 0, what: `Conduct missed audit — ${type?.name ?? sch.auditTypeId}`, detail: `${centreName(sch.centreId)} · was due ${sch.dueOn} · ${sch.assignedTo}`, centreId: sch.centreId, action: { label: "Conduct now", tab: "scheduling" } });
    } else if (diff <= 7) {
      items.push({ id: `q-sch-${sch.id}`, urgency: 1, what: `Audit due in ${diff}d — ${type?.name ?? sch.auditTypeId}`, detail: `${centreName(sch.centreId)} · due ${sch.dueOn} · ${sch.assignedTo}`, centreId: sch.centreId, action: { label: "Open scheduling", tab: "scheduling" } });
    }
  }

  items.sort((a, b) => a.urgency - b.urgency);
  const manager = centreFilter === "all" ? null : s.centres.find((c) => c.id === centreFilter)?.manager;

  const URGENCY_META = [
    { label: "Overdue", color: rag.red, bg: rag.redBg },
    { label: "Due soon", color: rag.amber, bg: rag.amberBg },
    { label: "Routine", color: rag.neutral, bg: rag.neutralBg },
  ];

  return (
    <Box>
      <Typography sx={{ fontSize: "0.85rem", color: "text.secondary", mb: 1.5 }}>
        {manager
          ? `${manager}'s work queue — everything ${centreName(centreFilter)} should act on, derived live from its registers.`
          : "The group work queue — every open action across the eight centres, derived live from the registers."}
      </Typography>

      {items.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <TaskAltIcon sx={{ fontSize: 36, color: rag.green, mb: 1 }} />
          <Typography sx={{ fontWeight: 700 }}>Queue clear</Typography>
          <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>Nothing needs action right now.</Typography>
        </Paper>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {items.map((item) => {
            const meta = URGENCY_META[item.urgency];
            return (
              <Paper key={item.id} sx={{ p: 1.5, display: "flex", alignItems: "center", gap: 1.5, borderLeft: `4px solid ${meta.color}` }}>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography sx={{ fontSize: "0.85rem", fontWeight: 700 }}>{item.what}</Typography>
                  <Typography sx={{ fontSize: "0.74rem", color: "text.secondary" }}>{item.detail}</Typography>
                </Box>
                <Chip label={meta.label} size="small" sx={{ height: 20, fontSize: "0.64rem", fontWeight: 700, backgroundColor: meta.bg, color: meta.color, flexShrink: 0 }} />
                <Button
                  size="small"
                  variant="outlined"
                  sx={{ flexShrink: 0 }}
                  onClick={() => (item.action.route ? navigate(item.action.route) : item.action.tab && onOpenTab(item.action.tab))}
                >
                  {item.action.label}
                </Button>
              </Paper>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

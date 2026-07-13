import { AppState, isOverdue } from "./store";
import { ComplianceAlert, fireCurrencyFor, policyStatusFor, qipProgress, riskBand, riskScore } from "./types";

// Alerts are computed live from the registers on every read — they are a
// view over the data, never a stored copy, so they can't drift out of date.
// Ids are deterministic (`rule:entityId`) so read-state survives reloads.

const AUDIT_CYCLE_DAYS = 90;

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysBetween(fromIso: string, toIso: string): number {
  const [fy, fm, fd] = fromIso.split("-").map(Number);
  const [ty, tm, td] = toIso.split("-").map(Number);
  return Math.round((new Date(ty, tm - 1, td).getTime() - new Date(fy, fm - 1, fd).getTime()) / 86400000);
}

export function computeAlerts(s: AppState): ComplianceAlert[] {
  const enabled = new Set(s.alertRules.filter((r) => r.enabled).map((r) => r.key));
  const alerts: ComplianceAlert[] = [];
  const today = todayIso();
  const centreName = (id: string) => s.centres.find((c) => c.id === id)?.shortName ?? id;

  if (enabled.has("red_finding")) {
    for (const f of s.findings.filter((f) => f.status !== "closed" && f.priority === "RED")) {
      alerts.push({
        id: `red_finding:${f.id}`,
        ruleKey: "red_finding",
        severity: "critical",
        title: `RED finding open — ${f.finding}`,
        body: `${centreName(f.centreId)} · raised ${f.raisedOn}${f.dueOn ? ` · evidence due ${f.dueOn}` : ""}`,
        centreId: f.centreId,
        tab: "findings",
      });
    }
  }

  if (enabled.has("action_overdue")) {
    for (const f of s.findings.filter(isOverdue)) {
      alerts.push({
        id: `action_overdue:${f.id}`,
        ruleKey: "action_overdue",
        severity: "critical",
        title: `Evidence overdue — ${f.finding}`,
        body: `${centreName(f.centreId)} · 14-day clock ran out ${f.dueOn} · ${-daysBetween(today, f.dueOn ?? today)} days over`,
        centreId: f.centreId,
        tab: "actions",
      });
    }
  }

  if (enabled.has("extreme_risk")) {
    for (const r of s.risks.filter((r) => r.status !== "closed" && riskBand(riskScore(r.likelihood, r.impact)) === "extreme")) {
      alerts.push({
        id: `extreme_risk:${r.id}`,
        ruleKey: "extreme_risk",
        severity: "critical",
        title: `Extreme risk — ${r.title}`,
        body: `${r.centreId ? centreName(r.centreId) : "Group"} · score ${riskScore(r.likelihood, r.impact)} · owner ${r.owner}`,
        centreId: r.centreId,
        tab: "risk",
      });
    }
  }

  if (enabled.has("schedule_missed")) {
    for (const sch of s.schedules.filter((x) => x.status === "scheduled" && x.dueOn < today)) {
      const type = s.auditTypes.find((t) => t.id === sch.auditTypeId);
      alerts.push({
        id: `schedule_missed:${sch.id}`,
        ruleKey: "schedule_missed",
        severity: "warning",
        title: `Scheduled audit missed — ${type?.name ?? sch.auditTypeId}`,
        body: `${centreName(sch.centreId)} · was due ${sch.dueOn} · assigned to ${sch.assignedTo}`,
        centreId: sch.centreId,
        tab: "scheduling",
      });
    }
  }

  if (enabled.has("audit_overdue")) {
    for (const c of s.centres) {
      const last = (s.documentsByCentre[c.id] ?? [])
        .filter((d) => d.kind === "internal")
        .reduce<string | null>((acc, d) => (acc && acc > d.uploadedOn ? acc : d.uploadedOn), null);
      const age = last ? daysBetween(last, today) : null;
      if (age === null || age > AUDIT_CYCLE_DAYS) {
        alerts.push({
          id: `audit_overdue:${c.id}`,
          ruleKey: "audit_overdue",
          severity: "warning",
          title: `Internal audit overdue — ${c.shortName}`,
          body: age === null ? "No internal audit on record" : `Last self-audit ${age} days ago (90-day cycle)`,
          centreId: c.id,
          tab: "conduct",
        });
      }
    }
  }

  if (enabled.has("fire_register_overdue")) {
    for (const c of s.centres) {
      const overdue = (s.fireByCentre[c.id] ?? []).filter((r) => fireCurrencyFor(r).state === "overdue");
      for (const r of overdue) {
        alerts.push({
          id: `fire_register_overdue:${c.id}:${r.shortName}`,
          ruleKey: "fire_register_overdue",
          severity: "warning",
          title: `Fire register overdue — ${r.shortName}`,
          body: `${c.shortName} · required every ${r.frequencyDays} days`,
          centreId: c.id,
          tab: null,
        });
      }
    }
  }

  if (enabled.has("risk_review_overdue")) {
    for (const r of s.risks.filter((r) => r.status !== "closed" && r.reviewOn && r.reviewOn < today)) {
      alerts.push({
        id: `risk_review_overdue:${r.id}`,
        ruleKey: "risk_review_overdue",
        severity: "warning",
        title: `Risk review overdue — ${r.title}`,
        body: `${r.centreId ? centreName(r.centreId) : "Group"} · review was due ${r.reviewOn}`,
        centreId: r.centreId,
        tab: "risk",
      });
    }
  }

  if (enabled.has("policy_review_overdue")) {
    for (const p of s.policies.filter((p) => policyStatusFor(p, today) === "overdue")) {
      alerts.push({
        id: `policy_review_overdue:${p.id}`,
        ruleKey: "policy_review_overdue",
        severity: "warning",
        title: `Policy review overdue — ${p.name}`,
        body: `Review was due ${p.nextReviewDue} · owner ${p.owner}`,
        centreId: null,
        tab: "policies",
      });
    }
  }

  if (enabled.has("qip_target_overdue")) {
    for (const q of s.qips.filter((q) => q.status !== "closed" && q.targetOn && q.targetOn < today)) {
      alerts.push({
        id: `qip_target_overdue:${q.id}`,
        ruleKey: "qip_target_overdue",
        severity: "warning",
        title: `QIP target overdue — ${q.title}`,
        body: `${q.centreId ? centreName(q.centreId) : "Group"} · target was ${q.targetOn} · ${qipProgress(q)}% complete`,
        centreId: q.centreId,
        tab: "qip",
      });
    }
  }

  if (enabled.has("audit_due_soon")) {
    for (const sch of s.schedules.filter((x) => x.status === "scheduled" && x.dueOn >= today)) {
      const days = daysBetween(today, sch.dueOn);
      if (days <= 14) {
        const type = s.auditTypes.find((t) => t.id === sch.auditTypeId);
        alerts.push({
          id: `audit_due_soon:${sch.id}`,
          ruleKey: "audit_due_soon",
          severity: "info",
          title: `Audit due in ${days} day${days === 1 ? "" : "s"} — ${type?.name ?? sch.auditTypeId}`,
          body: `${centreName(sch.centreId)} · due ${sch.dueOn} · assigned to ${sch.assignedTo}`,
          centreId: sch.centreId,
          tab: "scheduling",
        });
      }
    }
  }

  const rank: Record<ComplianceAlert["severity"], number> = { critical: 0, warning: 1, info: 2 };
  return alerts.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

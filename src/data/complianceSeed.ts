import { getProfile } from "./profile";
import { buildCentres, isoDaysFromToday, mulberry } from "./seed";
import {
  AlertRule,
  AuditRecord,
  AuditSchedule,
  AuditType,
  Meeting,
  Policy,
} from "./types";

// ── Audit types (configuration-as-data, like the KPI registry) ──────────
// IPAS-native audit programme: each type carries its dual-axis reference
// (IPPS report section · HIQA National Standard) and a published checklist.
// Critical items auto-raise a finding when marked not compliant in Conduct.
const AUDIT_TYPE_SPECS: Omit<AuditType, "checklist" | "checklistVersion">[] = [
  {
    id: "ipps-self",
    name: "IPPS self-inspection (full centre)",
    description: "Full walk-through mirroring the Department's IPPS inspection structure — registers, notices, rooms and fire provisions.",
    category: "Department returns",
    sourceStandard: "IPPS §1–6 · HIQA 1.2",
    targetPct: 90,
    active: true,
  },
  {
    id: "fire-safety",
    name: "Fire safety audit",
    description: "Fire registers, drills, means of escape and detection systems, aligned to the Mackin EHS programme.",
    category: "Fire safety",
    sourceStandard: "IPPS §2.3 · HIQA 3.1",
    targetPct: 95,
    active: true,
  },
  {
    id: "food-safety",
    name: "Food safety & HACCP audit",
    description: "Kitchen cleaning records, food storage, temperatures and dining provision.",
    category: "Food & catering",
    sourceStandard: "IPPS §2.6 · HIQA 5.1",
    targetPct: 90,
    active: true,
  },
  {
    id: "safeguarding",
    name: "Safeguarding & child protection audit",
    description: "DLP arrangements, visitor declarations, vetting currency and Children First training.",
    category: "Safeguarding",
    sourceStandard: "IPPS §1.2 · HIQA 8.2",
    targetPct: 95,
    active: true,
  },
  {
    id: "accommodation",
    name: "Accommodation & room standards audit",
    description: "Room register accuracy against the 4.65 m² space standard, fabric condition and prohibited items.",
    category: "Accommodation",
    sourceStandard: "IPPS §3 · HIQA 4.2",
    targetPct: 85,
    active: true,
  },
  {
    id: "wellbeing",
    name: "Resident comfort & wellbeing audit",
    description: "Comfort items, toiletries, transport timetable and resident information provision.",
    category: "Resident services",
    sourceStandard: "IPPS §1.5 · HIQA 4.9",
    targetPct: 85,
    active: true,
  },
  {
    id: "ehs-walk",
    name: "Health & safety walk (Mackin EHS)",
    description: "General EHS walk-through against the safety statement and emergency response plan.",
    category: "Health & safety",
    sourceStandard: "Safety statement · HIQA 3.2",
    targetPct: 90,
    active: true,
  },
];

const CHECKLISTS: Record<string, { text: string; critical: boolean }[]> = {
  "ipps-self": [
    { text: "Resident register current and reconciled with occupancy on day", critical: true },
    { text: "All seven administration registers available and in order", critical: true },
    { text: "Mandatory public notices displayed (§2.2 checklist)", critical: false },
    { text: "Room register reflects actual bed configuration and occupancy", critical: true },
    { text: "No room exceeds its suitable occupancy at 4.65 m² per person", critical: true },
    { text: "Fire registers current within their required frequencies", critical: true },
    { text: "Complaints log up to date with outcomes recorded", critical: false },
    { text: "Staff list with roles and duties current, DLP list displayed", critical: false },
  ],
  "fire-safety": [
    { text: "Fire alarm panel checked within the last 7 days", critical: true },
    { text: "Emergency lighting service record current (30 days)", critical: true },
    { text: "Fire exits and escape routes unobstructed and openable", critical: true },
    { text: "Firefighting equipment serviced and in place", critical: true },
    { text: "Fire drill carried out within the last quarter and logged", critical: true },
    { text: "Staff fire safety training records current", critical: false },
    { text: "Emergency response plan displayed and current", critical: false },
  ],
  "food-safety": [
    { text: "Kitchen daily cleaning record complete for the past 7 days", critical: true },
    { text: "Periodic deep-clean record current (behind cookers/fridges)", critical: true },
    { text: "Fridge/freezer temperature logs complete and in range", critical: true },
    { text: "Food storage segregated, labelled and in date", critical: false },
    { text: "Dining area clean and provision matches resident profile", critical: false },
    { text: "Staff food-handling training current", critical: false },
  ],
  safeguarding: [
    { text: "DLP details displayed and DLP contactable on duty", critical: true },
    { text: "Visitor sign-in book includes CSS declaration (Appendix 2)", critical: true },
    { text: "Garda vetting current for all staff and contractors", critical: true },
    { text: "Children First training records current", critical: false },
    { text: "Parental supervision notice displayed", critical: false },
    { text: "Child-protection concerns log reviewed and escalated correctly", critical: true },
  ],
  accommodation: [
    { text: "Room register dimensions verified for any changed rooms", critical: true },
    { text: "No prohibited electrical items (fridges/kettles/leads) in rooms", critical: false },
    { text: "No mould or damp in bathrooms and bedrooms", critical: true },
    { text: "Window restrictors fitted and functional", critical: true },
    { text: "Maintenance issues log current with close-out dates", critical: false },
    { text: "Communal areas clean and fixtures serviceable", critical: false },
  ],
  wellbeing: [
    { text: "Toiletries and comfort items provided free of charge", critical: true },
    { text: "Transport service & timetable displayed and operating", critical: false },
    { text: "IPAS contact details and complaint forms available", critical: false },
    { text: "Resident notice board current (activities, supports)", critical: false },
    { text: "Laundry provision available per house rules", critical: false },
  ],
  "ehs-walk": [
    { text: "Safety statement on site and reviewed within 12 months", critical: true },
    { text: "Emergency response plan current and staff briefed", critical: true },
    { text: "First-aid provision stocked and in date", critical: false },
    { text: "Slips/trips walkway inspection clear", critical: false },
    { text: "Chemical storage (COSHH) secure and inventoried", critical: false },
    { text: "Accident/incident book entries followed up", critical: false },
  ],
};

export function buildAuditTypes(): AuditType[] {
  return AUDIT_TYPE_SPECS.map((spec) => ({
    ...spec,
    checklistVersion: 1,
    checklist: (CHECKLISTS[spec.id] ?? []).map((c, i) => ({ id: `${spec.id}-q${i + 1}`, text: c.text, critical: c.critical })),
  }));
}

// ── Conducted-audit history ──────────────────────────────────────────────
// A year of internal audit scores per centre so the Dashboard trend and
// per-type compliance table read as an established programme. Summary rows
// only (no item-level responses) — audits conducted in-app carry those.
export function buildAuditRecords(): AuditRecord[] {
  const c = getProfile().compliance / 100;
  const records: AuditRecord[] = [];
  const centres = buildCentres();
  for (const centre of centres) {
    const rand = mulberry(`audit-history-${centre.id}-${Math.round(c * 100)}`);
    // Quarterly IPPS self-inspections across the past year…
    for (let q = 0; q < 4; q++) {
      const daysAgo = 20 + q * 91 + Math.round(rand() * 12);
      // older audits score slightly lower — the programme is maturing
      const base = 62 + c * 30 - q * 2.5;
      const pct = Math.min(100, Math.max(50, Math.round(base + (rand() - 0.5) * 10)));
      records.push({
        id: `ar-${centre.id}-ipps-${q}`,
        centreId: centre.id,
        auditTypeId: "ipps-self",
        auditName: "IPPS self-inspection (full centre)",
        conductedOn: isoDaysFromToday(-daysAgo),
        conductedBy: q % 2 === 0 ? centre.manager : "Senior management (group)",
        compliancePct: pct,
        targetPct: 90,
        responses: [],
        findingsRaised: pct >= 90 ? 0 : pct >= 75 ? 1 + Math.round(rand()) : 2 + Math.round(rand() * 2),
        scheduleId: null,
      });
    }
    // …plus recent fire and food audits.
    for (const [typeId, name, target, offset] of [
      ["fire-safety", "Fire safety audit", 95, 10],
      ["food-safety", "Food safety & HACCP audit", 90, 35],
    ] as const) {
      const pct = Math.min(100, Math.max(55, Math.round(68 + c * 28 + (rand() - 0.5) * 12)));
      records.push({
        id: `ar-${centre.id}-${typeId}`,
        centreId: centre.id,
        auditTypeId: typeId,
        auditName: name,
        conductedOn: isoDaysFromToday(-(offset + Math.round(rand() * 15))),
        conductedBy: centre.manager,
        compliancePct: pct,
        targetPct: target,
        responses: [],
        findingsRaised: pct >= target ? 0 : 1 + Math.round(rand()),
        scheduleId: null,
      });
    }
  }
  return records;
}

// ── Audit schedules ──────────────────────────────────────────────────────
export function buildSchedules(): AuditSchedule[] {
  const c = getProfile().compliance / 100;
  const schedules: AuditSchedule[] = [];
  const centres = buildCentres();
  centres.forEach((centre, idx) => {
    const rand = mulberry(`schedule-${centre.id}-${Math.round(c * 100)}`);
    // Next quarterly IPPS self-inspection, staggered across the group.
    schedules.push({
      id: `sch-${centre.id}-ipps`,
      centreId: centre.id,
      auditTypeId: "ipps-self",
      dueOn: isoDaysFromToday(7 + idx * 9 + Math.round(rand() * 5)),
      assignedTo: centre.manager,
      priority: "high",
      recurrence: "quarterly",
      status: "scheduled",
      notes: null,
    });
    // Monthly fire safety audit — under pressure some slip past due.
    const fireOffset = rand() < (1 - c) * 0.5 ? -Math.round(2 + rand() * 6) : Math.round(3 + rand() * 24);
    schedules.push({
      id: `sch-${centre.id}-fire`,
      centreId: centre.id,
      auditTypeId: "fire-safety",
      dueOn: isoDaysFromToday(fireOffset),
      assignedTo: centre.manager,
      priority: fireOffset < 0 ? "high" : "medium",
      recurrence: "monthly",
      status: "scheduled",
      notes: fireOffset < 0 ? "Carried over from last cycle" : null,
    });
    // A completed schedule in the recent past keeps the table honest.
    schedules.push({
      id: `sch-${centre.id}-done`,
      centreId: centre.id,
      auditTypeId: idx % 2 === 0 ? "food-safety" : "safeguarding",
      dueOn: isoDaysFromToday(-Math.round(10 + rand() * 20)),
      assignedTo: centre.manager,
      priority: "medium",
      recurrence: "quarterly",
      status: "completed",
      notes: null,
    });
  });
  // Group-level EHS walks at three centres, led by the Mackin programme.
  ["riverside", "ballaghaderreen", "mulroy"].forEach((id, i) => {
    schedules.push({
      id: `sch-${id}-ehs`,
      centreId: id,
      auditTypeId: "ehs-walk",
      dueOn: isoDaysFromToday(12 + i * 11),
      assignedTo: "Maeve (EHS lead)",
      priority: "medium",
      recurrence: "quarterly",
      status: "scheduled",
      notes: "Mackin EHS programme",
    });
  });
  return schedules;
}

// ── Governance meetings ──────────────────────────────────────────────────
export function buildMeetings(): Meeting[] {
  const meetings: Meeting[] = [];
  const centres = buildCentres();
  const rand = mulberry("meetings");
  // Group governance — monthly, last three occurrences.
  for (let i = 0; i < 3; i++) {
    const heldOn = isoDaysFromToday(-(12 + i * 30));
    meetings.push({
      id: `mtg-gov-${i}`,
      centreId: null,
      title: "Group governance & compliance meeting",
      type: "governance",
      heldOn,
      chair: "Group Executive",
      attendees: 9 + Math.round(rand() * 3),
      quorum: true,
      minutesRef: `GOV-${heldOn}`,
      actionsTotal: 5 + Math.round(rand() * 3),
      actionsDone: 4 + Math.round(rand() * 2),
      nextOn: i === 0 ? isoDaysFromToday(18) : null,
    });
  }
  meetings.push({
    id: "mtg-safeguarding",
    centreId: null,
    title: "Quarterly safeguarding review",
    type: "safeguarding",
    heldOn: isoDaysFromToday(-34),
    chair: "Designated Officer",
    attendees: 7,
    quorum: true,
    minutesRef: `SG-${isoDaysFromToday(-34)}`,
    actionsTotal: 4,
    actionsDone: 3,
    nextOn: isoDaysFromToday(56),
  });
  meetings.push({
    id: "mtg-fire",
    centreId: null,
    title: "Fire safety programme review (Mackin EHS)",
    type: "fire_safety",
    heldOn: isoDaysFromToday(-21),
    chair: "Maeve (EHS lead)",
    attendees: 10,
    quorum: true,
    minutesRef: `FS-${isoDaysFromToday(-21)}`,
    actionsTotal: 6,
    actionsDone: 4,
    nextOn: isoDaysFromToday(69),
  });
  // Centre management meetings — most recent per centre.
  centres.forEach((centre, i) => {
    const r = mulberry(`mtg-${centre.id}`);
    const heldOn = isoDaysFromToday(-Math.round(3 + r() * 26));
    const total = 3 + Math.round(r() * 4);
    meetings.push({
      id: `mtg-mgmt-${centre.id}`,
      centreId: centre.id,
      title: `${centre.shortName} management meeting`,
      type: "management",
      heldOn,
      chair: centre.manager,
      attendees: 4 + Math.round(r() * 3),
      quorum: r() > 0.08,
      minutesRef: `MM-${centre.id.toUpperCase()}-${heldOn}`,
      actionsTotal: total,
      actionsDone: Math.min(total, Math.round(total * (0.5 + r() * 0.5))),
      nextOn: i < 3 ? isoDaysFromToday(Math.round(5 + r() * 20)) : null,
    });
  });
  // Resident forums at the three family-profile centres.
  ["riverside", "blackrock", "ballaghaderreen"].forEach((id, i) => {
    const centre = centres.find((c) => c.id === id);
    meetings.push({
      id: `mtg-forum-${id}`,
      centreId: id,
      title: `${centre?.shortName ?? id} resident forum`,
      type: "resident_forum",
      heldOn: isoDaysFromToday(-(8 + i * 7)),
      chair: centre?.manager ?? "Centre manager",
      attendees: 12 + i * 4,
      quorum: true,
      minutesRef: null,
      actionsTotal: 3,
      actionsDone: 2,
      nextOn: isoDaysFromToday(22 + i * 7),
    });
  });
  return meetings;
}

// ── Policy register ──────────────────────────────────────────────────────
// The uniform group policy suite (client email, 11 Jul 2026) — one set of
// policies applied across all eight centres, on an annual review cycle.
const POLICY_SPECS: { name: string; category: string; owner: string }[] = [
  { name: "Safeguarding & child protection (Children First)", category: "Safeguarding", owner: "Designated Officer" },
  { name: "Adult safeguarding & vulnerable persons", category: "Safeguarding", owner: "Designated Officer" },
  { name: "Fire safety management", category: "Fire & safety", owner: "Maeve (EHS lead)" },
  { name: "Health & safety statement (Mackin EHS)", category: "Fire & safety", owner: "Maeve (EHS lead)" },
  { name: "Critical incident management", category: "Fire & safety", owner: "Group Operations" },
  { name: "Complaints & feedback", category: "Operations", owner: "Group Operations" },
  { name: "Admissions, transfers & discharges", category: "Operations", owner: "Group Operations" },
  { name: "Food safety & HACCP", category: "Operations", owner: "Group Operations" },
  { name: "Visitor & centre access", category: "Operations", owner: "Group Operations" },
  { name: "Staff recruitment, vetting & induction", category: "HR", owner: "Head office (HR)" },
  { name: "Data protection & resident records (GDPR)", category: "Governance", owner: "Group Executive" },
  { name: "Anti-trafficking awareness & referral", category: "Safeguarding", owner: "Designated Officer" },
];

export function buildPolicies(): Policy[] {
  const c = getProfile().compliance / 100;
  const rand = mulberry(`policies-${Math.round(c * 100)}`);
  // A pressured scenario lets more of the suite drift towards review.
  const overdueCount = Math.round((1 - c) * 3);
  return POLICY_SPECS.map((spec, i) => {
    const overdue = i < overdueCount;
    const dueSoon = !overdue && i >= POLICY_SPECS.length - 2;
    const daysAgo = overdue
      ? 365 + Math.round(5 + rand() * 40)
      : dueSoon
        ? 365 - Math.round(20 + rand() * 40)
        : Math.round(30 + rand() * 240);
    const lastReviewed = isoDaysFromToday(-daysAgo);
    return {
      id: `pol-${i + 1}`,
      name: spec.name,
      category: spec.category,
      owner: spec.owner,
      version: `v${1 + Math.round(rand() * 3)}.${Math.round(rand() * 4)}`,
      reviewCycleDays: 365,
      lastReviewed,
      nextReviewDue: isoDaysFromToday(365 - daysAgo),
      docRef: `POL-${String(i + 1).padStart(3, "0")}`,
    };
  });
}

// ── Alert rules (Compliance → Settings) ─────────────────────────────────
export const DEFAULT_ALERT_RULES: AlertRule[] = [
  { key: "red_finding", label: "RED finding open", description: "A RED-priority finding is open anywhere in the group.", severity: "critical", enabled: true },
  { key: "action_overdue", label: "Action overdue", description: "An open finding has run past its 14-day evidence clock.", severity: "critical", enabled: true },
  { key: "extreme_risk", label: "Extreme risk open", description: "An open risk scores in the extreme band (15+).", severity: "critical", enabled: true },
  { key: "schedule_missed", label: "Scheduled audit missed", description: "A scheduled audit is past its due date and not completed.", severity: "warning", enabled: true },
  { key: "audit_overdue", label: "Internal audit overdue", description: "A centre has gone more than 90 days without an internal audit.", severity: "warning", enabled: true },
  { key: "fire_register_overdue", label: "Fire register overdue", description: "A fire register has lapsed past its required check frequency.", severity: "warning", enabled: true },
  { key: "risk_review_overdue", label: "Risk review overdue", description: "An open risk is past its next scheduled review date.", severity: "warning", enabled: true },
  { key: "policy_review_overdue", label: "Policy review overdue", description: "A policy in the group suite is past its review date.", severity: "warning", enabled: true },
  { key: "qip_target_overdue", label: "QIP target overdue", description: "An open quality improvement plan is past its target date.", severity: "warning", enabled: true },
  { key: "audit_due_soon", label: "Audit due within 14 days", description: "A scheduled audit falls due in the next fortnight.", severity: "info", enabled: true },
];

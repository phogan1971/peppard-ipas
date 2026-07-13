import { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import LinearProgress from "@mui/material/LinearProgress";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { submitAudit, useAppState } from "../../data/store";
import { AuditAnswer, AuditResponse, AuditSchedule, auditCompliancePct } from "../../data/types";
import { rag } from "../../theme/tokens";
import { useSurfaces } from "../../theme";

const STEPS = ["Select audit", "Conduct checklist", "Review & submit"];

interface Props {
  centreFilter: string;
  // Set when "Conduct" was clicked on a scheduled audit — prefills step 1.
  prefill: AuditSchedule | null;
  onDone: (tab: string) => void;
}

export default function ConductAudit({ centreFilter, prefill, onDone }: Props) {
  const surf = useSurfaces();
  const { auditTypes, centres } = useAppState();
  const activeTypes = auditTypes.filter((t) => t.active && t.checklist.length > 0);

  const [step, setStep] = useState(0);
  const [centreId, setCentreId] = useState(centreFilter !== "all" ? centreFilter : centres[0]?.id ?? "riverside");
  const [typeId, setTypeId] = useState(activeTypes[0]?.id ?? "");
  const [scheduleId, setScheduleId] = useState<string | null>(null);
  const [conductedBy, setConductedBy] = useState("");
  const [answers, setAnswers] = useState<Record<string, { answer: AuditAnswer | null; note: string }>>({});
  const [toast, setToast] = useState<string | null>(null);

  // A "Conduct" click on the Scheduling tab lands here with the schedule.
  useEffect(() => {
    if (prefill) {
      setCentreId(prefill.centreId);
      setTypeId(prefill.auditTypeId);
      setScheduleId(prefill.id);
      setStep(0);
      setAnswers({});
    }
  }, [prefill]);

  const type = auditTypes.find((t) => t.id === typeId);
  const centre = centres.find((c) => c.id === centreId);

  const responses: AuditResponse[] = useMemo(
    () =>
      (type?.checklist ?? []).map((item) => ({
        itemId: item.id,
        text: item.text,
        critical: item.critical,
        answer: answers[item.id]?.answer ?? "na",
        note: answers[item.id]?.note?.trim() || null,
      })),
    [type, answers],
  );
  const answeredCount = (type?.checklist ?? []).filter((i) => answers[i.id]?.answer).length;
  const allAnswered = type ? answeredCount === type.checklist.length : false;
  const livePct = auditCompliancePct(responses.filter((r) => answers[r.itemId]?.answer));
  const criticalFails = responses.filter((r) => r.answer === "not_compliant" && r.critical);
  const fails = responses.filter((r) => r.answer === "not_compliant");

  const start = () => {
    setAnswers({});
    setConductedBy(centre?.manager ?? "");
    setStep(1);
  };
  const submit = () => {
    if (!type) return;
    const result = submitAudit({
      centreId,
      auditTypeId: typeId,
      conductedBy: conductedBy.trim() || centre?.manager || "Centre manager",
      responses,
      scheduleId,
    });
    setToast(
      `${type.name} filed at ${result.compliancePct}% compliance` +
        (result.findingsRaised > 0
          ? ` — ${result.findingsRaised} finding${result.findingsRaised === 1 ? "" : "s"} raised on the 14-day clock. Registers, cockpit and KPIs updated.`
          : ". Registers, cockpit and KPIs updated."),
    );
    setStep(0);
    setScheduleId(null);
    setAnswers({});
  };

  const setAnswer = (itemId: string, answer: AuditAnswer) =>
    setAnswers((a) => ({ ...a, [itemId]: { answer, note: a[itemId]?.note ?? "" } }));
  const setNote = (itemId: string, note: string) =>
    setAnswers((a) => ({ ...a, [itemId]: { answer: a[itemId]?.answer ?? null, note } }));

  const pctColor = livePct >= (type?.targetPct ?? 90) ? rag.green : livePct >= (type?.targetPct ?? 90) - 10 ? rag.amber : rag.red;

  return (
    <Box>
      <Stepper activeStep={step} sx={{ mb: 3, maxWidth: 640 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {step === 0 && (
        <Paper sx={{ p: 3, maxWidth: 640 }}>
          <Typography sx={{ fontWeight: 700, mb: 0.5 }}>Carry out an internal audit</Typography>
          <Typography sx={{ fontSize: "0.82rem", color: "text.secondary", mb: 2 }}>
            The facility drives its own governance — an external inspection should find nothing the dashboard hasn't
            already. Pick the facility and audit type; the published checklist runs next.
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField select label="Facility" value={centreId} onChange={(e) => setCentreId(e.target.value)} size="small" fullWidth>
              {centres.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.shortName}</MenuItem>
              ))}
            </TextField>
            <TextField select label="Audit type" value={typeId} onChange={(e) => { setTypeId(e.target.value); setScheduleId(null); }} size="small" fullWidth>
              {activeTypes.map((t) => (
                <MenuItem key={t.id} value={t.id}>{t.name} — {t.checklist.length} items (v{t.checklistVersion})</MenuItem>
              ))}
            </TextField>
            {scheduleId && (
              <Chip label="Linked to a scheduled audit — submitting completes the schedule" size="small" sx={{ alignSelf: "flex-start", height: 22, fontSize: "0.68rem", fontWeight: 700, backgroundColor: rag.greenBg, color: rag.green }} />
            )}
            {type && (
              <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
                {type.description} · Target {type.targetPct}% · {type.sourceStandard}
              </Typography>
            )}
            <Button variant="contained" disableElevation onClick={start} disabled={!type} sx={{ alignSelf: "flex-start" }}>
              Start checklist
            </Button>
          </Box>
        </Paper>
      )}

      {step === 1 && type && (
        <Box>
          <Paper sx={{ p: 2, mb: 2, position: "sticky", top: 128, zIndex: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
              <Box>
                <Typography sx={{ fontWeight: 700 }}>{type.name} — {centre?.shortName}</Typography>
                <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
                  {answeredCount} of {type.checklist.length} answered
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 220 }}>
                <LinearProgress variant="determinate" value={(answeredCount / type.checklist.length) * 100} sx={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: "action.hover" }} />
                <Typography sx={{ fontSize: "0.9rem", fontWeight: 800, color: pctColor, whiteSpace: "nowrap" }}>
                  {answeredCount > 0 ? `${livePct}%` : "—"}
                </Typography>
              </Box>
            </Box>
          </Paper>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {type.checklist.map((item, idx) => {
              const a = answers[item.id];
              const showNote = a?.answer === "not_compliant";
              return (
                <Paper key={item.id} sx={{ p: 1.5 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                    <Box sx={{ minWidth: 240, flex: 1 }}>
                      <Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>
                        {idx + 1}. {item.text}
                        {item.critical && (
                          <Chip label="Critical" size="small" sx={{ ml: 0.75, height: 18, fontSize: "0.6rem", fontWeight: 700, backgroundColor: rag.redBg, color: rag.red }} />
                        )}
                      </Typography>
                    </Box>
                    <ToggleButtonGroup
                      size="small"
                      exclusive
                      value={a?.answer ?? null}
                      onChange={(_, v) => v && setAnswer(item.id, v)}
                      aria-label={`Answer for item ${idx + 1}`}
                    >
                      <ToggleButton value="compliant" sx={{ textTransform: "none", px: 1.25, "&.Mui-selected": { backgroundColor: rag.greenBg, color: rag.green, fontWeight: 700 } }}>
                        Compliant
                      </ToggleButton>
                      <ToggleButton value="not_compliant" sx={{ textTransform: "none", px: 1.25, "&.Mui-selected": { backgroundColor: rag.redBg, color: rag.red, fontWeight: 700 } }}>
                        Not compliant
                      </ToggleButton>
                      <ToggleButton value="na" sx={{ textTransform: "none", px: 1.25 }}>
                        N/A
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Box>
                  {showNote && (
                    <TextField
                      value={a?.note ?? ""}
                      onChange={(e) => setNote(item.id, e.target.value)}
                      size="small"
                      fullWidth
                      placeholder={item.critical ? "Describe the gap — this becomes the corrective action on the raised finding" : "Describe the gap (optional)"}
                      sx={{ mt: 1 }}
                    />
                  )}
                </Paper>
              );
            })}
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
            <Button onClick={() => setStep(0)}>Back</Button>
            <Button variant="contained" disableElevation onClick={() => setStep(2)} disabled={!allAnswered}>
              Review {allAnswered ? "" : `(${type.checklist.length - answeredCount} unanswered)`}
            </Button>
          </Box>
        </Box>
      )}

      {step === 2 && type && (
        <Paper sx={{ p: 3, maxWidth: 720 }}>
          <Typography sx={{ fontWeight: 700, mb: 2 }}>Review & submit — {type.name}, {centre?.shortName}</Typography>
          <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", mb: 2 }}>
            <Box>
              <Typography sx={{ fontSize: "2.2rem", fontWeight: 800, color: pctColor, lineHeight: 1 }}>{livePct}%</Typography>
              <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>compliance · target {type.targetPct}%</Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: "2.2rem", fontWeight: 800, color: fails.length > 0 ? rag.amber : rag.green, lineHeight: 1 }}>{fails.length}</Typography>
              <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>not compliant</Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: "2.2rem", fontWeight: 800, color: criticalFails.length > 0 ? rag.red : rag.green, lineHeight: 1 }}>{criticalFails.length}</Typography>
              <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>findings to raise (critical)</Typography>
            </Box>
          </Box>

          {criticalFails.length > 0 && (
            <Box sx={{ backgroundColor: surf.subtleBg, borderRadius: 1, p: 1.5, mb: 2 }}>
              <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, mb: 0.5 }}>
                Submitting raises {criticalFails.length} AMBER finding{criticalFails.length === 1 ? "" : "s"} on the 14-day evidence clock:
              </Typography>
              {criticalFails.map((f) => (
                <Typography key={f.itemId} sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
                  • {f.text}
                </Typography>
              ))}
            </Box>
          )}

          <TextField label="Conducted by" value={conductedBy} onChange={(e) => setConductedBy(e.target.value)} size="small" fullWidth sx={{ mb: 2 }} />

          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Button onClick={() => setStep(1)}>Back</Button>
            <Button variant="contained" disableElevation onClick={submit}>
              Submit audit
            </Button>
          </Box>
        </Paper>
      )}

      <Snackbar open={!!toast} autoHideDuration={6000} onClose={() => setToast(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert
          onClose={() => setToast(null)}
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
          action={
            <Button color="inherit" size="small" onClick={() => { setToast(null); onDone("results"); }}>
              View results
            </Button>
          }
        >
          {toast}
        </Alert>
      </Snackbar>
    </Box>
  );
}

import React, { useEffect, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Divider,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import type { SelectChangeEvent } from "@mui/material/Select";

import { usePageFeedback } from "../../../app/usePageFeedback";
import { useSession } from "../../../app/SessionContext";
import { PageHeader } from "../../../app/PageHeader";
import {
  bulkUploadProjections,
  createProjection,
  createRateRevision,
  listAssignments,
  listProjects,
  recomputeRevenue,
  validateYearMonth,
  type AssignmentRow,
  type BulkProjectionRow,
  type ProjectRow
} from "../../app/services/appApi";
import { cellNumber, cellString, downloadMatrix, parseFirstSheetRecords } from "../../../lib/xlsxBulk";

export function RevenuePage(): JSX.Element {
  const { session } = useSession();
  const { notifySuccess, notifyError, notifyRawError, FeedbackSnackbar } = usePageFeedback();

  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [projectId, setProjectId] = useState("");
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [assignmentId, setAssignmentId] = useState("");

  const [recomputeProjectId, setRecomputeProjectId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [recomputeMonth, setRecomputeMonth] = useState("");
  const [recomputeErrors, setRecomputeErrors] = useState<Partial<Record<string, string>>>({});

  const [effectiveDate, setEffectiveDate] = useState("");
  const [newRate, setNewRate] = useState("");
  const [rateErrors, setRateErrors] = useState<Partial<Record<string, string>>>({});

  const [projectionStart, setProjectionStart] = useState("");
  const [projectionEnd, setProjectionEnd] = useState("");
  const [projectionRate, setProjectionRate] = useState("");
  const [projectionErrors, setProjectionErrors] = useState<Partial<Record<string, string>>>({});

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const rows = await listProjects();
        if (!cancelled) {
          setProjects(rows);
        }
      } catch {
        // silent
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!projectId) {
      setAssignments([]);
      setAssignmentId("");
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const rows = await listAssignments(projectId);
        if (!cancelled) {
          setAssignments(rows);
          setAssignmentId("");
        }
      } catch {
        if (!cancelled) {
          setAssignments([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  function validateRecompute(): boolean {
    const next: Partial<Record<string, string>> = {};
    if (!recomputeProjectId.trim()) {
      next.recomputeProjectId = "Pick the project that owns this compute key.";
    }
    if (!employeeId.trim()) {
      next.employeeId = "Employee id ties the row to a person.";
    }
    if (!validateYearMonth(recomputeMonth)) {
      next.recomputeMonth = "Use YYYY-MM (example: 2026-04).";
    }
    setRecomputeErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleRecompute(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (!validateRecompute()) {
      return;
    }
    try {
      const result = await recomputeRevenue({
        employeeId: employeeId.trim(),
        projectId: recomputeProjectId.trim(),
        month: recomputeMonth.trim()
      });
      const keys = result.recomputedKeys.filter(Boolean);
      notifySuccess(keys.length ? `Updated ${keys.length} key${keys.length === 1 ? "" : "s"}.` : "Recompute ran—no keys changed.");
      setRecomputeErrors({});
    } catch (err) {
      notifyError(err);
    }
  }

  function validateRate(): boolean {
    if (!session) {
      notifyRawError("Your session could not be verified—refresh the page and sign in again.");
      return false;
    }
    const next: Partial<Record<string, string>> = {};
    if (!assignmentId) {
      next.assignmentId = "Pick an assignment above.";
    }
    if (!effectiveDate) {
      next.effectiveDate = "When does this rate take effect?";
    }
    const rate = Number(newRate);
    if (!Number.isFinite(rate) || rate <= 0) {
      next.newRate = "Enter a positive daily rate.";
    }
    setRateErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleRateRevision(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (!validateRate()) {
      return;
    }
    if (!session) {
      return;
    }
    const rate = Number(newRate);
    try {
      await createRateRevision(assignmentId, {
        effectiveDate,
        newRate: rate,
        authorizerId: session.userId
      });
      notifySuccess("Rate revision saved.");
      setNewRate("");
      setRateErrors({});
    } catch (err) {
      notifyError(err);
    }
  }

  function validateProjection(): boolean {
    const next: Partial<Record<string, string>> = {};
    if (!assignmentId) {
      next.assignmentId = "Choose an assignment for this projection.";
    }
    if (!projectionStart || !projectionEnd) {
      next.dates = "Start and end dates are both required.";
    } else if (projectionStart > projectionEnd) {
      next.dates = "End must be on or after start.";
    }
    const rate = Number(projectionRate);
    if (!Number.isFinite(rate) || rate <= 0) {
      next.projectionRate = "Projection rate must be positive.";
    }
    setProjectionErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleProjection(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (!validateProjection()) {
      return;
    }
    const rate = Number(projectionRate);
    try {
      await createProjection(assignmentId, {
        startDate: projectionStart,
        endDate: projectionEnd,
        projectionRate: rate
      });
      notifySuccess("Projection window created.");
      setProjectionRate("");
      setProjectionErrors({});
    } catch (err) {
      notifyError(err);
    }
  }

  function downloadProjectionTemplate(): void {
    downloadMatrix("projections-bulk-template.xlsx", "projections", [
      ["assignmentId", "startDate", "endDate", "projectionRate"],
      ["assignment-uuid-here", "2026-02-01", "2026-02-28", 950]
    ]);
  }

  async function handleBulkProjections(file: File | null): Promise<void> {
    if (!file) {
      notifyRawError("Choose a workbook before uploading.");
      return;
    }
    try {
      const records = await parseFirstSheetRecords(file);
      const rows: BulkProjectionRow[] = [];
      let skipped = 0;
      for (const record of records) {
        const aid = cellString(record.assignmentId);
        const start = cellString(record.startDate);
        const end = cellString(record.endDate);
        const rate = cellNumber(record.projectionRate);
        if (!aid || !start || !end || rate == null || rate <= 0) {
          skipped += 1;
          continue;
        }
        rows.push({ assignmentId: aid, startDate: start, endDate: end, projectionRate: rate });
      }
      if (rows.length === 0) {
        notifyRawError(
          skipped > 0
            ? `${skipped} incomplete row${skipped === 1 ? "" : "s"} skipped. Check assignmentId, dates, and rate columns.`
            : "No valid rows found."
        );
        return;
      }
      const result = await bulkUploadProjections(rows);
      notifySuccess(`Imported ${result.createdCount} projection${result.createdCount === 1 ? "" : "s"}.`);
    } catch (err) {
      notifyError(err);
    }
  }

  return (
    <>
      <Stack spacing={2}>
        <PageHeader
          eyebrow="Finance"
          title="Revenue"
          description="Recompute engine results from IDs you already use elsewhere—pick projects from the list instead of hunting UUIDs."
        />

        <Accordion defaultExpanded disableGutters elevation={0} sx={{ borderRadius: "16px !important", border: 1, borderColor: "divider", "&:before": { display: "none" } }}>
          <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
            <Box>
              <Typography sx={{ fontWeight: 600 }}>Recompute monthly facts</Typography>
              <Typography variant="caption" color="text.secondary">
                Refreshes derived totals for one employee × project × month.
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <Box component="form" onSubmit={handleRecompute} noValidate>
              <FormControl fullWidth sx={{ maxWidth: 480, mb: 2 }} error={Boolean(recomputeErrors.recomputeProjectId)}>
                <InputLabel id="rec-project-label">Project</InputLabel>
                <Select
                  labelId="rec-project-label"
                  label="Project"
                  value={recomputeProjectId}
                  onChange={(event: SelectChangeEvent<string>) => {
                    setRecomputeProjectId(event.target.value);
                    setRecomputeErrors((e) => ({ ...e, recomputeProjectId: undefined }));
                  }}
                >
                  <MenuItem value="">
                    <em>Select project</em>
                  </MenuItem>
                  {projects.map((project) => (
                    <MenuItem key={project.id} value={project.id}>
                      {project.projectName}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  {recomputeErrors.recomputeProjectId ?? "Uses the same roster as everywhere else—no manual paste."}
                </FormHelperText>
              </FormControl>

              <Stack spacing={2} direction={{ xs: "column", md: "row" }} sx={{ flexWrap: "wrap", mb: 2 }}>
                <TextField
                  label="Employee ID"
                  value={employeeId}
                  onChange={(event) => {
                    setEmployeeId(event.target.value);
                    setRecomputeErrors((e) => ({ ...e, employeeId: undefined }));
                  }}
                  error={Boolean(recomputeErrors.employeeId)}
                  helperText={recomputeErrors.employeeId ?? "Must match an assignment on this project."}
                  sx={{ flex: "1 1 220px" }}
                />
                <TextField
                  label="Month"
                  placeholder="YYYY-MM"
                  value={recomputeMonth}
                  onChange={(event) => {
                    setRecomputeMonth(event.target.value);
                    setRecomputeErrors((e) => ({ ...e, recomputeMonth: undefined }));
                  }}
                  error={Boolean(recomputeErrors.recomputeMonth)}
                  helperText={recomputeErrors.recomputeMonth ?? "Calendar month to close."}
                  sx={{ flex: "1 1 160px" }}
                />
              </Stack>
              <Button type="submit">Run recompute</Button>
            </Box>
          </AccordionDetails>
        </Accordion>

        <Accordion defaultExpanded disableGutters elevation={0} sx={{ borderRadius: "16px !important", border: 1, borderColor: "divider", "&:before": { display: "none" } }}>
          <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
            <Box>
              <Typography sx={{ fontWeight: 600 }}>Rates & projections</Typography>
              <Typography variant="caption" color="text.secondary">
                Contract-level picks once; two quick forms share the same assignment.
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <FormControl fullWidth sx={{ maxWidth: 480, mb: 2 }}>
              <InputLabel id="rev-project-label">Project</InputLabel>
              <Select
                labelId="rev-project-label"
                label="Project"
                value={projectId}
                onChange={(event: SelectChangeEvent<string>) => setProjectId(event.target.value)}
              >
                <MenuItem value="">
                  <em>Select project</em>
                </MenuItem>
                {projects.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.projectName}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>Filters the assignment list.</FormHelperText>
            </FormControl>

            <FormControl fullWidth sx={{ maxWidth: 480, mb: 3 }} disabled={!projectId} error={Boolean(rateErrors.assignmentId || projectionErrors.assignmentId)}>
              <InputLabel id="rev-assignment-label">Assignment</InputLabel>
              <Select
                labelId="rev-assignment-label"
                label="Assignment"
                value={assignmentId}
                onChange={(event: SelectChangeEvent<string>) => {
                  setAssignmentId(event.target.value);
                  setRateErrors((e) => ({ ...e, assignmentId: undefined }));
                  setProjectionErrors((e) => ({ ...e, assignmentId: undefined }));
                }}
              >
                <MenuItem value="">
                  <em>Select assignment</em>
                </MenuItem>
                {assignments.map((assignment) => (
                  <MenuItem key={assignment.id} value={assignment.id}>
                    {assignment.teamMemberName} ({assignment.employeeId})
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText error={Boolean(rateErrors.assignmentId)}>
                {rateErrors.assignmentId ||
                  projectionErrors.assignmentId ||
                  (!projectId ? "Choose a project first." : "Shared by rate revision and projection.")}
              </FormHelperText>
            </FormControl>

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Rate revision
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: "block" }}>
              Authorizer is you ({session?.role.replace(/_/g, " ") ?? "signed-in user"}).
            </Typography>
            <Box component="form" onSubmit={handleRateRevision} sx={{ mb: 3 }}>
              <Stack spacing={2} direction={{ xs: "column", md: "row" }} sx={{ flexWrap: "wrap" }}>
                <TextField
                  label="Effective date"
                  type="date"
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={effectiveDate}
                  onChange={(event) => {
                    setEffectiveDate(event.target.value);
                    setRateErrors((e) => ({ ...e, effectiveDate: undefined }));
                  }}
                  error={Boolean(rateErrors.effectiveDate)}
                  helperText={rateErrors.effectiveDate ?? "First day the new rate applies."}
                  sx={{ flex: "1 1 180px" }}
                />
                <TextField
                  label="New daily rate"
                  type="number"
                  value={newRate}
                  onChange={(event) => {
                    setNewRate(event.target.value);
                    setRateErrors((e) => ({ ...e, newRate: undefined }));
                  }}
                  error={Boolean(rateErrors.newRate)}
                  helperText={rateErrors.newRate ?? "Contract currency."}
                  sx={{ flex: "1 1 160px" }}
                />
              </Stack>
              <Button type="submit" sx={{ mt: 2 }}>
                Save revision
              </Button>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
              Projection window
            </Typography>
            <Box component="form" onSubmit={handleProjection}>
              <Stack spacing={2} direction={{ xs: "column", md: "row" }} sx={{ flexWrap: "wrap" }}>
                <TextField
                  label="Start"
                  type="date"
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={projectionStart}
                  onChange={(event) => {
                    setProjectionStart(event.target.value);
                    setProjectionErrors((e) => ({ ...e, dates: undefined }));
                  }}
                  sx={{ flex: "1 1 180px" }}
                />
                <TextField
                  label="End"
                  type="date"
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={projectionEnd}
                  onChange={(event) => {
                    setProjectionEnd(event.target.value);
                    setProjectionErrors((e) => ({ ...e, dates: undefined }));
                  }}
                  error={Boolean(projectionErrors.dates)}
                  helperText={projectionErrors.dates ?? "Inclusive window."}
                  sx={{ flex: "1 1 180px" }}
                />
                <TextField
                  label="Projection rate"
                  type="number"
                  value={projectionRate}
                  onChange={(event) => {
                    setProjectionRate(event.target.value);
                    setProjectionErrors((e) => ({ ...e, projectionRate: undefined }));
                  }}
                  error={Boolean(projectionErrors.projectionRate)}
                  helperText={projectionErrors.projectionRate ?? "Expected daily rate for the window."}
                  sx={{ flex: "1 1 160px" }}
                />
              </Stack>
              <Button type="submit" sx={{ mt: 2 }}>
                Create projection
              </Button>
            </Box>
          </AccordionDetails>
        </Accordion>

        <Accordion disableGutters elevation={0} sx={{ borderRadius: "16px !important", border: 1, borderColor: "divider", "&:before": { display: "none" } }}>
          <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
            <Box>
              <Typography sx={{ fontWeight: 600 }}>Bulk projections</Typography>
              <Typography variant="caption" color="text.secondary">
                Spreadsheet-friendly import when finance sends many windows at once.
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Headers must match the template: assignmentId, startDate, endDate, projectionRate.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button variant="outlined" onClick={downloadProjectionTemplate}>
                Download template
              </Button>
              <Button variant="contained" component="label">
                Upload workbook
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  hidden
                  onChange={(event) => void handleBulkProjections(event.target.files?.[0] ?? null)}
                />
              </Button>
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Stack>
      {FeedbackSnackbar}
    </>
  );
}

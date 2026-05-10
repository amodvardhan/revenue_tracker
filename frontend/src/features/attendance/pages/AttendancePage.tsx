import React, { useCallback, useEffect, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import type { SelectChangeEvent } from "@mui/material/Select";

import { usePageFeedback } from "../../../app/usePageFeedback";
import {
  bulkUploadAttendance,
  deleteAttendance,
  listAssignments,
  listAttendance,
  listProjects,
  recordAttendance,
  validateYearMonth,
  type AssignmentRow,
  type AttendanceRecord,
  type BulkAttendanceRow,
  type ProjectRow
} from "../../app/services/appApi";
import { PageHeader } from "../../../app/PageHeader";
import { cellNumber, cellString, downloadMatrix, parseFirstSheetRecords } from "../../../lib/xlsxBulk";

export function AttendancePage(): JSX.Element {
  const { notifySuccess, notifyError, notifyRawError, FeedbackSnackbar } = usePageFeedback();

  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [projectId, setProjectId] = useState("");
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [assignmentId, setAssignmentId] = useState("");
  const [month, setMonth] = useState("");
  const [actualDays, setActualDays] = useState("");
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const [attendanceRows, setAttendanceRows] = useState<AttendanceRecord[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AttendanceRecord | null>(null);

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
      setAttendanceRows([]);
      setEditingId(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const rows = await listAssignments(projectId);
        if (!cancelled) {
          setAssignments(rows);
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

  const refreshAttendance = useCallback(async () => {
    if (!projectId) {
      setAttendanceRows([]);
      setLoadingAttendance(false);
      return;
    }
    setLoadingAttendance(true);
    try {
      const rows = await listAttendance(projectId);
      setAttendanceRows(rows);
    } catch (err) {
      notifyError(err);
      setAttendanceRows([]);
    } finally {
      setLoadingAttendance(false);
    }
  }, [projectId, notifyError]);

  useEffect(() => {
    void refreshAttendance();
  }, [refreshAttendance]);

  const selectedProjectName = projects.find((p) => p.id === projectId)?.projectName ?? "";

  function validate(): boolean {
    const next: Partial<Record<string, string>> = {};
    if (!projectId) {
      next.projectId = "Select the contract first.";
    }
    if (!assignmentId) {
      next.assignmentId = "Pick who this entry is for.";
    }
    if (!validateYearMonth(month)) {
      next.month = "Use format YYYY-MM (example: 2026-03).";
    }
    const days = Number(actualDays);
    if (actualDays.trim() === "" || !Number.isFinite(days) || days < 0) {
      next.actualDays = "Enter zero or more working days.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function clearForm(): void {
    setEditingId(null);
    setAssignmentId("");
    setMonth("");
    setActualDays("");
    setErrors({});
  }

  function startEdit(row: AttendanceRecord): void {
    setEditingId(row.id);
    setAssignmentId(row.assignmentId);
    setMonth(row.month);
    setActualDays(String(row.actualDays));
    setErrors({});
    requestAnimationFrame(() => {
      document.getElementById("attendance-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (!validate()) {
      return;
    }
    const days = Number(actualDays);
    try {
      await recordAttendance(projectId, { assignmentId, month: month.trim(), actualDays: days });
      notifySuccess(editingId ? "Attendance updated." : "Attendance saved—you’ll see it in the table above.");
      setEditingId(null);
      setMonth("");
      setActualDays("");
      setErrors({});
      await refreshAttendance();
    } catch (err) {
      notifyError(err);
    }
  }

  async function confirmDelete(): Promise<void> {
    if (!deleteTarget || !projectId) {
      return;
    }
    try {
      await deleteAttendance(projectId, deleteTarget.id);
      notifySuccess("Attendance removed.");
      setDeleteTarget(null);
      if (editingId === deleteTarget.id) {
        clearForm();
      }
      await refreshAttendance();
    } catch (err) {
      notifyError(err);
    }
  }

  function downloadAttendanceTemplate(): void {
    downloadMatrix("attendance-bulk-template.xlsx", "attendance", [
      ["assignmentId", "month", "actualDays"],
      ["assignment-uuid-here", "2026-01", 10]
    ]);
  }

  async function handleBulk(file: File | null): Promise<void> {
    if (!projectId) {
      notifyRawError("Choose a project first—the list above depends on it.");
      setErrors((e) => ({ ...e, projectId: "Pick a project." }));
      return;
    }
    if (!file) {
      notifyRawError("Choose an Excel file first.");
      return;
    }
    try {
      const records = await parseFirstSheetRecords(file);
      const rows: BulkAttendanceRow[] = [];
      let skipped = 0;
      for (const record of records) {
        const aid = cellString(record.assignmentId);
        const m = cellString(record.month);
        const days = cellNumber(record.actualDays);
        if (!aid || !validateYearMonth(m) || days == null || days < 0) {
          skipped += 1;
          continue;
        }
        rows.push({ assignmentId: aid, month: m, actualDays: days });
      }
      if (rows.length === 0) {
        notifyRawError(
          skipped > 0
            ? `No valid rows (${skipped} skipped). Columns must be assignmentId, month, actualDays.`
            : "No rows found—compare your sheet with the template."
        );
        return;
      }
      const result = await bulkUploadAttendance(projectId, rows);
      notifySuccess(`Imported ${result.createdCount} row${result.createdCount === 1 ? "" : "s"}.`);
      await refreshAttendance();
    } catch (err) {
      notifyError(err);
    }
  }

  return (
    <>
      <Stack spacing={3}>
        <PageHeader
          eyebrow="Operations"
          title="Attendance"
          description="Choose a project, then review saved entries or add a month. Saving the same assignment + month again updates the row—that’s how you edit."
        />

        <Paper elevation={0} sx={{ p: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ letterSpacing: "0.04em", mb: 2 }}>
            Step 1 · Context
          </Typography>
          <FormControl fullWidth sx={{ maxWidth: 520 }} error={Boolean(errors.projectId)}>
            <InputLabel id="attendance-project-label">Project</InputLabel>
            <Select
              labelId="attendance-project-label"
              label="Project"
              value={projectId}
              onChange={(event: SelectChangeEvent<string>) => {
                setProjectId(event.target.value);
                setErrors((e) => ({ ...e, projectId: undefined }));
                setEditingId(null);
                setAssignmentId("");
                setMonth("");
                setActualDays("");
              }}
            >
              <MenuItem value="">
                <em>Select a project</em>
              </MenuItem>
              {projects.map((project) => (
                <MenuItem key={project.id} value={project.id}>
                  {project.projectName}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              {errors.projectId ?? "All attendance below is scoped to this contract."}
            </FormHelperText>
          </FormControl>
          {projectId ? (
            <Chip
              sx={{ mt: 2 }}
              label={`Viewing: ${selectedProjectName}`}
              color="primary"
              variant="outlined"
            />
          ) : null}
        </Paper>

        {projectId ? (
          <Paper elevation={0} sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
              Saved attendance
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Every row you save appears here. Dashboard totals update after each save.
            </Typography>
            <TableContainer sx={{ borderRadius: 2, border: 1, borderColor: "divider", overflow: "auto" }}>
              <Table size="small" stickyHeader aria-label="Attendance saved for project">
                <TableHead>
                  <TableRow>
                    <TableCell>Month</TableCell>
                    <TableCell>Team member</TableCell>
                    <TableCell>Employee ID</TableCell>
                    <TableCell align="right">Actual days</TableCell>
                    <TableCell align="right" width={120}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingAttendance ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Typography variant="body2" color="text.secondary">
                          Loading…
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : attendanceRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Typography variant="body2" color="text.secondary">
                          No rows yet—add one in the form below, or import via Excel.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    attendanceRows.map((row) => (
                      <TableRow key={row.id} hover selected={editingId === row.id}>
                        <TableCell sx={{ fontWeight: 600 }}>{row.month}</TableCell>
                        <TableCell>{row.assignment.teamMemberName}</TableCell>
                        <TableCell>{row.assignment.employeeId}</TableCell>
                        <TableCell align="right">{row.actualDays}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="Load into form to change days">
                            <IconButton
                              size="small"
                              aria-label={`Edit ${row.month}`}
                              onClick={() => startEdit(row)}
                              color={editingId === row.id ? "primary" : "default"}
                            >
                              <EditRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Remove this month">
                            <IconButton
                              size="small"
                              aria-label={`Delete ${row.month}`}
                              onClick={() => setDeleteTarget(row)}
                              color="error"
                            >
                              <DeleteOutlineRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        ) : null}

        <Paper elevation={0} sx={{ p: 3 }} id="attendance-form">
          <Typography variant="subtitle2" color="text.secondary" sx={{ letterSpacing: "0.04em", mb: 1 }}>
            Step 2 · Add or update a month
          </Typography>
          {editingId ? (
            <Chip
              label={`Editing ${month} · save to apply changes`}
              onDelete={() => clearForm()}
              sx={{ mb: 2 }}
              color="primary"
              variant="outlined"
            />
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Same assignment + month = update (no duplicate rows).
            </Typography>
          )}
          <Stack spacing={2} component="form" onSubmit={handleSubmit} noValidate>
            <FormControl fullWidth sx={{ maxWidth: 480 }} disabled={!projectId} error={Boolean(errors.assignmentId)}>
              <InputLabel id="attendance-assignment-label">Assignment</InputLabel>
              <Select
                labelId="attendance-assignment-label"
                label="Assignment"
                value={assignmentId}
                onChange={(event: SelectChangeEvent<string>) => {
                  setAssignmentId(event.target.value);
                  setErrors((e) => ({ ...e, assignmentId: undefined }));
                }}
              >
                <MenuItem value="">
                  <em>Select an assignment</em>
                </MenuItem>
                {assignments.map((assignment) => (
                  <MenuItem key={assignment.id} value={assignment.id}>
                    {assignment.teamMemberName} ({assignment.employeeId})
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                {errors.assignmentId ??
                  (!projectId
                    ? "Pick a project first."
                    : assignments.length === 0
                      ? "No people on this project yet—add assignments under Projects."
                      : "One row per person per month.")}
              </FormHelperText>
            </FormControl>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Month"
                placeholder="YYYY-MM"
                value={month}
                onChange={(event) => {
                  setMonth(event.target.value);
                  setErrors((e) => ({ ...e, month: undefined }));
                }}
                error={Boolean(errors.month)}
                helperText={errors.month ?? "Calendar month you’re closing."}
                sx={{ maxWidth: 220 }}
              />
              <TextField
                label="Actual days"
                type="number"
                slotProps={{ htmlInput: { min: 0, step: 0.5 } }}
                value={actualDays}
                onChange={(event) => {
                  setActualDays(event.target.value);
                  setErrors((e) => ({ ...e, actualDays: undefined }));
                }}
                error={Boolean(errors.actualDays)}
                helperText={errors.actualDays ?? "Must not exceed expected days for this allocation."}
                sx={{ maxWidth: 200 }}
              />
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button type="submit" size="large" disabled={!projectId}>
                {editingId ? "Update attendance" : "Save attendance"}
              </Button>
              <Button
                type="button"
                variant="outlined"
                onClick={clearForm}
                disabled={!editingId && !assignmentId && !month.trim() && !actualDays.trim()}
              >
                Clear form
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Accordion
          disableGutters
          elevation={0}
          sx={{ borderRadius: "16px !important", border: 1, borderColor: "divider", "&:before": { display: "none" } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
            <Box>
              <Typography sx={{ fontWeight: 600 }}>Bulk import (Excel)</Typography>
              <Typography variant="caption" color="text.secondary">
                Optional—same rules; refreshes the table when done.
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Requires the project selected in step 1. Columns: assignmentId, month, actualDays.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button variant="outlined" onClick={downloadAttendanceTemplate}>
                Download template
              </Button>
              <Button variant="contained" component="label" disabled={!projectId}>
                Upload workbook
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  hidden
                  onChange={(event) => void handleBulk(event.target.files?.[0] ?? null)}
                />
              </Button>
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Stack>

      <Dialog open={deleteTarget !== null} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Remove attendance?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteTarget
              ? `Delete ${deleteTarget.month} for ${deleteTarget.assignment.teamMemberName}? This updates downstream revenue figures.`
              : null}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => void confirmDelete()}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {FeedbackSnackbar}
    </>
  );
}

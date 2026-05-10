import React, { useCallback, useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
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
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import Link from "@mui/material/Link";
import { alpha } from "@mui/material/styles";
import type { SelectChangeEvent } from "@mui/material/Select";
import { Link as RouterLink } from "react-router-dom";

import { usePageFeedback } from "../../../app/usePageFeedback";
import {
  bulkUploadAssignments,
  createAssignment,
  createProject,
  listAccounts,
  listAssignments,
  listProjects,
  type AccountRow,
  type AssignmentRow,
  type BulkAssignmentRow,
  type ProjectRow
} from "../../app/services/appApi";
import { PageHeader } from "../../../app/PageHeader";
import { cellNumber, cellString, downloadMatrix, parseFirstSheetRecords } from "../../../lib/xlsxBulk";

type ProjectTab = "create" | "assignments";

function formatContractRange(project: ProjectRow): string | null {
  try {
    const start = project.startDate ? new Date(project.startDate) : null;
    const end = project.endDate ? new Date(project.endDate) : null;
    const validStart = start && !Number.isNaN(start.getTime());
    const validEnd = end && !Number.isNaN(end.getTime());
    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
    if (validStart && validEnd) {
      return `${start.toLocaleDateString(undefined, opts)} → ${end!.toLocaleDateString(undefined, opts)}`;
    }
    if (validStart) {
      return `Starts ${start.toLocaleDateString(undefined, opts)}`;
    }
    if (validEnd) {
      return `Ends ${end!.toLocaleDateString(undefined, opts)}`;
    }
  } catch {
    return null;
  }
  return null;
}

function formatAssignmentContractWindow(assignment: AssignmentRow): string {
  try {
    const start = new Date(assignment.signedStartDate);
    const end = new Date(assignment.signedEndDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return "—";
    }
    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
    return `${start.toLocaleDateString(undefined, opts)} → ${end.toLocaleDateString(undefined, opts)}`;
  } catch {
    return "—";
  }
}

export function ProjectsPage(): JSX.Element {
  const { notifySuccess, notifyError, notifyRawError, FeedbackSnackbar } = usePageFeedback();
  const [tab, setTab] = useState<ProjectTab>("create");

  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [accounts, setAccounts] = useState<AccountRow[]>([]);

  const [projectName, setProjectName] = useState("");
  const [clientName, setClientName] = useState("");
  const [accountId, setAccountId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [projectErrors, setProjectErrors] = useState<Partial<Record<string, string>>>({});

  const [assignmentProjectId, setAssignmentProjectId] = useState("");
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [teamMemberName, setTeamMemberName] = useState("");
  const [allocationPercent, setAllocationPercent] = useState("");
  const [dailyRate, setDailyRate] = useState("");
  const [signedStartDate, setSignedStartDate] = useState("");
  const [signedEndDate, setSignedEndDate] = useState("");
  const [assignmentErrors, setAssignmentErrors] = useState<Partial<Record<string, string>>>({});

  const loadProjects = useCallback(async () => {
    try {
      const rows = await listProjects();
      setProjects(rows);
    } catch (err) {
      notifyError(err);
    }
  }, [notifyError]);

  const loadAccounts = useCallback(async () => {
    try {
      const rows = await listAccounts();
      setAccounts(rows);
    } catch (err) {
      notifyError(err);
    }
  }, [notifyError]);

  useEffect(() => {
    void loadProjects();
    void loadAccounts();
  }, [loadProjects, loadAccounts]);

  useEffect(() => {
    if (!assignmentProjectId) {
      setAssignments([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const rows = await listAssignments(assignmentProjectId);
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
  }, [assignmentProjectId]);

  function validateProjectForm(): boolean {
    const next: Partial<Record<string, string>> = {};
    if (!projectName.trim()) {
      next.projectName = "Add a name people will recognize in reports.";
    }
    if (!clientName.trim()) {
      next.clientName = "Client name is required.";
    }
    if (!accountId.trim()) {
      next.accountId = "Choose the commercial account this project belongs to.";
    }
    if (startDate && endDate && startDate > endDate) {
      next.dates = "End date must be on or after start date.";
    }
    setProjectErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleCreateProject(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (!validateProjectForm()) {
      return;
    }
    try {
      await createProject({
        projectName: projectName.trim(),
        clientName: clientName.trim(),
        accountId: accountId.trim(),
        startDate: startDate || undefined,
        endDate: endDate || undefined
      });
      notifySuccess("Project created.");
      setProjectName("");
      setClientName("");
      setAccountId("");
      setStartDate("");
      setEndDate("");
      setProjectErrors({});
      await loadProjects();
      requestAnimationFrame(() => {
        document.getElementById("project-directory")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (err) {
      notifyError(err);
    }
  }

  function validateAssignmentForm(): boolean {
    const next: Partial<Record<string, string>> = {};
    if (!assignmentProjectId) {
      next.assignmentProjectId = "Choose which project this person rolls up to.";
    }
    if (!employeeId.trim()) {
      next.employeeId = "Use your HR / roster identifier.";
    }
    if (!teamMemberName.trim()) {
      next.teamMemberName = "Display name is required.";
    }
    const pct = Number(allocationPercent);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
      next.allocationPercent = "Enter a percentage from 0 to 100.";
    }
    const rate = Number(dailyRate);
    if (!Number.isFinite(rate) || rate <= 0) {
      next.dailyRate = "Daily rate must be greater than zero.";
    }
    if (!signedStartDate || !signedEndDate) {
      next.dates = "Both signed start and end dates are required.";
    } else if (signedStartDate > signedEndDate) {
      next.dates = "Start must be on or before end.";
    }
    setAssignmentErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleCreateAssignment(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (!validateAssignmentForm()) {
      return;
    }
    const pct = Number(allocationPercent);
    const rate = Number(dailyRate);
    try {
      await createAssignment(assignmentProjectId, {
        employeeId: employeeId.trim(),
        teamMemberName: teamMemberName.trim(),
        allocationPercent: pct,
        dailyRate: rate,
        signedStartDate,
        signedEndDate
      });
      notifySuccess("Assignment added.");
      setEmployeeId("");
      setTeamMemberName("");
      setAllocationPercent("");
      setDailyRate("");
      setSignedStartDate("");
      setSignedEndDate("");
      setAssignmentErrors({});
      const rows = await listAssignments(assignmentProjectId);
      setAssignments(rows);
    } catch (err) {
      notifyError(err);
    }
  }

  async function copyProjectId(id: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(id);
      notifySuccess("Project ID copied to clipboard.");
    } catch {
      notifyRawError("Could not copy—select the ID text manually.");
    }
  }

  async function copyAssignmentId(id: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(id);
      notifySuccess("Assignment ID copied.");
    } catch {
      notifyRawError("Could not copy—select the ID manually.");
    }
  }

  function openAssignmentsForProject(selectedProjectId: string): void {
    setAssignmentProjectId(selectedProjectId);
    setAssignmentErrors((e) => ({ ...e, assignmentProjectId: undefined }));
    setTab("assignments");
    requestAnimationFrame(() => {
      document.getElementById("assignments-workspace")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function downloadAssignmentsTemplate(): void {
    downloadMatrix("assignments-bulk-template.xlsx", "assignments", [
      [
        "employeeId",
        "teamMemberName",
        "allocationPercent",
        "dailyRate",
        "signedStartDate",
        "signedEndDate"
      ],
      ["TM-100", "Example Member", 50, 1200, "2026-01-01", "2026-12-31"]
    ]);
  }

  async function handleBulkAssignmentsFile(file: File | null): Promise<void> {
    if (!assignmentProjectId) {
      notifyRawError("Choose a project above before uploading—imports attach to that contract.");
      setAssignmentErrors((prev) => ({
        ...prev,
        assignmentProjectId: "Required for bulk import."
      }));
      return;
    }
    if (!file) {
      notifyRawError("Pick an Excel file (.xlsx) to upload.");
      return;
    }
    try {
      const records = await parseFirstSheetRecords(file);
      const rows: BulkAssignmentRow[] = [];
      let skipped = 0;
      for (const record of records) {
        const employeeIdCell = cellString(record.employeeId);
        const nameCell = cellString(record.teamMemberName);
        const alloc = cellNumber(record.allocationPercent);
        const rateCell = cellNumber(record.dailyRate);
        const startCell = cellString(record.signedStartDate);
        const endCell = cellString(record.signedEndDate);
        if (
          !employeeIdCell ||
          !nameCell ||
          alloc == null ||
          rateCell == null ||
          !startCell ||
          !endCell
        ) {
          skipped += 1;
          continue;
        }
        rows.push({
          employeeId: employeeIdCell,
          teamMemberName: nameCell,
          allocationPercent: alloc,
          dailyRate: rateCell,
          signedStartDate: startCell,
          signedEndDate: endCell
        });
      }
      if (rows.length === 0) {
        notifyRawError(
          skipped > 0
            ? `No complete rows found (${skipped} row${skipped === 1 ? "" : "s"} skipped). Check column headers match the template.`
            : "No rows to import. Use the template columns exactly."
        );
        return;
      }
      const result = await bulkUploadAssignments(assignmentProjectId, rows);
      notifySuccess(`Imported ${result.createdCount} assignment${result.createdCount === 1 ? "" : "s"}.`);
      const next = await listAssignments(assignmentProjectId);
      setAssignments(next);
    } catch (err) {
      notifyError(err);
    }
  }

  return (
    <>
      <Stack spacing={3}>
        <PageHeader
          title="Projects"
          description="Create a contract under an account (from your Organization catalog), then add people and rates—or bulk-upload from Excel."
        />

        <Paper elevation={0} sx={{ px: 2, pt: 2 }}>
          <Tabs
            value={tab}
            onChange={(_, v: ProjectTab) => setTab(v)}
            variant="fullWidth"
            sx={{
              minHeight: 48,
              "& .MuiTab-root": { textTransform: "none", fontWeight: 600, fontSize: "0.9375rem" }
            }}
          >
            <Tab value="create" label="Create & browse" />
            <Tab value="assignments" label="Assignments & import" />
          </Tabs>
        </Paper>

        {tab === "create" ? (
          <Paper elevation={0} sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
              New project
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Contract window dates are optional; leave blank if you only know the commercial name for now.
            </Typography>
            <Box component="form" onSubmit={handleCreateProject} noValidate>
              <Stack spacing={2} direction={{ xs: "column", md: "row" }} sx={{ flexWrap: "wrap" }}>
                <TextField
                  label="Project name"
                  value={projectName}
                  onChange={(event) => {
                    setProjectName(event.target.value);
                    setProjectErrors((e) => ({ ...e, projectName: undefined }));
                  }}
                  required
                  error={Boolean(projectErrors.projectName)}
                  helperText={projectErrors.projectName ?? "Shown on dashboards and reports."}
                  sx={{ flex: "1 1 200px" }}
                />
                <TextField
                  label="Client name"
                  value={clientName}
                  onChange={(event) => {
                    setClientName(event.target.value);
                    setProjectErrors((e) => ({ ...e, clientName: undefined }));
                  }}
                  required
                  error={Boolean(projectErrors.clientName)}
                  helperText={projectErrors.clientName ?? "Legal or commercial client label."}
                  sx={{ flex: "1 1 200px" }}
                />
                <FormControl
                  required
                  error={Boolean(projectErrors.accountId)}
                  sx={{ flex: "1 1 220px", minWidth: 200 }}
                >
                  <InputLabel id="project-account-label">Account</InputLabel>
                  <Select
                    labelId="project-account-label"
                    label="Account"
                    value={accountId}
                    onChange={(event: SelectChangeEvent<string>) => {
                      setAccountId(event.target.value);
                      setProjectErrors((e) => ({ ...e, accountId: undefined }));
                    }}
                  >
                    {accounts.length === 0 ? (
                      <MenuItem value="" disabled>
                        No accounts yet — use Organization settings (Configuration) to add a unit and accounts
                      </MenuItem>
                    ) : null}
                    {accounts.map((row) => (
                      <MenuItem key={row.id} value={row.id}>
                        {row.code} — {row.displayName} ({row.businessUnit.code})
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText component="div">
                    {projectErrors.accountId ? (
                      projectErrors.accountId
                    ) : (
                      <>
                        Pick the commercial account for this contract (business unit + owners).{" "}
                        <Link
                          component={RouterLink}
                          to="/configuration?section=organization"
                          underline="hover"
                          sx={{ fontWeight: 600 }}
                        >
                          Organization settings
                        </Link>
                      </>
                    )}
                  </FormHelperText>
                </FormControl>
                <TextField
                  label="Start"
                  type="date"
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={startDate}
                  onChange={(event) => {
                    setStartDate(event.target.value);
                    setProjectErrors((e) => ({ ...e, dates: undefined }));
                  }}
                  sx={{ flex: "1 1 160px" }}
                />
                <TextField
                  label="End"
                  type="date"
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={endDate}
                  onChange={(event) => {
                    setEndDate(event.target.value);
                    setProjectErrors((e) => ({ ...e, dates: undefined }));
                  }}
                  error={Boolean(projectErrors.dates)}
                  helperText={projectErrors.dates ?? "Optional contract end."}
                  sx={{ flex: "1 1 160px" }}
                />
              </Stack>
              <Button type="submit" sx={{ mt: 2 }}>
                Create project
              </Button>
            </Box>
          </Paper>
        ) : null}

        {tab === "create" ? (
          <Paper
            elevation={0}
            id="project-directory"
            sx={{
              p: 3,
              borderRadius: "18px",
              background: (theme) =>
                `linear-gradient(165deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, transparent 42%)`
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{
                justifyContent: "space-between",
                alignItems: { sm: "flex-start" },
                mb: 3,
                gap: 2
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, letterSpacing: "-0.02em" }}>
                  Project library
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5, letterSpacing: "0.02em" }}>
                  Reference catalog · not a separate screen
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.55 }}>
                  {projects.length === 0
                    ? "After you create a contract above, it appears here as a card: identity (name, client, account, dates) plus the internal ID other pages expect."
                    : `${projects.length} contract${projects.length === 1 ? "" : "s"}. Each card summarizes what you entered and lets you copy the ID (for tools or support). Use “Assignments & import” on a card to staff that contract or upload Excel.`}
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="medium"
                startIcon={<RefreshRoundedIcon />}
                onClick={() => void loadProjects()}
                sx={{ flexShrink: 0, alignSelf: { xs: "stretch", sm: "center" } }}
              >
                Refresh
              </Button>
            </Stack>

            {projects.length === 0 ? (
              <Paper
                variant="outlined"
                sx={{
                  p: 5,
                  textAlign: "center",
                  borderStyle: "dashed",
                  borderRadius: "14px",
                  bgcolor: alpha("#000000", 0.02)
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Your library is empty
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 440, mx: "auto", lineHeight: 1.6 }}>
                  Use the form above to add the first project. This library is where you’ll confirm it saved, copy its ID, and
                  jump to assignments or bulk import for that contract.
                </Typography>
              </Paper>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                    lg: "repeat(3, minmax(0, 1fr))"
                  },
                  gap: 2
                }}
              >
                {projects.map((project) => {
                  const rangeLabel = formatContractRange(project);
                  return (
                    <Paper
                      key={project.id}
                      elevation={0}
                      sx={{
                        p: 2.5,
                        borderRadius: "14px",
                        border: "1px solid",
                        borderColor: "divider",
                        bgcolor: "background.paper",
                        display: "flex",
                        flexDirection: "column",
                        minHeight: 168,
                        transition: "box-shadow 0.22s ease, transform 0.22s ease, border-color 0.22s ease",
                        "&:hover": {
                          boxShadow: (theme) => `0 14px 44px ${alpha(theme.palette.common.black, 0.07)}`,
                          transform: "translateY(-3px)",
                          borderColor: alpha("#0071e3", 0.35)
                        }
                      }}
                    >
                      <Stack direction="row" spacing={1.75} sx={{ flex: 1, minWidth: 0, alignItems: "flex-start" }}>
                        <Avatar
                          variant="rounded"
                          sx={{
                            width: 48,
                            height: 48,
                            bgcolor: alpha("#0071e3", 0.1),
                            color: "primary.main"
                          }}
                        >
                          <FolderRoundedIcon />
                        </Avatar>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.3 }}
                            noWrap
                            title={project.projectName}
                          >
                            {project.projectName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.45 }}>
                            {project.clientName}
                          </Typography>
                          <Stack direction="row" sx={{ mt: 1.25, flexWrap: "wrap", gap: 0.75 }}>
                            <Chip label={project.account} size="small" variant="outlined" sx={{ fontWeight: 500 }} />
                            {project.businessUnitCode ? (
                              <Chip
                                label={project.businessUnitCode}
                                size="small"
                                variant="outlined"
                                color="primary"
                                sx={{ fontWeight: 500 }}
                              />
                            ) : null}
                            {rangeLabel ? (
                              <Chip label={rangeLabel} size="small" sx={{ fontWeight: 500, maxWidth: "100%" }} />
                            ) : (
                              <Chip label="No dates set" size="small" variant="outlined" color="default" />
                            )}
                          </Stack>
                        </Box>
                      </Stack>

                      <Button
                        fullWidth
                        size="small"
                        variant="outlined"
                        endIcon={<ArrowForwardRoundedIcon />}
                        onClick={() => openAssignmentsForProject(project.id)}
                        sx={{ mt: 2 }}
                      >
                        Assignments & import
                      </Button>

                      <Box
                        sx={{
                          mt: 2,
                          pt: 2,
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          borderTop: "1px solid",
                          borderColor: "divider"
                        }}
                      >
                        <Typography
                          component="code"
                          variant="caption"
                          sx={{
                            flex: 1,
                            minWidth: 0,
                            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                            fontSize: "0.7rem",
                            color: "text.secondary",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                          }}
                          title={project.id}
                        >
                          {project.id}
                        </Typography>
                        <Tooltip title="Copy project ID">
                          <IconButton
                            size="small"
                            aria-label="Copy project ID"
                            onClick={(event) => {
                              event.stopPropagation();
                              void copyProjectId(project.id);
                            }}
                            sx={{ flexShrink: 0 }}
                          >
                            <ContentCopyRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Paper>
                  );
                })}
              </Box>
            )}
          </Paper>
        ) : null}

        {tab === "assignments" ? (
          <Paper elevation={0} sx={{ p: 3 }} id="assignments-workspace">
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
              Assignments
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Choose the contract, then add people or bulk-import. Arriving from a library card pre-selects that project.
            </Typography>

            <FormControl
              fullWidth
              sx={{ maxWidth: 480, mb: 2 }}
              error={Boolean(assignmentErrors.assignmentProjectId)}
            >
              <InputLabel id="assignment-project-label">Project</InputLabel>
              <Select
                labelId="assignment-project-label"
                label="Project"
                value={assignmentProjectId}
                onChange={(event: SelectChangeEvent<string>) => {
                  setAssignmentProjectId(event.target.value);
                  setAssignmentErrors((e) => ({ ...e, assignmentProjectId: undefined }));
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
              {assignmentErrors.assignmentProjectId ? (
                <FormHelperText>{assignmentErrors.assignmentProjectId}</FormHelperText>
              ) : (
                <FormHelperText>Required before adding people or importing.</FormHelperText>
              )}
            </FormControl>

            {assignmentProjectId ? (
              <Paper
                variant="outlined"
                sx={{
                  mt: 2,
                  mb: 3,
                  borderRadius: "14px",
                  overflow: "hidden",
                  borderColor: "divider"
                }}
              >
                <Box
                  sx={{
                    px: 2.5,
                    py: 2,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    background: (theme) =>
                      `linear-gradient(105deg, ${alpha(theme.palette.primary.main, 0.07)} 0%, transparent 55%)`
                  }}
                >
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                    <Avatar
                      variant="rounded"
                      sx={{
                        width: 44,
                        height: 44,
                        bgcolor: alpha("#0071e3", 0.1),
                        color: "primary.main"
                      }}
                    >
                      <GroupsRoundedIcon />
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, letterSpacing: "-0.02em" }}>
                        Team roster
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {projects.find((p) => p.id === assignmentProjectId)?.projectName ?? "Project"} ·{" "}
                        {assignments.length === 0
                          ? "no people yet"
                          : `${assignments.length} seat${assignments.length === 1 ? "" : "s"} on this contract`}
                      </Typography>
                    </Box>
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5, lineHeight: 1.5 }}>
                    Allocation and rates flow into attendance and revenue. Copy assignment IDs for spreadsheets or the Attendance
                    page.
                  </Typography>
                </Box>

                {assignments.length === 0 ? (
                  <Box sx={{ px: 3, py: 4, textAlign: "center" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      No one on this contract yet.
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Use the form below to add a row, or bulk-import from Excel.
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer sx={{ maxHeight: 320 }}>
                    <Table size="small" stickyHeader aria-label="People assigned to this project">
                      <TableHead>
                        <TableRow>
                          <TableCell>Team member</TableCell>
                          <TableCell>Employee ID</TableCell>
                          <TableCell align="right">Alloc.</TableCell>
                          <TableCell align="right">Daily rate</TableCell>
                          <TableCell>Contract window</TableCell>
                          <TableCell align="right">Assignment ID</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {assignments.map((assignment) => (
                          <TableRow
                            key={assignment.id}
                            hover
                            sx={{
                              "&:nth-of-type(even)": { bgcolor: alpha("#000000", 0.02) }
                            }}
                          >
                            <TableCell sx={{ fontWeight: 600 }}>{assignment.teamMemberName}</TableCell>
                            <TableCell>{assignment.employeeId}</TableCell>
                            <TableCell align="right">{assignment.allocationPercent}%</TableCell>
                            <TableCell align="right">
                              {assignment.dailyRate.toLocaleString(undefined, {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 2
                              })}
                            </TableCell>
                            <TableCell sx={{ whiteSpace: "nowrap", fontSize: "0.8125rem" }}>
                              {formatAssignmentContractWindow(assignment)}
                            </TableCell>
                            <TableCell align="right" sx={{ verticalAlign: "middle" }}>
                              <Stack direction="row" spacing={0.5} sx={{ justifyContent: "flex-end", alignItems: "center" }}>
                                <Typography
                                  component="code"
                                  variant="caption"
                                  sx={{
                                    maxWidth: 120,
                                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                                    fontSize: "0.7rem",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    display: "block",
                                    textAlign: "right"
                                  }}
                                  title={assignment.id}
                                >
                                  {assignment.id}
                                </Typography>
                                <Tooltip title="Copy assignment ID">
                                  <IconButton
                                    size="small"
                                    aria-label="Copy assignment ID"
                                    onClick={() => void copyAssignmentId(assignment.id)}
                                  >
                                    <ContentCopyRoundedIcon sx={{ fontSize: 18 }} />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
            ) : null}

            <Box component="form" onSubmit={handleCreateAssignment} noValidate>
              <Stack spacing={2} direction={{ xs: "column", md: "row" }} sx={{ flexWrap: "wrap" }}>
                <TextField
                  label="Employee ID"
                  value={employeeId}
                  onChange={(event) => {
                    setEmployeeId(event.target.value);
                    setAssignmentErrors((e) => ({ ...e, employeeId: undefined }));
                  }}
                  error={Boolean(assignmentErrors.employeeId)}
                  helperText={assignmentErrors.employeeId ?? "Stable id from HR / roster."}
                  sx={{ flex: "1 1 160px" }}
                />
                <TextField
                  label="Team member name"
                  value={teamMemberName}
                  onChange={(event) => {
                    setTeamMemberName(event.target.value);
                    setAssignmentErrors((e) => ({ ...e, teamMemberName: undefined }));
                  }}
                  error={Boolean(assignmentErrors.teamMemberName)}
                  helperText={assignmentErrors.teamMemberName ?? "As it should appear in UI."}
                  sx={{ flex: "1 1 200px" }}
                />
                <TextField
                  label="Allocation %"
                  type="number"
                  value={allocationPercent}
                  onChange={(event) => {
                    setAllocationPercent(event.target.value);
                    setAssignmentErrors((e) => ({ ...e, allocationPercent: undefined }));
                  }}
                  error={Boolean(assignmentErrors.allocationPercent)}
                  helperText={assignmentErrors.allocationPercent ?? "0–100 of a full-time equivalent."}
                  sx={{ flex: "1 1 120px" }}
                />
                <TextField
                  label="Daily rate"
                  type="number"
                  value={dailyRate}
                  onChange={(event) => {
                    setDailyRate(event.target.value);
                    setAssignmentErrors((e) => ({ ...e, dailyRate: undefined }));
                  }}
                  error={Boolean(assignmentErrors.dailyRate)}
                  helperText={assignmentErrors.dailyRate ?? "Contract currency."}
                  sx={{ flex: "1 1 120px" }}
                />
                <TextField
                  label="Signed start"
                  type="date"
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={signedStartDate}
                  onChange={(event) => {
                    setSignedStartDate(event.target.value);
                    setAssignmentErrors((e) => ({ ...e, dates: undefined }));
                  }}
                  sx={{ flex: "1 1 160px" }}
                />
                <TextField
                  label="Signed end"
                  type="date"
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={signedEndDate}
                  onChange={(event) => {
                    setSignedEndDate(event.target.value);
                    setAssignmentErrors((e) => ({ ...e, dates: undefined }));
                  }}
                  error={Boolean(assignmentErrors.dates)}
                  helperText={assignmentErrors.dates ?? "Must cover work you intend to track."}
                  sx={{ flex: "1 1 160px" }}
                />
              </Stack>
              <Button type="submit" sx={{ mt: 2 }}>
                Create assignment
              </Button>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
              Bulk import (XLSX)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Download the starter file, keep the header row, paste rows, then upload. Imports always attach to the
              project selected above.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { sm: "center" } }}>
              <Button variant="outlined" onClick={downloadAssignmentsTemplate}>
                Download template
              </Button>
              <Button variant="contained" component="label">
                Upload workbook
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  hidden
                  onChange={(event) => void handleBulkAssignmentsFile(event.target.files?.[0] ?? null)}
                />
              </Button>
            </Stack>
          </Paper>
        ) : null}
      </Stack>
      {FeedbackSnackbar}
    </>
  );
}

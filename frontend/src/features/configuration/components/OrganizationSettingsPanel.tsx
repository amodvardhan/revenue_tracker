import React, { useCallback, useEffect, useMemo, useState } from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
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
  DialogTitle,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  type SelectChangeEvent,
  Stack,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import IconButton from "@mui/material/IconButton";
import { alpha } from "@mui/material/styles";

import type { AccountRow, BusinessUnitRow, UserDirectoryRow } from "../../app/services/appApi";
import {
  createAccount,
  createBusinessUnit,
  deleteAccount,
  deleteBusinessUnit,
  listAccounts,
  listBusinessUnits,
  listUsersDirectory,
  updateAccount,
  updateBusinessUnit
} from "../../app/services/appApi";

interface OrganizationSettingsPanelProps {
  canEdit: boolean;
  notifySuccess: (message: string) => void;
  notifyError: (err: unknown) => void;
}

type ConfirmState =
  | null
  | {
      kind: "businessUnit" | "account";
      id: string;
      title: string;
      detail: string;
    };

export function OrganizationSettingsPanel({
  canEdit,
  notifySuccess,
  notifyError
}: OrganizationSettingsPanelProps): JSX.Element {
  const [businessUnits, setBusinessUnits] = useState<BusinessUnitRow[]>([]);
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [users, setUsers] = useState<UserDirectoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [buCreateOpen, setBuCreateOpen] = useState(false);
  const [buCreateCode, setBuCreateCode] = useState("");
  const [buCreateName, setBuCreateName] = useState("");

  const [buEditTarget, setBuEditTarget] = useState<BusinessUnitRow | null>(null);
  const [buEditName, setBuEditName] = useState("");

  const [accCreateBuId, setAccCreateBuId] = useState<string | null>(null);
  const [accCreateCode, setAccCreateCode] = useState("");
  const [accCreateName, setAccCreateName] = useState("");
  const [accCreateDmId, setAccCreateDmId] = useState("");
  const [accCreateAmId, setAccCreateAmId] = useState("");

  const [accEditTarget, setAccEditTarget] = useState<AccountRow | null>(null);
  const [accEditName, setAccEditName] = useState("");
  const [accEditBuId, setAccEditBuId] = useState("");
  const [accEditDmId, setAccEditDmId] = useState("");
  const [accEditAmId, setAccEditAmId] = useState("");

  const [confirm, setConfirm] = useState<ConfirmState>(null);

  const loadAll = useCallback(async () => {
    try {
      const [buRows, accRows, userRows] = await Promise.all([
        listBusinessUnits(),
        listAccounts(),
        listUsersDirectory()
      ]);
      setBusinessUnits(buRows);
      setAccounts(accRows);
      setUsers(userRows);
    } catch (err) {
      notifyError(err);
    } finally {
      setLoading(false);
    }
  }, [notifyError]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const deliveryOwners = useMemo(
    () => users.filter((u) => u.role === "delivery_manager" || u.role === "delivery_head"),
    [users]
  );
  const accountOwners = useMemo(() => users.filter((u) => u.role === "account_manager"), [users]);

  const accountsByBu = useMemo(() => {
    const map = new Map<string, AccountRow[]>();
    for (const row of accounts) {
      const list = map.get(row.businessUnitId) ?? [];
      list.push(row);
      map.set(row.businessUnitId, list);
    }
    for (const [, list] of map) {
      list.sort((a, b) => a.code.localeCompare(b.code));
    }
    return map;
  }, [accounts]);

  function resetBuCreate(): void {
    setBuCreateCode("");
    setBuCreateName("");
  }

  function resetAccCreate(): void {
    setAccCreateBuId(null);
    setAccCreateCode("");
    setAccCreateName("");
    setAccCreateDmId("");
    setAccCreateAmId("");
  }

  async function submitBuCreate(): Promise<void> {
    if (!buCreateCode.trim() || !buCreateName.trim()) {
      notifyError(new Error("Enter a short code and a full name for the business unit."));
      return;
    }
    try {
      await createBusinessUnit({ code: buCreateCode.trim(), name: buCreateName.trim() });
      notifySuccess("Business unit added.");
      setBuCreateOpen(false);
      resetBuCreate();
      await loadAll();
    } catch (err) {
      notifyError(err);
    }
  }

  async function submitBuEdit(): Promise<void> {
    if (!buEditTarget || !buEditName.trim()) {
      return;
    }
    try {
      await updateBusinessUnit(buEditTarget.id, { name: buEditName.trim() });
      notifySuccess("Business unit updated.");
      setBuEditTarget(null);
      await loadAll();
    } catch (err) {
      notifyError(err);
    }
  }

  function openBuEdit(bu: BusinessUnitRow): void {
    setBuEditTarget(bu);
    setBuEditName(bu.name);
  }

  async function submitAccCreate(): Promise<void> {
    if (
      !accCreateBuId ||
      !accCreateCode.trim() ||
      !accCreateName.trim() ||
      !accCreateDmId ||
      !accCreateAmId
    ) {
      notifyError(new Error("Fill in account code, name, delivery manager, and account manager."));
      return;
    }
    try {
      await createAccount({
        code: accCreateCode.trim(),
        displayName: accCreateName.trim(),
        businessUnitId: accCreateBuId,
        deliveryManagerUserId: accCreateDmId,
        accountManagerUserId: accCreateAmId
      });
      notifySuccess("Account added.");
      resetAccCreate();
      await loadAll();
    } catch (err) {
      notifyError(err);
    }
  }

  function openAccCreate(businessUnitId: string): void {
    setAccCreateBuId(businessUnitId);
    setAccCreateCode("");
    setAccCreateName("");
    setAccCreateDmId(deliveryOwners[0]?.id ?? "");
    setAccCreateAmId(accountOwners[0]?.id ?? "");
  }

  function openAccEdit(row: AccountRow): void {
    setAccEditTarget(row);
    setAccEditName(row.displayName);
    setAccEditBuId(row.businessUnitId);
    setAccEditDmId(row.deliveryManager.id);
    setAccEditAmId(row.accountManager.id);
  }

  async function submitAccEdit(): Promise<void> {
    if (!accEditTarget || !accEditName.trim() || !accEditBuId || !accEditDmId || !accEditAmId) {
      return;
    }
    try {
      await updateAccount(accEditTarget.id, {
        displayName: accEditName.trim(),
        businessUnitId: accEditBuId,
        deliveryManagerUserId: accEditDmId,
        accountManagerUserId: accEditAmId
      });
      notifySuccess("Account updated.");
      setAccEditTarget(null);
      await loadAll();
    } catch (err) {
      notifyError(err);
    }
  }

  async function runConfirmedDelete(): Promise<void> {
    if (!confirm) {
      return;
    }
    try {
      if (confirm.kind === "businessUnit") {
        await deleteBusinessUnit(confirm.id);
        notifySuccess("Business unit removed.");
      } else {
        await deleteAccount(confirm.id);
        notifySuccess("Account removed.");
      }
      setConfirm(null);
      await loadAll();
    } catch (err) {
      notifyError(err);
    }
  }

  if (loading) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
        Loading your organization…
      </Typography>
    );
  }

  return (
    <Stack spacing={3}>
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04)
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "primary.main", mb: 1.5 }}>
          How this works
        </Typography>
        <Stack component="ol" spacing={1.25} sx={{ m: 0, pl: 2.25, color: "text.secondary", typography: "body2" }}>
          <Box component="li" sx={{ pl: 0.5 }}>
            <Typography variant="body2" component="span" sx={{ fontWeight: 600, color: "text.primary" }}>
              Step 1 — Business unit
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.25, display: "block" }}>
              Create a group such as “International Organization (IO)” to hold related client accounts.
            </Typography>
          </Box>
          <Box component="li" sx={{ pl: 0.5 }}>
            <Typography variant="body2" component="span" sx={{ fontWeight: 600, color: "text.primary" }}>
              Step 2 — Account
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.25, display: "block" }}>
              Under each unit, add accounts (WHO, IAEA, …) and assign one delivery manager and one account manager.
            </Typography>
          </Box>
          <Box component="li" sx={{ pl: 0.5 }}>
            <Typography variant="body2" component="span" sx={{ fontWeight: 600, color: "text.primary" }}>
              Step 3 — Project
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.25, display: "block" }}>
              On the Projects page, pick the account from the dropdown when you create a contract. That links revenue to
              the right unit and owners.
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {canEdit ? (
        <Box>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddRoundedIcon />}
            onClick={() => {
              resetBuCreate();
              setBuCreateOpen(true);
            }}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            New business unit
          </Button>
        </Box>
      ) : null}

      {businessUnits.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{
            p: 5,
            textAlign: "center",
            borderRadius: 2,
            borderStyle: "dashed",
            bgcolor: (theme) => alpha(theme.palette.common.black, 0.02)
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            No business units yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: "auto", lineHeight: 1.6 }}>
            {canEdit
              ? "Start with “New business unit”. After that, open the unit below and use “Add account”."
              : "Your administrator can add business units and accounts here."}
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {businessUnits.map((bu, index) => {
            const buAccounts = accountsByBu.get(bu.id) ?? [];
            const canDeleteBu = buAccounts.length === 0;
            return (
              <Accordion
                key={bu.id}
                defaultExpanded={index === 0}
                disableGutters
                elevation={0}
                sx={{
                  borderRadius: "12px !important",
                  border: "1px solid",
                  borderColor: "divider",
                  overflow: "hidden",
                  "&:before": { display: "none" }
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreRoundedIcon />}
                  sx={{
                    px: 2,
                    py: 1.25,
                    bgcolor: "background.paper",
                    "& .MuiAccordionSummary-content": { alignItems: "center", gap: 1.5, my: 0.5 }
                  }}
                >
                  <Chip label={bu.code} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, letterSpacing: "-0.02em" }}>
                      {bu.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {buAccounts.length} account{buAccounts.length === 1 ? "" : "s"}
                    </Typography>
                  </Box>
                  {canEdit ? (
                    <Stack direction="row" spacing={0.25} onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="Rename unit">
                        <IconButton
                          size="small"
                          aria-label={`Edit ${bu.code}`}
                          onClick={() => openBuEdit(bu)}
                        >
                          <EditRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip
                        title={
                          canDeleteBu
                            ? "Delete this unit"
                            : "Remove all accounts first, then you can delete the unit"
                        }
                      >
                        <span>
                          <IconButton
                            size="small"
                            aria-label={`Delete ${bu.code}`}
                            disabled={!canDeleteBu}
                            onClick={() =>
                              setConfirm({
                                kind: "businessUnit",
                                id: bu.id,
                                title: `Delete “${bu.code}”?`,
                                detail:
                                  "This only works if the unit has no accounts. You can rename the unit anytime instead."
                              })
                            }
                          >
                            <DeleteOutlineRoundedIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  ) : null}
                </AccordionSummary>
                <AccordionDetails sx={{ px: 2, pb: 2.5, pt: 0, bgcolor: (t) => alpha(t.palette.common.black, 0.02) }}>
                  {buAccounts.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      No accounts in this unit yet.
                    </Typography>
                  ) : (
                    <List disablePadding dense sx={{ mb: 1 }}>
                      {buAccounts.map((acc) => (
                        <ListItem
                          key={acc.id}
                          sx={{
                            borderRadius: 1,
                            mb: 0.75,
                            bgcolor: "background.paper",
                            border: "1px solid",
                            borderColor: "divider",
                            pr: canEdit ? 10 : 2
                          }}
                          secondaryAction={
                            canEdit ? (
                              <Stack direction="row" spacing={0.25} sx={{ mr: 0.5 }}>
                                <Tooltip title="Edit account">
                                  <IconButton size="small" aria-label={`Edit ${acc.code}`} onClick={() => openAccEdit(acc)}>
                                    <EditRoundedIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete account (only if no projects use it)">
                                  <IconButton
                                    size="small"
                                    aria-label={`Delete ${acc.code}`}
                                    onClick={() =>
                                      setConfirm({
                                        kind: "account",
                                        id: acc.id,
                                        title: `Delete account “${acc.code}”?`,
                                        detail:
                                          "You can only delete an account when no projects are linked to it. Alerts for this account will be cleared automatically."
                                      })
                                    }
                                  >
                                    <DeleteOutlineRoundedIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            ) : null
                          }
                        >
                          <ListItemText
                            primary={
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {acc.code}
                                <Typography component="span" variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                                  {" "}
                                  — {acc.displayName}
                                </Typography>
                              </Typography>
                            }
                            secondary={
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                component="span"
                                sx={{ mt: 0.5, display: "block" }}
                              >
                                Delivery: {acc.deliveryManager.name} · Account: {acc.accountManager.name}
                              </Typography>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                  {canEdit ? (
                    <Button
                      variant="outlined"
                      size="medium"
                      startIcon={<AddRoundedIcon />}
                      onClick={() => openAccCreate(bu.id)}
                      sx={{ mt: 0.5, borderRadius: 2, textTransform: "none", fontWeight: 600 }}
                    >
                      Add account to {bu.code}
                    </Button>
                  ) : null}
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Stack>
      )}

      <Dialog open={buCreateOpen} onClose={() => setBuCreateOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>New business unit</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Code"
              value={buCreateCode}
              onChange={(e) => setBuCreateCode(e.target.value.toUpperCase())}
              helperText="Short label, e.g. IO, APAC (letters, numbers, underscores)"
              fullWidth
              autoFocus
            />
            <TextField
              label="Full name"
              value={buCreateName}
              onChange={(e) => setBuCreateName(e.target.value)}
              helperText="What people see in lists and reports"
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setBuCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => void submitBuCreate()}>
            Create unit
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(buEditTarget)} onClose={() => setBuEditTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle>Rename business unit</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Code <Chip label={buEditTarget?.code ?? ""} size="small" sx={{ ml: 0.5, verticalAlign: "middle" }} /> cannot
              be changed (it is used as a stable key). You can change the display name anytime.
            </Typography>
            <TextField
              label="Full name"
              value={buEditName}
              onChange={(e) => setBuEditName(e.target.value)}
              fullWidth
              autoFocus
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setBuEditTarget(null)}>Cancel</Button>
          <Button variant="contained" onClick={() => void submitBuEdit()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={accCreateBuId !== null}
        onClose={() => resetAccCreate()}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Add account</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            New account under{" "}
            <strong>
              {businessUnits.find((b) => b.id === accCreateBuId)?.code ?? ""}
            </strong>
            . It will appear in the project dropdown immediately after saving.
          </Typography>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Account code"
                value={accCreateCode}
                onChange={(e) => setAccCreateCode(e.target.value.toUpperCase())}
                helperText="e.g. WHO, IAEA"
                fullWidth
              />
              <TextField
                label="Display name"
                value={accCreateName}
                onChange={(e) => setAccCreateName(e.target.value)}
                fullWidth
              />
            </Stack>
            <FormControl fullWidth>
              <InputLabel id="acc-c-dm">Delivery manager</InputLabel>
              <Select
                labelId="acc-c-dm"
                label="Delivery manager"
                value={accCreateDmId}
                onChange={(e: SelectChangeEvent<string>) => setAccCreateDmId(e.target.value)}
              >
                {deliveryOwners.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="acc-c-am">Account manager</InputLabel>
              <Select
                labelId="acc-c-am"
                label="Account manager"
                value={accCreateAmId}
                onChange={(e: SelectChangeEvent<string>) => setAccCreateAmId(e.target.value)}
              >
                {accountOwners.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => resetAccCreate()}>Cancel</Button>
          <Button variant="contained" onClick={() => void submitAccCreate()}>
            Create account
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(accEditTarget)} onClose={() => setAccEditTarget(null)} fullWidth maxWidth="sm">
        <DialogTitle>Edit account {accEditTarget?.code}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Account codes stay fixed after creation. Change the display name or managers below, or move the account to
              another business unit.
            </Typography>
            <TextField label="Display name" value={accEditName} onChange={(e) => setAccEditName(e.target.value)} fullWidth />
            <FormControl fullWidth>
              <InputLabel id="acc-e-bu">Business unit</InputLabel>
              <Select
                labelId="acc-e-bu"
                label="Business unit"
                value={accEditBuId}
                onChange={(e: SelectChangeEvent<string>) => setAccEditBuId(e.target.value)}
              >
                {businessUnits.map((bu) => (
                  <MenuItem key={bu.id} value={bu.id}>
                    {bu.code} — {bu.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="acc-e-dm">Delivery manager</InputLabel>
              <Select
                labelId="acc-e-dm"
                label="Delivery manager"
                value={accEditDmId}
                onChange={(e: SelectChangeEvent<string>) => setAccEditDmId(e.target.value)}
              >
                {deliveryOwners.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="acc-e-am">Account manager</InputLabel>
              <Select
                labelId="acc-e-am"
                label="Account manager"
                value={accEditAmId}
                onChange={(e: SelectChangeEvent<string>) => setAccEditAmId(e.target.value)}
              >
                {accountOwners.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAccEditTarget(null)}>Cancel</Button>
          <Button variant="contained" onClick={() => void submitAccEdit()}>
            Save changes
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirm !== null} onClose={() => setConfirm(null)}>
        <DialogTitle>{confirm?.title}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {confirm?.detail}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirm(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => void runConfirmedDelete()}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

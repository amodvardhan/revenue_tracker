import React, { useCallback, useEffect, useMemo, useState } from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  type SelectChangeEvent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import type { CreateManagedUserPayload, UserDirectoryRow } from "../../app/services/appApi";
import { createManagedUser, listUsersDirectory } from "../../app/services/appApi";

const ROLE_OPTIONS: Array<{ value: CreateManagedUserPayload["role"]; label: string }> = [
  { value: "delivery_head", label: "Delivery head" },
  { value: "delivery_manager", label: "Delivery manager" },
  { value: "account_manager", label: "Account manager" },
  { value: "project_manager", label: "Project manager" }
];

function formatRoleLabel(role: string): string {
  return role.replace(/_/g, " ");
}

interface UserManagementPanelProps {
  notifySuccess: (message: string) => void;
  notifyError: (err: unknown) => void;
}

export function UserManagementPanel({ notifySuccess, notifyError }: UserManagementPanelProps): JSX.Element {
  const [users, setUsers] = useState<UserDirectoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<CreateManagedUserPayload["role"]>("delivery_manager");

  const loadUsers = useCallback(async () => {
    try {
      const rows = await listUsersDirectory();
      setUsers(rows);
    } catch (err) {
      notifyError(err);
    } finally {
      setLoading(false);
    }
  }, [notifyError]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const sorted = useMemo(
    () => [...users].sort((a, b) => a.name.localeCompare(b.name) || a.email.localeCompare(b.email)),
    [users]
  );

  async function submitCreate(): Promise<void> {
    if (!email.trim() || !fullName.trim() || password.length < 8) {
      notifyError(new Error("Enter name, valid email, and a password with at least 8 characters."));
      return;
    }
    setPending(true);
    try {
      await createManagedUser({
        email: email.trim(),
        password,
        name: fullName.trim(),
        role
      });
      notifySuccess("User created. They can sign in immediately.");
      setDialogOpen(false);
      setEmail("");
      setPassword("");
      setFullName("");
      setRole("delivery_manager");
      await loadUsers();
    } catch (err) {
      notifyError(err);
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
        Loading users…
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
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "primary.main", mb: 1 }}>
          Administrator controls
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
          Create operational users here. Only admins see this tab. New users receive standard sign-in access with the
          role you assign—use delivery head for business unit ownership, delivery manager and account manager for account
          assignments, and project manager for delivery execution views.
        </Typography>
      </Paper>

      <Box>
        <Button
          variant="contained"
          size="large"
          startIcon={<AddRoundedIcon />}
          onClick={() => setDialogOpen(true)}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
        >
          Add user
        </Button>
      </Box>

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.map((u) => (
              <TableRow key={u.id} hover>
                <TableCell sx={{ fontWeight: 600 }}>{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Chip size="small" label={formatRoleLabel(u.role)} variant="outlined" sx={{ fontWeight: 600 }} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add user</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              fullWidth
              autoFocus
              required
            />
            <TextField
              label="Work email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
              autoComplete="off"
            />
            <TextField
              label="Initial password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              helperText="At least 8 characters. Share securely with the user."
              fullWidth
              autoComplete="new-password"
            />
            <FormControl fullWidth>
              <InputLabel id="create-user-role">Role</InputLabel>
              <Select
                labelId="create-user-role"
                label="Role"
                value={role}
                onChange={(e: SelectChangeEvent<CreateManagedUserPayload["role"]>) =>
                  setRole(e.target.value as CreateManagedUserPayload["role"])
                }
              >
                {ROLE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button variant="contained" onClick={() => void submitCreate()} disabled={pending}>
            {pending ? "Creating…" : "Create user"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

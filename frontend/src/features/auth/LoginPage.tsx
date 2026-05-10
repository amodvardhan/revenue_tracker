import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";

import { useSession } from "../../app/SessionContext";
import { login as apiLogin } from "../app/services/appApi";

export function LoginPage(): JSX.Element {
  const { session, login } = useSession();
  const navigate = useNavigate();
  const [email, setEmail] = useState("delivery.manager@demo.com");
  const [password, setPassword] = useState("Password@123");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (session) {
      navigate("/dashboard", { replace: true });
    }
  }, [session, navigate]);

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const response = await apiLogin(email.trim(), password);
      login(response);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: 6,
        background: (theme) =>
          `radial-gradient(1200px 600px at 50% -10%, ${alpha(theme.palette.primary.main, 0.08)}, transparent 55%), linear-gradient(180deg, ${theme.palette.background.default} 0%, ${alpha("#e8e8ed", 0.85)} 100%)`
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 5 },
            maxWidth: 420,
            mx: "auto",
            borderRadius: "20px",
            border: "1px solid",
            borderColor: "divider",
            boxShadow: (theme) =>
              `0 24px 80px ${alpha(theme.palette.common.black, 0.06)}, 0 1px 0 ${alpha(theme.palette.common.black, 0.04)}`
          }}
        >
          <Typography
            component="h1"
            variant="h5"
            sx={{
              fontWeight: 600,
              letterSpacing: "-0.028em",
              mb: 1
            }}
          >
            Sign in
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.55 }}>
            Enter your work email and password to continue.
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {error ? (
              <Alert severity="error" variant="outlined">
                {error}
              </Alert>
            ) : null}
            <TextField
              label="Email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              fullWidth
              margin="none"
            />
            <TextField
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              fullWidth
              margin="none"
            />
            <Button type="submit" disabled={pending} size="large" sx={{ mt: 1 }}>
              {pending ? "Signing in…" : "Continue"}
            </Button>
          </Box>
        </Paper>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 3, opacity: 0.85, display: "block", textAlign: "center" }}>
          Revenue Tracker
        </Typography>
      </Container>
    </Box>
  );
}

import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Stack,
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
        flexDirection: { xs: "column", md: "row" },
        bgcolor: "background.default"
      }}
    >
      <Box
        sx={{
          position: "relative",
          flex: { md: "1 1 52%" },
          minHeight: { xs: 280, md: "auto" },
          overflow: "hidden",
          px: { xs: 3, sm: 5, md: 6 },
          py: { xs: 5, md: 8 },
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          color: "#fff",
          background: (theme) =>
            [
              `radial-gradient(900px 520px at 15% -8%, ${alpha("#ffffff", 0.22)}, transparent 58%)`,
              `radial-gradient(720px 500px at 92% 18%, ${alpha("#7eb7ff", 0.35)}, transparent 52%)`,
              `linear-gradient(165deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 42%, #001a3d 100%)`
            ].join(", ")
        }}
      >
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            opacity: 0.35,
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")",
            mixBlendMode: "overlay",
            pointerEvents: "none"
          }}
        />
        <Stack spacing={3} sx={{ position: "relative", maxWidth: 520 }}>
          <Stack spacing={1.25}>
            <Typography
              variant="overline"
              sx={{
                color: alpha("#ffffff", 0.72),
                letterSpacing: "0.12em",
                fontWeight: 600
              }}
            >
              Revenue Tracker
            </Typography>
            <Typography
              component="p"
              variant="h3"
              sx={{
                color: "#fff",
                fontWeight: 600,
                letterSpacing: "-0.03em",
                lineHeight: 1.05,
                fontSize: { xs: "2rem", sm: "2.375rem", md: "2.75rem" }
              }}
            >
              Numbers that stay honest.
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: alpha("#ffffff", 0.82),
                fontWeight: 500,
                letterSpacing: "-0.015em",
                lineHeight: 1.55,
                maxWidth: 440,
                fontSize: "1.0625rem"
              }}
            >
              Sign in to review portfolio performance, attendance, and revenue in one calm workspace.
            </Typography>
          </Stack>
        </Stack>
        <Typography
          variant="body2"
          sx={{
            position: "relative",
            mt: { xs: 4, md: 0 },
            color: alpha("#ffffff", 0.45),
            fontWeight: 500,
            letterSpacing: "-0.01em"
          }}
        >
          © Revenue Tracker
        </Typography>
      </Box>

      <Box
        sx={{
          flex: { md: "1 1 48%" },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: { xs: 2.5, sm: 4 },
          py: { xs: 4, md: 6 },
          bgcolor: (theme) => alpha(theme.palette.background.paper, 1),
          borderLeft: { md: "1px solid" },
          borderColor: { md: "divider" },
          boxShadow: { md: (theme) => `-32px 0 80px ${alpha(theme.palette.common.black, 0.04)}` }
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 400 }}>
          <Typography
            component="h1"
            variant="h5"
            sx={{
              fontWeight: 600,
              letterSpacing: "-0.028em",
              mb: 0.75
            }}
          >
            Sign in
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3.5, fontWeight: 500, lineHeight: 1.55 }}>
            Use your work credentials. Your session stays on this device until you sign out.
          </Typography>
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2.25}>
              {error ? (
                <Alert severity="error" variant="outlined">
                  {error}
                </Alert>
              ) : null}
              <TextField
                label="Email"
                type="email"
                autoComplete="username"
                autoFocus
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
              <Button type="submit" disabled={pending} fullWidth size="large" sx={{ mt: 1, py: 1.35 }}>
                {pending ? "Signing in…" : "Continue"}
              </Button>
            </Stack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
